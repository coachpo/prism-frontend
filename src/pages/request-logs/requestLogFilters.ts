import type { RequestLogEntry } from "@/lib/types";
import { hasSpecialTokenValue, rowHasAnySpecialToken } from "./formatters";
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
  // Early exit for triage filters (most selective)
  if (filters.triage === "errors_only" && log.status_code < 400) return false;
  if (filters.triage === "unpriced_only" && log.priced_flag) return false;

  // Outcome filter (highly selective)
  if (filters.outcomeFilter === "success" && log.status_code >= 400) return false;
  if (filters.outcomeFilter === "error" && log.status_code < 400) return false;

  // Boolean flags (cheap checks)
  if (filters.showPricedOnly && !log.priced_flag) return false;
  if (filters.showBillableOnly && !log.billable_flag) return false;

  // Stream filter (cheap check)
  if (filters.streamFilter === "stream" && !log.is_stream) return false;
  if (filters.streamFilter === "non_stream" && log.is_stream) return false;

  // Token range filters (cheap numeric comparisons)
  const totalTokens = log.total_tokens ?? 0;
  if (filters.tokenMin !== null && totalTokens < filters.tokenMin) return false;
  if (filters.tokenMax !== null && totalTokens > filters.tokenMax) return false;

  // Latency bucket (inlined for performance)
  const bucket = filters.latencyBucket;
  if (bucket !== "all") {
    const ms = log.response_time_ms;
    if (bucket === "under_500ms" && ms >= 500) return false;
    if (bucket === "between_500ms_1s" && (ms < 500 || ms >= 1000)) return false;
    if (bucket === "between_1s_3s" && (ms < 1000 || ms >= 3000)) return false;
    if (bucket === "over_3s" && ms < 3000) return false;
  }

  // Special token filters (only check if not "all")
  if (filters.specialTokenFilter !== "all") {
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
  }

  // Search query (most expensive - do last)
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    const modelId = log.model_id.toLowerCase();
    const providerType = log.provider_type.toLowerCase();
    const endpointLabel = (log.endpoint_description || log.endpoint_base_url || "").toLowerCase();
    const errorDetail = (log.error_detail || "").toLowerCase();
    const statusCode = String(log.status_code);
    const id = String(log.id);

    const matches =
      modelId.includes(query) ||
      providerType.includes(query) ||
      endpointLabel.includes(query) ||
      errorDetail.includes(query) ||
      statusCode.includes(query) ||
      id.includes(query);
    if (!matches) return false;
  }

  return true;
}

export function sortRequestLogRows(
  rows: RequestLogEntry[],
  triage: TriageFilter
): RequestLogEntry[] {
  if (triage === "none") {
    return rows;
  }

  // Extract sort key function to avoid repeated triage checks in comparator
  const getSortKey = (log: RequestLogEntry): number => {
    if (triage === "slowest") {
      return log.response_time_ms;
    }
    if (triage === "expensive") {
      return log.total_cost_user_currency_micros || 0;
    }
    if (triage === "most_tokens") {
      return log.total_tokens || 0;
    }
    return 0;
  };

  return [...rows].sort((a, b) => getSortKey(b) - getSortKey(a));
}
