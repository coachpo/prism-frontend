import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  DEFAULT_REQUEST_LIMIT,
  LATENCY_BUCKETS,
  REQUEST_DETAIL_TABS,
  REQUEST_OUTCOME_FILTERS,
  REQUEST_SPECIAL_TOKEN_FILTERS,
  REQUEST_STREAM_FILTERS,
  REQUEST_TIME_RANGES,
  TRIAGE_OPTIONS,
  VIEW_OPTIONS,
  parseBooleanParam,
  parseEnumParam,
  parseIdFilterParam,
  parseNonNegativeIntParam,
  parseOptionalNumber,
  parsePositiveIntParam,
  parseRequestLimitParam,
  type LatencyBucket,
  type OutcomeFilter,
  type RequestDetailTab,
  type SpecialTokenFilter,
  type StreamFilter,
  type TimeRange,
  type TriageFilter,
  type ViewType,
} from "./queryParams";

type SearchParamMutator = (next: URLSearchParams) => void;
type BooleanStateUpdate = boolean | ((prev: boolean) => boolean);
type SearchParamUpdateOptions = {
  resetOffset?: boolean;
};

function getStringParam(value: string | null, fallback: string): string {
  if (!value) {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

export function useRequestLogPageState() {
  const [searchParams, setSearchParams] = useSearchParams();

  const updateSearchParams = (
    mutate: SearchParamMutator,
    options?: SearchParamUpdateOptions
  ) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        mutate(next);
        if (options?.resetOffset) {
          next.delete("offset");
        }
        return next.toString() === prev.toString() ? prev : next;
      },
      { replace: true }
    );
  };

  const resolveBooleanUpdate = (
    value: BooleanStateUpdate,
    current: boolean
  ): boolean => (typeof value === "function" ? value(current) : value);

  const modelId = getStringParam(searchParams.get("model_id"), "__all__");
  const providerType = getStringParam(searchParams.get("provider_type"), "all");
  const connectionId = parseIdFilterParam(searchParams.get("connection_id"));
  const endpointId = parseIdFilterParam(searchParams.get("endpoint_id"));
  const timeRange = parseEnumParam(searchParams.get("time_range"), REQUEST_TIME_RANGES, "24h");
  const specialTokenFilter = parseEnumParam(
    searchParams.get("special_token_filter"),
    REQUEST_SPECIAL_TOKEN_FILTERS,
    "all"
  );
  const outcomeFilter = parseEnumParam(
    searchParams.get("outcome_filter"),
    REQUEST_OUTCOME_FILTERS,
    "all"
  );
  const streamFilter = parseEnumParam(
    searchParams.get("stream_filter"),
    REQUEST_STREAM_FILTERS,
    "all"
  );
  const limit = parseRequestLimitParam(searchParams.get("limit"));
  const offset = parseNonNegativeIntParam(searchParams.get("offset"), 0);
  const view = parseEnumParam(
    searchParams.get("view"),
    VIEW_OPTIONS.map((option) => option.value),
    "overview"
  );
  const triage = parseEnumParam(
    searchParams.get("triage"),
    ["none", ...TRIAGE_OPTIONS.map((option) => option.value)],
    "none"
  );
  const searchQuery = searchParams.get("search") || "";
  const latencyBucket = parseEnumParam(
    searchParams.get("latency_bucket"),
    LATENCY_BUCKETS.map((bucket) => bucket.value),
    "all"
  );
  const showPricedOnly = parseBooleanParam(searchParams.get("priced_only"));
  const showBillableOnly = parseBooleanParam(searchParams.get("billable_only"));
  const tokenMin = parseOptionalNumber(searchParams.get("token_min"));
  const tokenMax = parseOptionalNumber(searchParams.get("token_max"));
  const requestId = parsePositiveIntParam(searchParams.get("request_id"));
  const detailTab = parseEnumParam(searchParams.get("detail_tab"), REQUEST_DETAIL_TABS, "overview");

  const [tokenMinInput, setTokenMinInput] = useState(() =>
    tokenMin !== null && tokenMin !== undefined ? String(tokenMin) : ""
  );
  const [tokenMaxInput, setTokenMaxInput] = useState(() =>
    tokenMax !== null && tokenMax !== undefined ? String(tokenMax) : ""
  );

  useEffect(() => {
    const nextTokenMinInput = tokenMin === null ? "" : String(tokenMin);
    const nextTokenMaxInput = tokenMax === null ? "" : String(tokenMax);

    queueMicrotask(() => {
      setTokenMinInput((current) => (current === nextTokenMinInput ? current : nextTokenMinInput));
      setTokenMaxInput((current) => (current === nextTokenMaxInput ? current : nextTokenMaxInput));
    });
  }, [tokenMax, tokenMin]);

  const setModelId = (value: string) => {
    updateSearchParams(
      (next) => {
        if (!value || value === "__all__") next.delete("model_id");
        else next.set("model_id", value);
      },
      { resetOffset: true }
    );
  };

  const setProviderType = (value: string) => {
    updateSearchParams(
      (next) => {
        if (!value || value === "all") next.delete("provider_type");
        else next.set("provider_type", value);
      },
      { resetOffset: true }
    );
  };

  const setConnectionId = (value: string) => {
    updateSearchParams(
      (next) => {
        if (!value || value === "__all__") next.delete("connection_id");
        else next.set("connection_id", value);
      },
      { resetOffset: true }
    );
  };

  const setEndpointId = (value: string) => {
    updateSearchParams(
      (next) => {
        if (!value || value === "__all__") next.delete("endpoint_id");
        else next.set("endpoint_id", value);
      },
      { resetOffset: true }
    );
  };

  const setTimeRange = (value: TimeRange) => {
    updateSearchParams(
      (next) => {
        if (value === "24h") next.delete("time_range");
        else next.set("time_range", value);
      },
      { resetOffset: true }
    );
  };

  const setSpecialTokenFilter = (value: SpecialTokenFilter) => {
    updateSearchParams(
      (next) => {
        if (value === "all") next.delete("special_token_filter");
        else next.set("special_token_filter", value);
      },
      { resetOffset: true }
    );
  };

  const setOutcomeFilter = (value: OutcomeFilter) => {
    updateSearchParams(
      (next) => {
        if (value === "all") next.delete("outcome_filter");
        else next.set("outcome_filter", value);
      },
      { resetOffset: true }
    );
  };

  const setStreamFilter = (value: StreamFilter) => {
    updateSearchParams(
      (next) => {
        if (value === "all") next.delete("stream_filter");
        else next.set("stream_filter", value);
      },
      { resetOffset: true }
    );
  };

  const setLimit = (value: number) => {
    updateSearchParams(
      (next) => {
        if (value === DEFAULT_REQUEST_LIMIT) next.delete("limit");
        else next.set("limit", String(value));
      },
      { resetOffset: true }
    );
  };

  const setOffset = (value: number) => {
    updateSearchParams((next) => {
      if (value <= 0) next.delete("offset");
      else next.set("offset", String(value));
    });
  };

  const setView = (value: ViewType) => {
    updateSearchParams((next) => {
      if (value === "overview") next.delete("view");
      else next.set("view", value);
    });
  };

  const setTriage = (value: TriageFilter) => {
    updateSearchParams(
      (next) => {
        if (value === "none") next.delete("triage");
        else next.set("triage", value);
      },
      { resetOffset: true }
    );
  };

  const setSearchQuery = (value: string) => {
    updateSearchParams(
      (next) => {
        if (!value) next.delete("search");
        else next.set("search", value);
      },
      { resetOffset: true }
    );
  };

  const setLatencyBucket = (value: LatencyBucket) => {
    updateSearchParams(
      (next) => {
        if (value === "all") next.delete("latency_bucket");
        else next.set("latency_bucket", value);
      },
      { resetOffset: true }
    );
  };

  const setShowPricedOnly = (value: BooleanStateUpdate) => {
    updateSearchParams(
      (next) => {
        if (resolveBooleanUpdate(value, showPricedOnly)) next.set("priced_only", "true");
        else next.delete("priced_only");
      },
      { resetOffset: true }
    );
  };

  const setShowBillableOnly = (value: BooleanStateUpdate) => {
    updateSearchParams(
      (next) => {
        if (resolveBooleanUpdate(value, showBillableOnly)) next.set("billable_only", "true");
        else next.delete("billable_only");
      },
      { resetOffset: true }
    );
  };

  const setTokenMin = (value: number | null) => {
    updateSearchParams(
      (next) => {
        if (value === null) next.delete("token_min");
        else next.set("token_min", String(value));
      },
      { resetOffset: true }
    );
  };

  const setTokenMax = (value: number | null) => {
    updateSearchParams(
      (next) => {
        if (value === null) next.delete("token_max");
        else next.set("token_max", String(value));
      },
      { resetOffset: true }
    );
  };

  const clearRequestFocus = () => {
    updateSearchParams((next) => {
      next.delete("request_id");
      next.delete("detail_tab");
    });
  };

  const setDetailTab = (value: RequestDetailTab) => {
    updateSearchParams((next) => {
      if (requestId === null || value === "overview") {
        next.delete("detail_tab");
      } else {
        next.set("detail_tab", value);
      }
    });
  };

  const clearAllFilters = () => {
    setTokenMinInput("");
    setTokenMaxInput("");
    updateSearchParams((next) => {
      next.delete("request_id");
      next.delete("detail_tab");
      next.delete("search");
      next.delete("triage");
      next.delete("latency_bucket");
      next.delete("token_min");
      next.delete("token_max");
      next.delete("priced_only");
      next.delete("billable_only");
      next.delete("outcome_filter");
      next.delete("stream_filter");
      next.delete("special_token_filter");
      next.delete("model_id");
      next.delete("provider_type");
      next.delete("connection_id");
      next.delete("endpoint_id");
      next.delete("time_range");
      next.delete("view");
      next.delete("offset");
    });
  };

  return {
    clearAllFilters,
    clearRequestFocus,
    connectionId,
    detailTab,
    endpointId,
    latencyBucket,
    limit,
    modelId,
    offset,
    outcomeFilter,
    providerType,
    requestId,
    searchQuery,
    setConnectionId,
    setDetailTab,
    setEndpointId,
    setLatencyBucket,
    setLimit,
    setModelId,
    setOffset,
    setOutcomeFilter,
    setProviderType,
    setSearchQuery,
    setShowBillableOnly,
    setShowPricedOnly,
    setSpecialTokenFilter,
    setStreamFilter,
    setTimeRange,
    setTokenMax,
    setTokenMaxInput,
    setTokenMin,
    setTokenMinInput,
    setTriage,
    setView,
    showBillableOnly,
    showPricedOnly,
    specialTokenFilter,
    streamFilter,
    timeRange,
    tokenMax,
    tokenMaxInput,
    tokenMin,
    tokenMinInput,
    triage,
    view,
  };
}

export type RequestLogPageState = ReturnType<typeof useRequestLogPageState>;
