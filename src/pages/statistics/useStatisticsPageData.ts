import { useMemo, useRef } from "react";
import type { StatisticsPageState } from "./useStatisticsPageState";
import { useStatisticsFilterOptions } from "./useStatisticsFilterOptions";
import { useStatisticsRealtime } from "./useStatisticsRealtime";
import { useStatisticsReports } from "./useStatisticsReports";

interface UseStatisticsPageDataInput {
  revision: number;
  selectedProfileId: number | null;
  state: StatisticsPageState;
}

export function useStatisticsPageData({
  revision,
  selectedProfileId,
  state,
}: UseStatisticsPageDataInput) {
  const latestOperationsLogIdRef = useRef(0);
  const { connections, models } = useStatisticsFilterOptions(revision);
  const {
    fetchOperationsLogs,
    fetchSpendingData,
    fetchThroughputData,
    logs,
    setLogs,
    showInitialLoading,
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
  const { clearNewLogHighlight, connectionState, isSyncing, newLogIds } =
    useStatisticsRealtime({
      fetchOperationsLogs,
      fetchSpendingData,
      fetchThroughputData,
      latestOperationsLogIdRef,
      selectedProfileId,
      setLogs,
      state,
    });

  const operationsTabProps = useMemo(
    () => ({
      clearNewLogHighlight,
      connectionId: state.connectionId,
      connections,
      logs,
      modelId: state.modelId,
      models,
      newLogIds,
      operationsStatusFilter: state.operationsStatusFilter,
      providerType: state.providerType,
      setConnectionId: state.setConnectionId,
      setModelId: state.setModelId,
      setOperationsStatusFilter: state.setOperationsStatusFilter,
      setProviderType: state.setProviderType,
      setSpecialTokenFilter: state.setSpecialTokenFilter,
      setTimeRange: state.setTimeRange,
      specialTokenFilter: state.specialTokenFilter,
      timeRange: state.timeRange,
    }),
    [clearNewLogHighlight, connections, logs, models, newLogIds, state]
  );

  const spendingTabProps = useMemo(
    () => ({
      connections,
      models,
      setSpendingConnectionId: state.setSpendingConnectionId,
      setSpendingFrom: state.setSpendingFrom,
      setSpendingGroupBy: state.setSpendingGroupBy,
      setSpendingLimit: state.setSpendingLimit,
      setSpendingModelId: state.setSpendingModelId,
      setSpendingOffset: state.setSpendingOffset,
      setSpendingPreset: state.setSpendingPreset,
      setSpendingProviderType: state.setSpendingProviderType,
      setSpendingTo: state.setSpendingTo,
      setSpendingTopN: state.setSpendingTopN,
      spending,
      spendingConnectionId: state.spendingConnectionId,
      spendingError,
      spendingFrom: state.spendingFrom,
      spendingGroupBy: state.spendingGroupBy,
      spendingLimit: state.spendingLimit,
      spendingLoading,
      spendingModelId: state.spendingModelId,
      spendingOffset: state.spendingOffset,
      spendingPreset: state.spendingPreset,
      spendingProviderType: state.spendingProviderType,
      spendingTo: state.spendingTo,
      spendingTopN: state.spendingTopN,
      spendingUpdatedAt,
    }),
    [connections, models, spending, spendingError, spendingLoading, spendingUpdatedAt, state]
  );

  return {
    connectionState,
    isSyncing,
    operationsTabProps,
    showInitialLoading,
    spendingTabProps,
    throughput,
    throughputLoading,
  };
}
