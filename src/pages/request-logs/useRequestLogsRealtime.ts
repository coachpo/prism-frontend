import { useCallback, useEffect, useRef, useState } from "react";
import { useCoalescedReconcile } from "@/hooks/useCoalescedReconcile";
import { useRealtimeData } from "@/hooks/useRealtimeData";
import type { RequestLogEntry } from "@/lib/types";
import type { RequestDetailTab } from "./queryParams";

type Params = {
  detailTab: RequestDetailTab;
  exactLogId: number | null;
  fetchExactLog: (args?: { silent?: boolean }) => Promise<void>;
  fetchLogs: (args?: { silent?: boolean }) => Promise<void>;
  limit: number;
  latestMatchingRequestIdRef: React.MutableRefObject<number>;
  matchesActiveFilters: (entry: RequestLogEntry) => boolean;
  matchesClientFilters: (entry: RequestLogEntry) => boolean;
  offset: number;
  requestId: number | null;
  selectedLogId: number | null;
  selectedProfileId: number | null;
  setAuditRefreshKey: React.Dispatch<React.SetStateAction<number>>;
  setLogs: React.Dispatch<React.SetStateAction<RequestLogEntry[]>>;
  setTotal: React.Dispatch<React.SetStateAction<number>>;
  tableScrollRef: React.RefObject<HTMLDivElement | null>;
};

export function useRequestLogsRealtime({
  detailTab,
  exactLogId,
  fetchExactLog,
  fetchLogs,
  limit,
  latestMatchingRequestIdRef,
  matchesActiveFilters,
  matchesClientFilters,
  offset,
  requestId,
  selectedLogId,
  selectedProfileId,
  setAuditRefreshKey,
  setLogs,
  setTotal,
  tableScrollRef,
}: Params) {
  const [newLogIds, setNewLogIds] = useState<Set<number>>(() => new Set());
  const markSyncCompleteRef = useRef<() => void>(() => undefined);

  const handleNewRequestLog = useCallback(
    (entry: RequestLogEntry) => {
      if (entry.id <= latestMatchingRequestIdRef.current) {
        return;
      }

      if (!matchesActiveFilters(entry)) {
        return;
      }

      latestMatchingRequestIdRef.current = entry.id;

      if (requestId !== null) {
        setTotal((prev) => prev + 1);
        return;
      }

      setTotal((prev) => prev + 1);

      if (offset !== 0 || !matchesClientFilters(entry)) {
        return;
      }

      const container = tableScrollRef.current;
      const preserveScroll = container !== null && container.scrollTop > 50;

      setLogs((prev) => [entry, ...prev].slice(0, limit));
      setNewLogIds((prev) => new Set(prev).add(entry.id));

      if (preserveScroll && container) {
        window.requestAnimationFrame(() => {
          container.scrollTop += 52;
        });
      }
    },
    [
      latestMatchingRequestIdRef,
      limit,
      matchesActiveFilters,
      matchesClientFilters,
      offset,
      requestId,
      setLogs,
      setTotal,
      tableScrollRef,
    ]
  );

  const handleAuditReady = useCallback(
    (requestLogId: number, auditLogId: number) => {
      if (auditLogId <= 0 || detailTab !== "audit") {
        return;
      }

      const activeRequestId = selectedLogId ?? exactLogId ?? requestId;
      if (activeRequestId !== requestLogId) {
        return;
      }

      setAuditRefreshKey((prev) => prev + 1);
    },
    [detailTab, exactLogId, requestId, selectedLogId, setAuditRefreshKey]
  );

  const reconcileAll = useCallback(async () => {
    await Promise.all([
      fetchLogs({ silent: true }),
      requestId !== null ? fetchExactLog({ silent: true }) : Promise.resolve(),
    ]);
    markSyncCompleteRef.current();
  }, [fetchExactLog, fetchLogs, requestId]);

  const requestRealtimeReconciliation = useCoalescedReconcile({
    reconcile: reconcileAll,
    intervalMs: 300000,
    visibilityReloadThresholdMs: 30000,
  });

  const { connectionState, isSyncing, markSyncComplete } = useRealtimeData({
    profileId: selectedProfileId,
    channel: "request_logs",
    onData: handleNewRequestLog,
    onDirty: requestRealtimeReconciliation,
    onReconnect: requestRealtimeReconciliation,
    onAuditReady: handleAuditReady,
  });

  useEffect(() => {
    markSyncCompleteRef.current = markSyncComplete;
  }, [markSyncComplete]);

  const clearNewLog = useCallback((logId: number) => {
    setNewLogIds((prev) => {
      if (!prev.has(logId)) {
        return prev;
      }

      const next = new Set(prev);
      next.delete(logId);
      return next;
    });
  }, []);

  return {
    clearNewLog,
    connectionState,
    isSyncing,
    newLogIds,
  };
}
