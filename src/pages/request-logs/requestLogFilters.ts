import type { RequestLogEntry } from "@/lib/types";
import { hasSpecialTokenValue, matchesLatencyBucket, rowHasAnySpecialToken } from "./formatters";
import type {
  LatencyBucket,
  OutcomeFilter,
  SpecialTokenFilter,
  StreamFilter,
  TriageFilter,
} from "./queryParams";

export type ActiveRequestLogFilters = {
  connectionId: string;
  endpointId: string;
  modelId: string;
  providerType: string;
};

export type ClientRequestLogFilters = {
  latencyBucket: LatencyBucket;
  outcomeFilter: OutcomeFilter;
  searchQuery: string;
  showBillableOnly: boolean;
  showPricedOnly: boolean;
  specialTokenFilter: SpecialTokenFilter;
  streamFilter: StreamFilter;
  tokenMax: number | null;
  tokenMin: number | null;
  triage: TriageFilter;
};

export function matchesActiveRequestLogFilters(
  entry: RequestLogEntry,
  filters: ActiveRequestLogFilters
): boolean {
  if (filters.modelId !== "__all__" && entry.model_id !== filters.modelId) return false;
  if (filters.providerType !== "all" && entry.provider_type !== filters.providerType) return false;
  if (filters.connectionId !== "__all__" && entry.connection_id !== Number(filters.connectionId)) {
    return false;
  }
  if (filters.endpointId !== "__all__" && entry.endpoint_id !== Number(filters.endpointId)) {
    return false;
  }
  return true;
}

export function matchesClientRequestLogFilters(
  log: RequestLogEntry,
  filters: ClientRequestLogFilters
): boolean {
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    const endpointLabel = log.endpoint_description || log.endpoint_base_url || "";
    const matches =
      log.model_id.toLowerCase().includes(query) ||
      log.provider_type.toLowerCase().includes(query) ||
      endpointLabel.toLowerCase().includes(query) ||
      (log.error_detail || "").toLowerCase().includes(query) ||
      String(log.status_code).includes(query) ||
      String(log.id).includes(query);
    if (!matches) return false;
  }

  if (!matchesLatencyBucket(filters.latencyBucket, log.response_time_ms)) return false;

  const totalTokens = log.total_tokens ?? 0;
  if (filters.tokenMin !== null && totalTokens < filters.tokenMin) return false;
  if (filters.tokenMax !== null && totalTokens > filters.tokenMax) return false;

  if (filters.showPricedOnly && !log.priced_flag) return false;
  if (filters.showBillableOnly && !log.billable_flag) return false;

  if (
    filters.specialTokenFilter === "has_cached" &&
    !hasSpecialTokenValue(log.cache_read_input_tokens)
  ) {
    return false;
  }
  if (
    filters.specialTokenFilter === "has_reasoning" &&
    !hasSpecialTokenValue(log.reasoning_tokens)
  ) {
    return false;
  }
  if (
    filters.specialTokenFilter === "has_any_special" &&
    !rowHasAnySpecialToken(log)
  ) {
    return false;
  }
  if (
    filters.specialTokenFilter === "missing_special" &&
    rowHasAnySpecialToken(log)
  ) {
    return false;
  }

  if (filters.outcomeFilter === "success" && log.status_code >= 400) return false;
  if (filters.outcomeFilter === "error" && log.status_code < 400) return false;

  if (filters.streamFilter === "stream" && !log.is_stream) return false;
  if (filters.streamFilter === "non_stream" && log.is_stream) return false;

  if (filters.triage === "errors_only" && log.status_code < 400) return false;
  if (filters.triage === "unpriced_only" && log.priced_flag) return false;

  return true;
}

export function sortRequestLogRows(
  rows: RequestLogEntry[],
  triage: TriageFilter
): RequestLogEntry[] {
  if (triage === "none") {
    return rows;
  }

  return [...rows].sort((a, b) => {
    if (triage === "slowest") {
      return b.response_time_ms - a.response_time_ms;
    }
    if (triage === "expensive") {
      return (b.total_cost_user_currency_micros || 0) - (a.total_cost_user_currency_micros || 0);
    }
    if (triage === "most_tokens") {
      return (b.total_tokens || 0) - (a.total_tokens || 0);
    }
    return 0;
  });
}
