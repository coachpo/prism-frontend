import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useLocale } from "@/i18n/useLocale";
import type {
  UsageCostOverviewPoint,
  UsageRequestEventAvailableFilters,
  UsageRequestTrendSeries,
  UsageSnapshotRequestEventItem,
  UsageSnapshotResponse,
  UsageStatisticsPageState,
  UsageTokenTrendSeries,
  UsageTokenTypeBreakdownPoint,
} from "@/lib/types";
import { buildRequestLogIngressLink } from "./requestLogLinks";

interface UseUsageStatisticsPageDataParams {
  revision: number;
  selectedProfileId: number | null;
  state: UsageStatisticsPageState;
}

export interface UsageStatisticsRequestEventRow extends UsageSnapshotRequestEventItem {
  request_logs_href: string;
}

const EMPTY_REQUEST_EVENT_AVAILABLE_FILTERS: UsageRequestEventAvailableFilters = {
  api_families: [],
  endpoints: [],
  models: [],
  proxy_api_keys: [],
};

const ALL_MODELS_LABEL = "All Models";
const UNKNOWN_ENDPOINT_LABEL = "Unknown Endpoint";
const UNKNOWN_PROXY_API_KEY_LABEL = "Unknown Proxy API Key";

function collectModelLineIds(snapshot: UsageSnapshotResponse | null): string[] {
  if (!snapshot) {
    return [];
  }

  const keys = new Set<string>();

  for (const collection of [
    ...snapshot.request_trends.hourly,
    ...snapshot.request_trends.daily,
    ...snapshot.token_usage_trends.hourly,
    ...snapshot.token_usage_trends.daily,
  ]) {
    if (collection.key !== "all") {
      keys.add(collection.key);
    }
  }

  return [...keys].sort((left, right) => left.localeCompare(right));
}

function resolveSelectedModelLines(available: string[], selected: string[]): string[] {
  const validSelections = available.filter((modelId) => selected.includes(modelId));
  return validSelections.length > 0 ? validSelections : [];
}

function filterSeriesBySelectedModels<T extends { key: string }>(
  series: T[],
  selectedModelLines: string[],
): T[] {
  if (selectedModelLines.length === 0) {
    return series.filter((entry) => entry.key === "all");
  }

  return series.filter(
    (entry) => entry.key === "all" || selectedModelLines.includes(entry.key),
  );
}

