import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { RequestLogEntry } from "@/lib/types";
import { getFromTime, type RequestDetailTab } from "./queryParams";
import {
  matchesActiveRequestLogFilters,
  matchesClientRequestLogFilters,
  sortRequestLogRows,
} from "./requestLogFilters";
import { useRequestLogFilterOptions } from "./useRequestLogFilterOptions";
import { useRequestLogsRealtime } from "./useRequestLogsRealtime";

type Params = {
  connectionId: string;
  detailTab: RequestDetailTab;
  endpointId: string;
  latencyBucket: Parameters<typeof matchesClientRequestLogFilters>[1]["latencyBucket"];
  limit: number;
  modelId: string;
  offset: number;
  outcomeFilter: Parameters<typeof matchesClientRequestLogFilters>[1]["outcomeFilter"];
  providerType: string;
  requestId: number | null;
  revision: number;
  searchQuery: string;
  selectedProfileId: number | null;
  setDetailTab: (value: RequestDetailTab) => void;
  setOffset: (value: number) => void;
  showBillableOnly: boolean;
  showPricedOnly: boolean;
  specialTokenFilter: Parameters<typeof matchesClientRequestLogFilters>[1]["specialTokenFilter"];
  streamFilter: Parameters<typeof matchesClientRequestLogFilters>[1]["streamFilter"];
  timeRange: Parameters<typeof getFromTime>[0];
  tokenMax: number | null;
  tokenMin: number | null;
  triage: Parameters<typeof sortRequestLogRows>[1];
  view: string;
};

export function useRequestLogsPageData({
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
  revision,
  searchQuery,
  selectedProfileId,
  setDetailTab,
  setOffset,
  showBillableOnly,
  showPricedOnly,
  specialTokenFilter,
  streamFilter,
  timeRange,
  tokenMax,
  tokenMin,
  triage,
  view,
}: Params) {
  const [logs, setLogs] = useState<RequestLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { connections, endpoints, models } = useRequestLogFilterOptions(revision);
  const [auditRefreshKey, setAuditRefreshKey] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState<RequestLogEntry | null>(null);
  const [exactLog, setExactLog] = useState<RequestLogEntry | null>(null);
  const [exactLoading, setExactLoading] = useState(false);

  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const latestMatchingRequestIdRef = useRef(0);

  useEffect(() => {
    setOffset(0);
  }, [revision, setOffset]);

  const activeFilters = useMemo(
    () => ({ connectionId, endpointId, modelId, providerType }),
    [connectionId, endpointId, modelId, providerType]
  );
  const clientFilters = useMemo(
    () => ({
      latencyBucket,
      outcomeFilter,
      searchQuery,
      showBillableOnly,
      showPricedOnly,
      specialTokenFilter,
      streamFilter,
      tokenMax,
      tokenMin,
      triage,
    }),
    [
      latencyBucket,
      outcomeFilter,
      searchQuery,
      showBillableOnly,
      showPricedOnly,
      specialTokenFilter,
      streamFilter,
      tokenMax,
      tokenMin,
      triage,
    ]
  );
  const matchesActiveFilters = useCallback(
    (entry: RequestLogEntry) => matchesActiveRequestLogFilters(entry, activeFilters),
    [activeFilters]
  );
  const matchesClientFilters = useCallback(
    (entry: RequestLogEntry) => matchesClientRequestLogFilters(entry, clientFilters),
    [clientFilters]
  );

  const fetchLogs = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!silent) {
        setLoading(true);
      }

      try {
        const requestParams = {
          model_id: modelId === "__all__" ? undefined : modelId,
          provider_type: providerType === "all" ? undefined : providerType,
          connection_id: connectionId === "__all__" ? undefined : Number.parseInt(connectionId, 10),
          endpoint_id: endpointId === "__all__" ? undefined : Number.parseInt(endpointId, 10),
          from_time: getFromTime(timeRange),
        };

        const [response, latestResponse] = await Promise.all([
          api.stats.requests({
            ...requestParams,
            limit,
            offset,
          }),
          api.stats.requests({
            ...requestParams,
            limit: 1,
            offset: 0,
          }),
        ]);

        setLogs(response.items);
        setTotal(response.total);
        latestMatchingRequestIdRef.current = latestResponse.items[0]?.id ?? 0;
      } catch (error) {
        console.error("Failed to fetch request logs", error);
      } finally {
        setLoading(false);
      }
    },
    [connectionId, endpointId, limit, latestMatchingRequestIdRef, modelId, offset, providerType, timeRange]
  );

  const fetchExactLog = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (requestId === null) {
        setExactLog(null);
        setExactLoading(false);
        return;
      }

      if (!silent) {
        setExactLoading(true);
      }

      try {
        const response = await api.stats.requests({ request_id: requestId, limit: 1, offset: 0 });
        setExactLog(response.items[0] ?? null);
      } catch (error) {
        console.error("Failed to fetch exact request log", error);
        setExactLog(null);
      } finally {
        setExactLoading(false);
      }
    },
    [requestId]
  );

  const {
    clearNewLog,
    connectionState,
    isSyncing,
    newLogIds,
  } = useRequestLogsRealtime({
    detailTab,
    exactLogId: exactLog?.id ?? null,
    fetchExactLog,
    fetchLogs,
    limit,
    latestMatchingRequestIdRef,
    matchesActiveFilters,
    matchesClientFilters,
    offset,
    requestId,
    selectedLogId: selectedLog?.id ?? null,
    selectedProfileId,
    setAuditRefreshKey,
    setLogs,
    setTotal,
    tableScrollRef,
  });

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchLogs();
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [fetchLogs, revision]);

  useEffect(() => {
    void fetchExactLog();
  }, [fetchExactLog, revision]);

  useEffect(() => {
    if (requestId === null) {
      return;
    }

    if (exactLog) {
      setSelectedLog((current) => (current?.id === exactLog.id ? current : exactLog));
      return;
    }

    if (!exactLoading) {
      setSelectedLog(null);
    }
  }, [exactLoading, exactLog, requestId]);

  const filteredAndSortedRows = useMemo(
    () => sortRequestLogRows(logs.filter(matchesClientFilters), triage),
    [logs, matchesClientFilters, triage]
  );

  const displayedRows = requestId !== null ? (exactLog ? [exactLog] : []) : filteredAndSortedRows;
  const displayedLoading = requestId !== null ? exactLoading : loading;
  const displayedTotal = requestId !== null ? (exactLog ? 1 : 0) : total;
  const displayedPageRowCount = requestId !== null ? displayedRows.length : logs.length;
  const allColumnsMode = view === "all";

  const openLogDetail = (log: RequestLogEntry, tab: RequestDetailTab = "overview") => {
    setDetailTab(tab);
    setSelectedLog(log);
  };

  return {
    allColumnsMode,
    auditRefreshKey,
    clearNewLog,
    connectionState,
    connections,
    displayedLoading,
    displayedPageRowCount,
    displayedRows,
    displayedTotal,
    endpoints,
    isSyncing,
    models,
    newLogIds,
    openLogDetail,
    selectedLog,
    setSelectedLog,
    tableScrollRef,
  };
}
