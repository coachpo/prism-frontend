import type { RequestLogListItem } from "@/lib/types";
import type { LatencyBucket, OutcomeFilter, StreamFilter } from "./queryParams";

const LATENCY_THRESHOLDS: Record<LatencyBucket, [number, number]> = {
  all: [0, Infinity],
  fast: [0, 500],
  normal: [500, 2000],
  slow: [2000, 5000],
  very_slow: [5000, Infinity],
};

export function applyClientFilters(
  items: RequestLogListItem[],
  filters: {
    search: string;
    outcome_filter: OutcomeFilter;
    stream_filter: StreamFilter;
    latency_bucket: LatencyBucket;
    token_min: string;
    token_max: string;
    triage: boolean;
  }
): RequestLogListItem[] {
  let result = items;

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
        (r) =>
          r.model_id.toLowerCase().includes(q) ||
          (r.api_family?.toLowerCase().includes(q) ?? false) ||
          (r.vendor_name?.toLowerCase().includes(q) ?? false)
    );
  }

  if (filters.outcome_filter === "success") {
    result = result.filter((r) => r.status_code < 400);
  } else if (filters.outcome_filter === "error") {
    result = result.filter((r) => r.status_code >= 400);
  }

  if (filters.stream_filter === "yes") {
    result = result.filter((r) => r.is_stream);
  } else if (filters.stream_filter === "no") {
    result = result.filter((r) => !r.is_stream);
  }

  if (filters.latency_bucket !== "all") {
    const [min, max] = LATENCY_THRESHOLDS[filters.latency_bucket];
    result = result.filter((r) => r.response_time_ms >= min && r.response_time_ms < max);
  }

  if (filters.token_min) {
    const min = parseInt(filters.token_min, 10);
    if (Number.isFinite(min)) {
      result = result.filter((r) => (r.total_tokens ?? 0) >= min);
    }
  }

  if (filters.token_max) {
    const max = parseInt(filters.token_max, 10);
    if (Number.isFinite(max)) {
      result = result.filter((r) => (r.total_tokens ?? 0) <= max);
    }
  }

  if (filters.triage) {
    result = result.filter(
      (r) => r.status_code >= 400 || r.response_time_ms >= 3000
    );
  }

  return result;
}
