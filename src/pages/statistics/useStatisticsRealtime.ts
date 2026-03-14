import { useCallback, useEffect, useRef, useState } from "react";
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

  const [reconcileRevision, setReconcileRevision] = useState(0);
  const [newLogIds, setNewLogIds] = useState<Set<number>>(() => new Set());
  const hiddenAtRef = useRef<number | null>(null);

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

  const requestRealtimeReconciliation = useCallback(() => {
    setReconcileRevision((prev) => prev + 1);
  }, []);

  const reconcileAll = useCallback(async () => {
    await Promise.all([
      fetchOperationsLogs({ silent: true }),
      fetchThroughputData({ silent: true }),
      fetchSpendingData({ silent: true }),
    ]);
  }, [fetchOperationsLogs, fetchSpendingData, fetchThroughputData]);

  const { connectionState, isSyncing, markSyncComplete } = useRealtimeData({
    profileId: selectedProfileId,
    channel: "statistics",
    onData: handleNewLog,
    onDirty: requestRealtimeReconciliation,
    onReconnect: requestRealtimeReconciliation,
  });

  useEffect(() => {
    if (reconcileRevision === 0) {
      return;
    }

    void reconcileAll().finally(markSyncComplete);
  }, [markSyncComplete, reconcileAll, reconcileRevision]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void reconcileAll().finally(markSyncComplete);
    }, 300000);

    return () => window.clearInterval(intervalId);
  }, [markSyncComplete, reconcileAll]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        hiddenAtRef.current = Date.now();
        return;
      }

      if (hiddenAtRef.current !== null && Date.now() - hiddenAtRef.current > 30000) {
        void reconcileAll().finally(markSyncComplete);
      }

      hiddenAtRef.current = null;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [markSyncComplete, reconcileAll]);

  return {
    clearNewLogHighlight,
    connectionState,
    isSyncing,
    newLogIds,
  };
}