export function useUsageStatisticsPageData({
  revision,
  selectedProfileId,
  state,
}: UseUsageStatisticsPageDataParams) {
  const { messages } = useLocale();
  const [snapshot, setSnapshot] = useState<UsageSnapshotResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const fetchSnapshot = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const nextSnapshot = await api.stats.usageSnapshot({ preset: state.selectedTimeRange });

      if (requestId !== requestIdRef.current) {
        return;
      }

      setSnapshot(nextSnapshot);
    } catch (fetchError) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setError(
        fetchError instanceof Error
          ? fetchError.message
          : messages.statistics.failedToLoadUsageStatistics,
      );
      setSnapshot(null);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [messages.statistics.failedToLoadUsageStatistics, state.selectedTimeRange]);

  const localizedSnapshot = useMemo<UsageSnapshotResponse | null>(() => {
    if (!snapshot) {
      return null;
    }

    const localizeSeriesLabel = (label: string, key: string) => {
      if (key === "all" || label === ALL_MODELS_LABEL) {
        return messages.statistics.allModels;
      }
      return label;
    };

    const localizeEndpointLabel = (label: string) => {
      if (label === UNKNOWN_ENDPOINT_LABEL) {
        return messages.modelDetail.unknownEndpoint;
      }
      return label;
    };

    const localizeProxyApiKeyLabel = (label: string | null) => {
      if (!label || label === UNKNOWN_PROXY_API_KEY_LABEL) {
        return messages.statistics.unknownProxyApiKey;
      }
      return label;
    };

    const availableFilters =
      snapshot.request_events.available_filters ?? EMPTY_REQUEST_EVENT_AVAILABLE_FILTERS;

    return {
      ...snapshot,
      endpoint_statistics: snapshot.endpoint_statistics.map((item) => ({
        ...item,
        endpoint_label: localizeEndpointLabel(item.endpoint_label),
      })),
      proxy_api_key_statistics: snapshot.proxy_api_key_statistics.map((item) => ({
        ...item,
        proxy_api_key_label: localizeProxyApiKeyLabel(item.proxy_api_key_label),
      })),
      request_events: {
        ...snapshot.request_events,
        available_filters: {
          ...availableFilters,
          endpoints: availableFilters.endpoints.map((item) => ({
            ...item,
            label: localizeEndpointLabel(item.label),
          })),
          models: availableFilters.models.map((item) => ({
            ...item,
            label: item.model_id === "all" || item.label === ALL_MODELS_LABEL ? messages.statistics.allModels : item.label,
          })),
          proxy_api_keys: availableFilters.proxy_api_keys.map((item) => ({
            ...item,
            label: localizeProxyApiKeyLabel(item.label),
          })),
        },
        items: snapshot.request_events.items.map((item) => ({
          ...item,
          endpoint_label: localizeEndpointLabel(item.endpoint_label),
          proxy_api_key: {
            ...item.proxy_api_key,
            label: localizeProxyApiKeyLabel(item.proxy_api_key.label),
          },
        })),
      },
      request_trends: {
        hourly: snapshot.request_trends.hourly.map((series) => ({
          ...series,
          label: localizeSeriesLabel(series.label, series.key),
        })),
        daily: snapshot.request_trends.daily.map((series) => ({
          ...series,
          label: localizeSeriesLabel(series.label, series.key),
        })),
      },
      token_usage_trends: {
        hourly: snapshot.token_usage_trends.hourly.map((series) => ({
          ...series,
          label: localizeSeriesLabel(series.label, series.key),
        })),
        daily: snapshot.token_usage_trends.daily.map((series) => ({
          ...series,
          label: localizeSeriesLabel(series.label, series.key),
        })),
      },
    };
  }, [messages.modelDetail.unknownEndpoint, messages.statistics.allModels, messages.statistics.unknownProxyApiKey, snapshot]);

  useEffect(() => {
    void revision;
    void selectedProfileId;
    void fetchSnapshot();
  }, [fetchSnapshot, revision, selectedProfileId]);

  const refresh = useCallback(async () => {
    await fetchSnapshot();
  }, [fetchSnapshot]);

  const availableModelLineIds = useMemo(() => collectModelLineIds(snapshot), [snapshot]);

  const selectedModelLineIds = useMemo(
    () => resolveSelectedModelLines(availableModelLineIds, state.selectedModelLines),
    [availableModelLineIds, state.selectedModelLines],
  );

  const requestTrendSeries = useMemo<UsageRequestTrendSeries[]>(() => {
    if (!localizedSnapshot) {
      return [];
    }

    return filterSeriesBySelectedModels(
      localizedSnapshot.request_trends[state.chartGranularity.requestTrends],
      selectedModelLineIds,
    );
  }, [localizedSnapshot, selectedModelLineIds, state.chartGranularity.requestTrends]);

  const tokenUsageTrendSeries = useMemo<UsageTokenTrendSeries[]>(() => {
    if (!localizedSnapshot) {
      return [];
    }

    return filterSeriesBySelectedModels(
      localizedSnapshot.token_usage_trends[state.chartGranularity.tokenUsageTrends],
      selectedModelLineIds,
    );
  }, [localizedSnapshot, selectedModelLineIds, state.chartGranularity.tokenUsageTrends]);

  const tokenTypeBreakdown = useMemo<UsageTokenTypeBreakdownPoint[]>(() => {
    if (!localizedSnapshot) {
      return [];
    }

    return localizedSnapshot.token_type_breakdown[state.chartGranularity.tokenTypeBreakdown];
  }, [localizedSnapshot, state.chartGranularity.tokenTypeBreakdown]);

  const costOverviewSeries = useMemo<UsageCostOverviewPoint[]>(() => {
    if (!localizedSnapshot) {
      return [];
    }

    return localizedSnapshot.cost_overview[state.chartGranularity.costOverview];
  }, [localizedSnapshot, state.chartGranularity.costOverview]);

  const requestEvents = useMemo<UsageStatisticsRequestEventRow[]>(() => {
    if (!localizedSnapshot) {
      return [];
    }

    return localizedSnapshot.request_events.items.map((item) => ({
      ...item,
      request_logs_href: buildRequestLogIngressLink(item.ingress_request_id),
    }));
  }, [localizedSnapshot]);

  const requestEventsTotal = localizedSnapshot?.request_events.total ?? 0;
  const requestEventsShownCount = localizedSnapshot?.request_events.shown_count ?? 0;
  const requestEventsRenderLimit = localizedSnapshot?.request_events.render_limit ?? 0;
  const requestEventAvailableFilters =
    localizedSnapshot?.request_events.available_filters ?? EMPTY_REQUEST_EVENT_AVAILABLE_FILTERS;

  return {
    availableModelLineIds,
    costOverviewSeries,
    error,
    loading,
    refresh,
    requestEventAvailableFilters,
    requestEvents,
    requestEventsRenderLimit,
    requestEventsShownCount,
    requestEventsTotal,
    requestTrendSeries,
    selectedModelLineIds,
    snapshot: localizedSnapshot,
    tokenTypeBreakdown,
    tokenUsageTrendSeries,
  };
}
