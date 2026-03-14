import { useCallback, useEffect, useRef, useState } from "react";
import { useCoalescedReconcile } from "@/hooks/useCoalescedReconcile";
import { useRealtimeData } from "@/hooks/useRealtimeData";
import type { RequestLogEntry } from "@/lib/types";
import type { StatisticsPageState } from "./useStatisticsPageState";
import { matchesOperationsLogFilters } from "./utils";

type Params = {
  fetchOperationsLogs: (args?: { silent?: boolean }) => Promise<void>;
  fetchSpendingData: (args?: { silent?: boolean }) => Promise<void>;
  fetchThroughputData: (args?: { silent?: boolean }) => Promise<void>;
  latestOperationsLogIdRef: React.MutableRefObject<number>;
  selectedProfileId: number | null;
  setLogs: React.Dispatch<React.SetStateAction<RequestLogEntry[]>>;
  state: StatisticsPageState;
};

export function useStatisticsRealtime({
  fetchOperationsLogs,
  fetchSpendingData,
  fetchThroughputData,
  latestOperationsLogIdRef,
  selectedProfileId,
  setLogs,
  state,
}: Params) {
  const {
    connectionId,
    modelId,
    operationsStatusFilter,
    providerType,
    specialTokenFilter,
  } = state;

  const [newLogIds, setNewLogIds] = useState<Set<number>>(() => new Set());
  const markSyncCompleteRef = useRef<() => void>(() => undefined);

  const matchesRealtimeFilters = useCallback(
    (entry: RequestLogEntry) => {
      if (modelId !== "__all__" && entry.model_id !== modelId) return false;
      if (providerType !== "all" && entry.provider_type !== providerType) return false;
      if (connectionId !== "__all__" && entry.connection_id !== Number(connectionId)) {
        return false;
      }
      return true;
    },
    [connectionId, modelId, providerType]
  );

  const handleNewLog = useCallback(
    (entry: RequestLogEntry) => {
      if (entry.id <= latestOperationsLogIdRef.current) {
        return;
      }
      if (!matchesRealtimeFilters(entry)) {
        return;
      }

      latestOperationsLogIdRef.current = entry.id;
      if (!matchesOperationsLogFilters(entry, specialTokenFilter, operationsStatusFilter)) {
        return;
      }

      setLogs((prev) => [entry, ...prev].slice(0, 500));
      setNewLogIds((prev) => new Set(prev).add(entry.id));
    },
    [latestOperationsLogIdRef, matchesRealtimeFilters, operationsStatusFilter, setLogs, specialTokenFilter]
  );

  const clearNewLogHighlight = useCallback((logId: number) => {
    setNewLogIds((prev) => {
      if (!prev.has(logId)) {
        return prev;
      }

      const next = new Set(prev);
      next.delete(logId);
      return next;
    });
  }, []);

  const reconcileAll = useCallback(async () => {
    await Promise.all([
      fetchOperationsLogs({ silent: true }),
      fetchThroughputData({ silent: true }),
      fetchSpendingData({ silent: true }),
    ]);
    markSyncCompleteRef.current();
  }, [fetchOperationsLogs, fetchSpendingData, fetchThroughputData]);

  const requestRealtimeReconciliation = useCoalescedReconcile({
    reconcile: reconcileAll,
    intervalMs: 300000,
    visibilityReloadThresholdMs: 30000,
  });

  const { connectionState, isSyncing, markSyncComplete } = useRealtimeData({
    profileId: selectedProfileId,
    channel: "statistics",
    onData: handleNewLog,
    onDirty: requestRealtimeReconciliation,
    onReconnect: requestRealtimeReconciliation,
  });

  useEffect(() => {
    markSyncCompleteRef.current = markSyncComplete;
  }, [markSyncComplete]);

  return {
    clearNewLogHighlight,
    connectionState,
    isSyncing,
    newLogIds,
  };
}
