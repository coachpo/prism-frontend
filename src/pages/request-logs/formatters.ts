import type { ConnectionDropdownItem, RequestLogEntry } from "@/lib/types";
import type { LatencyBucket } from "./queryParams";

export const UNIVERSAL_TIMESTAMP_FORMAT: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
  hour12: true,
};

export function hasSpecialTokenValue(value: number | null | undefined): boolean {
  return value !== null && value !== undefined;
}

export function rowHasAnySpecialToken(log: RequestLogEntry): boolean {
  return (
    hasSpecialTokenValue(log.cache_read_input_tokens) ||
    hasSpecialTokenValue(log.cache_creation_input_tokens) ||
    hasSpecialTokenValue(log.reasoning_tokens)
  );
}

export function getConnectionLabel(connection: Pick<ConnectionDropdownItem, "id" | "name">): string {
  return connection.name ?? "";
}

export function getDisplayCurrency(log: Pick<RequestLogEntry, "report_currency_symbol" | "report_currency_code">): {
  symbol: string;
  code: string | undefined;
} {
  return {
    symbol: log.report_currency_symbol ?? "$",
    code: log.report_currency_code ?? undefined,
  };
}

export function formatErrorDetail(detail: string | null): string | null {
  if (!detail) return null;
  try {
    const parsed = JSON.parse(detail);
    const msg = parsed?.error?.message || parsed?.error?.msg || parsed?.detail || parsed?.message;
    if (msg) return String(msg);
    return detail;
  } catch {
    return detail;
  }
}

export function formatLatency(ms: number): string {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(ms >= 10000 ? 1 : 2)}s`;
  }
  return `${ms.toFixed(0)}ms`;
}

export function matchesLatencyBucket(bucket: LatencyBucket, responseTimeMs: number): boolean {
  if (bucket === "all") return true;
  if (bucket === "under_500ms") return responseTimeMs < 500;
  if (bucket === "between_500ms_1s") return responseTimeMs >= 500 && responseTimeMs < 1000;
  if (bucket === "between_1s_3s") return responseTimeMs >= 1000 && responseTimeMs < 3000;
  return responseTimeMs >= 3000;
}

export function metricUnavailableReason(log: Pick<RequestLogEntry, "status_code" | "is_stream">, value: number | null | undefined): string {
  if (value !== null && value !== undefined) {
    return "";
  }
  if (log.status_code >= 400) {
    return "request failed before usage accounting";
  }
  if (log.is_stream) {
    return "stream ended without usage event";
  }
  return "upstream did not report this metric";
}
