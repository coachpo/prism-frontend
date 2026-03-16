import type {
  ConnectionDropdownItem,
  StatisticsRequestLogEntry,
} from "@/lib/types";
import type { OperationsStatusFilter, SpecialTokenFilter } from "./queryParams";

export interface TimeBucket {
  label: string;
  requests: number;
  errors: number;
  avgLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  status2xx: number;
  status4xx: number;
  status5xx: number;
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
}

export function getConnectionLabel(
  connection: Pick<ConnectionDropdownItem, "id" | "name">
): string {
  return connection.name ?? "";
}

export function hasSpecialTokenValue(value: number | null | undefined): boolean {
  return value !== null && value !== undefined;
}

export function rowHasAnySpecialToken(log: StatisticsRequestLogEntry): boolean {
  return (
    hasSpecialTokenValue(log.cache_read_input_tokens) ||
    hasSpecialTokenValue(log.cache_creation_input_tokens) ||
    hasSpecialTokenValue(log.reasoning_tokens)
  );
}

export function matchesOperationsLogFilters(
  entry: StatisticsRequestLogEntry,
  specialTokenFilter: SpecialTokenFilter,
  operationsStatusFilter: OperationsStatusFilter
): boolean {
  if (specialTokenFilter === "has_cached" && !hasSpecialTokenValue(entry.cache_read_input_tokens)) {
    return false;
  }
  if (specialTokenFilter === "has_reasoning" && !hasSpecialTokenValue(entry.reasoning_tokens)) {
    return false;
  }
  if (specialTokenFilter === "has_any_special" && !rowHasAnySpecialToken(entry)) {
    return false;
  }
  if (specialTokenFilter === "missing_special" && rowHasAnySpecialToken(entry)) {
    return false;
  }

  if (operationsStatusFilter === "success") return entry.status_code < 400;
  if (operationsStatusFilter === "4xx") {
    return entry.status_code >= 400 && entry.status_code < 500;
  }
  if (operationsStatusFilter === "5xx") return entry.status_code >= 500;
  if (operationsStatusFilter === "error") return entry.status_code >= 400;
  return true;
}

export function parseErrorDetailMessage(detail: string | null): string {
  const fallback = "Unknown upstream error";
  if (!detail) return fallback;

  const trimmed = detail.trim();
  if (!trimmed) return fallback;

  try {
    const parsed = JSON.parse(trimmed);
    const message =
      parsed?.error?.message ??
      parsed?.error?.msg ??
      parsed?.detail ??
      parsed?.message;

    if (typeof message === "string" && message.trim().length > 0) {
      return message.trim();
    }
  } catch {
    // keep raw detail for non-JSON payloads
  }

  return trimmed;
}

export function bucketLogs(logs: StatisticsRequestLogEntry[], timeRange: string): TimeBucket[] {
  if (logs.length === 0) return [];

  const sorted = [...logs].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const bucketMap = new Map<
    string,
    {
      requests: number;
      errors: number;
      latencies: number[];
      status2xx: number;
      status4xx: number;
      status5xx: number;
      inputTokens: number;
      outputTokens: number;
      totalCost: number;
    }
  >();

  for (const log of sorted) {
    const d = new Date(log.created_at);
    let key: string;
    if (timeRange === "1h") {
      const mins = d.getMinutes();
      const bucket5 = Math.floor(mins / 5) * 5;
      key = `${d.getHours().toString().padStart(2, "0")}:${bucket5
        .toString()
        .padStart(2, "0")}`;
    } else if (timeRange === "24h") {
      key = `${d.getHours().toString().padStart(2, "0")}:00`;
    } else {
      key = `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d
        .getDate()
        .toString()
        .padStart(2, "0")}`;
    }

    const existing = bucketMap.get(key) ?? {
      requests: 0,
      errors: 0,
      latencies: [],
      status2xx: 0,
      status4xx: 0,
      status5xx: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalCost: 0,
    };
    existing.requests++;
    if (log.status_code >= 400) existing.errors++;
    existing.latencies.push(log.response_time_ms);

    if (log.status_code >= 200 && log.status_code < 300) existing.status2xx++;
    else if (log.status_code >= 400 && log.status_code < 500) existing.status4xx++;
    else if (log.status_code >= 500) existing.status5xx++;

    existing.inputTokens += log.input_tokens ?? 0;
    existing.outputTokens += log.output_tokens ?? 0;
    existing.totalCost += log.total_cost_user_currency_micros ?? 0;

    bucketMap.set(key, existing);
  }

  return Array.from(bucketMap.entries()).map(([label, data]) => {
    data.latencies.sort((a, b) => a - b);
    const p50 = data.latencies[Math.floor(data.latencies.length * 0.5)] || 0;
    const p95 = data.latencies[Math.floor(data.latencies.length * 0.95)] || 0;
    const p99 = data.latencies[Math.floor(data.latencies.length * 0.99)] || 0;
    const avg = Math.round(
      data.latencies.reduce((a, b) => a + b, 0) / data.requests
    );

    return {
      label,
      requests: data.requests,
      errors: data.errors,
      avgLatency: avg,
      p50Latency: p50,
      p95Latency: p95,
      p99Latency: p99,
      status2xx: data.status2xx,
      status4xx: data.status4xx,
      status5xx: data.status5xx,
      inputTokens: data.inputTokens,
      outputTokens: data.outputTokens,
      totalCost: data.totalCost,
    };
  });
}

export function toIsoFromDateInput(
  value: string,
  boundary: "start" | "end" = "start"
): string | undefined {
  if (!value) return undefined;
  const parts = value.split("-");
  if (parts.length !== 3) return undefined;
  const [year, month, day] = parts.map((part) => Number.parseInt(part, 10));
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return undefined;
  }

  const parsed = new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      boundary === "end" ? 23 : 0,
      boundary === "end" ? 59 : 0,
      boundary === "end" ? 59 : 0,
      boundary === "end" ? 999 : 0
    )
  );
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}
