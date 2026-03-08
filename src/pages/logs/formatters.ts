import type { BadgeIntent } from "@/components/StatusBadge";
import type { ConnectionDropdownItem, RequestLogEntry } from "@/lib/types";
import type { LatencyBucket, StatusFamily } from "./queryParams";

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
  return connection.name ?? `Connection ${connection.id}`;
}

export function getDisplayCurrency(log: Pick<RequestLogEntry, "report_currency_symbol" | "report_currency_code">): {
  code: string | undefined;
  symbol: string;
} {
  return {
    code: log.report_currency_code ?? undefined,
    symbol: log.report_currency_symbol ?? "$",
  };
}

export function formatErrorDetail(detail: string | null): string | null {
  if (!detail) return null;
  try {
    const parsed = JSON.parse(detail);
    const message = parsed?.error?.message || parsed?.error?.msg || parsed?.detail || parsed?.message;
    return message ? String(message) : detail;
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

export function metricUnavailableReason(
  log: Pick<RequestLogEntry, "status_code" | "is_stream">,
  value: number | null | undefined
): string {
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

export function statusIntent(status: number): BadgeIntent {
  if (status >= 200 && status < 300) return "success";
  if (status >= 400 && status < 500) return "warning";
  if (status >= 500) return "danger";
  return "muted";
}

export function methodIntent(method: string): BadgeIntent {
  switch (method.toUpperCase()) {
    case "GET":
      return "blue";
    case "POST":
      return "success";
    case "PUT":
      return "warning";
    case "DELETE":
      return "danger";
    default:
      return "muted";
  }
}

export function formatRequestPath(requestUrl: string): string {
  try {
    const url = new URL(requestUrl);
    return `${url.pathname}${url.search}`;
  } catch {
    return requestUrl;
  }
}

export function formatJson(raw: string | null): string {
  if (!raw) return "";
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

export function matchesStatusFamily(statusCode: number, family: StatusFamily): boolean {
  if (family === "all") return true;
  if (family === "2xx") return statusCode >= 200 && statusCode < 300;
  if (family === "4xx") return statusCode >= 400 && statusCode < 500;
  if (family === "5xx") return statusCode >= 500;
  return statusCode >= 400;
}

export function toDatetimeLocalValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
