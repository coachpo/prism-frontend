import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  DEFAULTS,
  parsePageState,
  type StatusFamilyFilter,
  stateToParams,
  type DetailTab,
  type LatencyBucket,
  type OutcomeFilter,
  type RequestLogPageState,
  type StreamFilter,
  type TimeRange,
  type ViewMode,
} from "./queryParams";

export function useRequestLogPageState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useMemo(() => parsePageState(searchParams), [searchParams]);

  const update = useCallback(
    (patch: Partial<RequestLogPageState>, resetOffset = true) => {
      setSearchParams(
        (prev) => {
          const current = parsePageState(prev);
          const next = { ...current, ...patch };
          if (resetOffset && !("offset" in patch)) next.offset = DEFAULTS.offset;
          return stateToParams(next);
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const setModelId = useCallback((v: string) => update({ model_id: v }), [update]);
  const setProviderType = useCallback((v: string) => update({ provider_type: v }), [update]);
  const setConnectionId = useCallback((v: string) => update({ connection_id: v }), [update]);
  const setEndpointId = useCallback((v: string) => update({ endpoint_id: v }), [update]);
  const setTimeRange = useCallback((v: TimeRange) => update({ time_range: v }), [update]);
  const setStatusFamily = useCallback((v: StatusFamilyFilter) => update({ status_family: v }), [update]);
  const setSearch = useCallback((v: string) => update({ search: v }, false), [update]);
  const setOutcomeFilter = useCallback((v: OutcomeFilter) => update({ outcome_filter: v }, false), [update]);
  const setStreamFilter = useCallback((v: StreamFilter) => update({ stream_filter: v }, false), [update]);
  const setLatencyBucket = useCallback((v: LatencyBucket) => update({ latency_bucket: v }, false), [update]);
  const setTokenMin = useCallback((v: string) => update({ token_min: v }, false), [update]);
  const setTokenMax = useCallback((v: string) => update({ token_max: v }, false), [update]);
  const setSpecialTokenFilter = useCallback((v: string) => update({ special_token_filter: v }, false), [update]);
  const setPricedOnly = useCallback((v: boolean) => update({ priced_only: v }, false), [update]);
  const setBillableOnly = useCallback((v: boolean) => update({ billable_only: v }, false), [update]);
  const setView = useCallback((v: ViewMode) => update({ view: v }, false), [update]);
  const setTriage = useCallback((v: boolean) => update({ triage: v }, false), [update]);
  const setLimit = useCallback((v: number) => update({ limit: v, offset: DEFAULTS.offset }), [update]);
  const setOffset = useCallback((v: number) => update({ offset: v }, false), [update]);

  const selectRequest = useCallback(
    (id: number, tab: DetailTab = "overview") => update({ request_id: String(id), detail_tab: tab }, false),
    [update]
  );

  const clearRequest = useCallback(
    () => update({ request_id: "", detail_tab: DEFAULTS.detail_tab }, false),
    [update]
  );

  const setDetailTab = useCallback(
    (tab: DetailTab) => update({ detail_tab: tab }, false),
    [update]
  );

  const clearFilters = useCallback(() => {
    setSearchParams(stateToParams({
      ...parsePageState(new URLSearchParams()),
      request_id: state.request_id,
      detail_tab: state.detail_tab,
    }), { replace: true });
  }, [setSearchParams, state.request_id, state.detail_tab]);

  const goToNextPage = useCallback(
    (total: number) => {
      if (state.offset + state.limit < total) setOffset(state.offset + state.limit);
    },
    [state.offset, state.limit, setOffset]
  );

  const goToPreviousPage = useCallback(() => {
    if (state.offset > 0) setOffset(Math.max(0, state.offset - state.limit));
  }, [state.offset, state.limit, setOffset]);

  const isExactMode = state.request_id !== "";

  const hasActiveFilters = !!(
    state.ingress_request_id ||
    state.model_id ||
    state.provider_type ||
    state.connection_id ||
    state.endpoint_id ||
    state.time_range !== DEFAULTS.time_range ||
    state.status_family !== DEFAULTS.status_family ||
    state.search ||
    state.outcome_filter !== DEFAULTS.outcome_filter ||
    state.stream_filter !== DEFAULTS.stream_filter ||
    state.latency_bucket !== DEFAULTS.latency_bucket ||
    state.token_min ||
    state.token_max ||
    state.priced_only ||
    state.billable_only ||
    state.special_token_filter ||
    state.triage
  );

  return {
    state,
    isExactMode,
    hasActiveFilters,
    setModelId,
    setProviderType,
    setConnectionId,
    setEndpointId,
    setTimeRange,
    setStatusFamily,
    setSearch,
    setOutcomeFilter,
    setStreamFilter,
    setLatencyBucket,
    setTokenMin,
    setTokenMax,
    setSpecialTokenFilter,
    setPricedOnly,
    setBillableOnly,
    setView,
    setTriage,
    setLimit,
    setOffset,
    selectRequest,
    clearRequest,
    setDetailTab,
    clearFilters,
    goToNextPage,
    goToPreviousPage,
  };
}

export type RequestLogPageActions = ReturnType<typeof useRequestLogPageState>;
