import { useMemo, useRef, useState, useCallback } from "react";
import type { StatisticsPageState } from "./useStatisticsPageState";
import { useStatisticsFilterOptions } from "./useStatisticsFilterOptions";
import { usePolling } from "@/hooks/usePolling";
import { useStatisticsReports } from "./useStatisticsReports";

interface UseStatisticsPageDataInput {
  revision: number;
  state: StatisticsPageState;
}

export function useStatisticsPageData({
  revision,
  state,
}: UseStatisticsPageDataInput) {
  const latestOperationsLogIdRef = useRef(0);
  const [newLogIds, setNewLogIds] = useState<Set<number>>(new Set());
  const { apiFamilies, connections, models } = useStatisticsFilterOptions(revision);
  const {
    fetchOperationsLogs,
    fetchSpendingData,
    fetchThroughputData,
    logs,
    operationsLoading,
    spending,
    spendingError,
    spendingLoading,
    spendingUpdatedAt,
    throughput,
    throughputLoading,
  } = useStatisticsReports({
    latestOperationsLogIdRef,
    revision,
    state,
  });
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);

  const refreshOperations = useCallback(async () => {
    await fetchOperationsLogs({ silent: true });
  }, [fetchOperationsLogs]);

  const refreshThroughput = useCallback(async () => {
    await fetchThroughputData({ silent: true });
  }, [fetchThroughputData]);

  const refreshSpending = useCallback(async () => {
    await fetchSpendingData({ silent: true });
  }, [fetchSpendingData]);

  const refreshActiveTab = useCallback(async () => {
    if (state.activeTab === "throughput") {
      await refreshThroughput();
      return;
    }

    if (state.activeTab === "spending") {
      await refreshSpending();
      return;
    }

    await refreshOperations();
  }, [refreshOperations, refreshSpending, refreshThroughput, state.activeTab]);

  const refreshAll = useCallback(async () => {
    setIsRefreshingAll(true);

    try {
      await Promise.all([
        fetchOperationsLogs({ silent: true }),
        fetchSpendingData({ silent: true }),
        fetchThroughputData({ silent: true }),
      ]);
    } finally {
      setIsRefreshingAll(false);
    }
  }, [fetchOperationsLogs, fetchSpendingData, fetchThroughputData]);

  const { isPolling } = usePolling({
    onPoll: refreshActiveTab,
  });

  const clearNewLogHighlight = useCallback((logId: number) => {
    setNewLogIds((prev) => {
      const next = new Set(prev);
      next.delete(logId);
      return next;
    });
  }, []);

  const operationsTabProps = useMemo(
    () => ({
      apiFamilies,
      connectionId: state.connectionId,
      connections,
      logs,
      modelId: state.modelId,
      models,
      operationsStatusFilter: state.operationsStatusFilter,
      apiFamily: state.apiFamily,
      setConnectionId: state.setConnectionId,
      setModelId: state.setModelId,
      setOperationsStatusFilter: state.setOperationsStatusFilter,
      setApiFamily: state.setApiFamily,
      setSpecialTokenFilter: state.setSpecialTokenFilter,
      setTimeRange: state.setTimeRange,
      specialTokenFilter: state.specialTokenFilter,
      timeRange: state.timeRange,
      newLogIds,
      clearNewLogHighlight,
      clearOperationsFilters: state.clearOperationsFilters,
      manualRefresh: refreshOperations,
    }),
    [apiFamilies, connections, logs, models, state, newLogIds, clearNewLogHighlight, refreshOperations]
  );

  const spendingTabProps = useMemo(
    () => ({
      apiFamilies,
      connections,
      models,
      setSpendingApiFamily: state.setSpendingApiFamily,
      setSpendingConnectionId: state.setSpendingConnectionId,
      setSpendingFrom: state.setSpendingFrom,
      setSpendingGroupBy: state.setSpendingGroupBy,
      setSpendingLimit: state.setSpendingLimit,
      setSpendingModelId: state.setSpendingModelId,
      setSpendingOffset: state.setSpendingOffset,
      setSpendingPreset: state.setSpendingPreset,
      setSpendingTo: state.setSpendingTo,
      setSpendingTopN: state.setSpendingTopN,
      spending,
      spendingApiFamily: state.spendingApiFamily,
      spendingConnectionId: state.spendingConnectionId,
      spendingError,
      spendingFrom: state.spendingFrom,
      spendingGroupBy: state.spendingGroupBy,
      spendingLimit: state.spendingLimit,
      spendingLoading,
      spendingModelId: state.spendingModelId,
      spendingOffset: state.spendingOffset,
      spendingPreset: state.spendingPreset,
      spendingTo: state.spendingTo,
      spendingTopN: state.spendingTopN,
      spendingUpdatedAt,
      clearSpendingFilters: state.clearSpendingFilters,
      manualRefresh: refreshSpending,
    }),
    [apiFamilies, connections, models, spending, spendingError, spendingLoading, spendingUpdatedAt, state, refreshSpending]
  );

  const showInitialLoading = useMemo(() => {
    if (state.activeTab === "throughput") {
      return throughputLoading && throughput === null;
    }

    if (state.activeTab === "spending") {
      return spendingLoading && spending === null;
    }

    return operationsLoading && logs.length === 0;
  }, [
    logs.length,
    operationsLoading,
    spending,
    spendingLoading,
    state.activeTab,
    throughput,
    throughputLoading,
  ]);

  return {
    isPolling,
    isRefreshingAll,
    operationsTabProps,
    refreshAll,
    refreshThroughput,
    showInitialLoading,
    spendingTabProps,
    throughput,
    throughputLoading,
  };
}
