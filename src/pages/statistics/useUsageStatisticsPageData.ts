import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import type {
  UsageCostOverviewPoint,
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
        fetchError instanceof Error ? fetchError.message : "Failed to load usage statistics",
      );
      setSnapshot(null);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [state.selectedTimeRange]);

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
    if (!snapshot) {
      return [];
    }

    return filterSeriesBySelectedModels(
      snapshot.request_trends[state.chartGranularity.requestTrends],
      selectedModelLineIds,
    );
  }, [selectedModelLineIds, snapshot, state.chartGranularity.requestTrends]);

  const tokenUsageTrendSeries = useMemo<UsageTokenTrendSeries[]>(() => {
    if (!snapshot) {
      return [];
    }

    return filterSeriesBySelectedModels(
      snapshot.token_usage_trends[state.chartGranularity.tokenUsageTrends],
      selectedModelLineIds,
    );
  }, [selectedModelLineIds, snapshot, state.chartGranularity.tokenUsageTrends]);

  const tokenTypeBreakdown = useMemo<UsageTokenTypeBreakdownPoint[]>(() => {
    if (!snapshot) {
      return [];
    }

    return snapshot.token_type_breakdown[state.chartGranularity.tokenTypeBreakdown];
  }, [snapshot, state.chartGranularity.tokenTypeBreakdown]);

  const costOverviewSeries = useMemo<UsageCostOverviewPoint[]>(() => {
    if (!snapshot) {
      return [];
    }

    return snapshot.cost_overview[state.chartGranularity.costOverview];
  }, [snapshot, state.chartGranularity.costOverview]);

  const requestEvents = useMemo<UsageStatisticsRequestEventRow[]>(() => {
    if (!snapshot) {
      return [];
    }

    return snapshot.request_events.items.map((item) => ({
      ...item,
      request_logs_href: buildRequestLogIngressLink(item.ingress_request_id),
    }));
  }, [snapshot]);

  return {
    availableModelLineIds,
    costOverviewSeries,
    error,
    loading,
    refresh,
    requestEvents,
    requestTrendSeries,
    selectedModelLineIds,
    snapshot,
    tokenTypeBreakdown,
    tokenUsageTrendSeries,
  };
}
