import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { RequestLogEntry } from "@/lib/types";
import { getFromTime, type RequestDetailTab } from "./queryParams";
import {
  matchesClientRequestLogFilters,
  sortRequestLogRows,
} from "./requestLogFilters";
import { useRequestLogFilterOptions } from "./useRequestLogFilterOptions";

type Params = {
  connectionId: string;
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
  const { connections, endpoints, models, providers } = useRequestLogFilterOptions(revision);
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState<RequestLogEntry | null>(null);
  const fetchRequestIdRef = useRef(0);

  useEffect(() => {
    setOffset(0);
  }, [revision, setOffset]);

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
  const matchesClientFilters = useCallback(
    (entry: RequestLogEntry) => matchesClientRequestLogFilters(entry, clientFilters),
    [clientFilters]
  );

  const fetchLogs = useCallback(async () => {
    const fetchRequestId = fetchRequestIdRef.current + 1;
    fetchRequestIdRef.current = fetchRequestId;
    setLoading(true);

    try {
      const response =
        requestId !== null
          ? await api.stats.requests({
              request_id: requestId,
              limit: 1,
              offset: 0,
            })
          : await api.stats.requests({
              model_id: modelId === "__all__" ? undefined : modelId,
              provider_type: providerType === "all" ? undefined : providerType,
              connection_id: connectionId === "__all__" ? undefined : Number.parseInt(connectionId, 10),
              endpoint_id: endpointId === "__all__" ? undefined : Number.parseInt(endpointId, 10),
              from_time: getFromTime(timeRange),
              limit,
              offset,
            });

      if (fetchRequestId !== fetchRequestIdRef.current) {
        return;
      }

      setLogs(response.items);
      setTotal(response.total);
    } catch (error) {
      console.error("Failed to fetch request logs", error);
    } finally {
      if (fetchRequestId === fetchRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [connectionId, endpointId, limit, modelId, offset, providerType, requestId, timeRange]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchLogs();
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [fetchLogs, revision]);

  useEffect(() => {
    if (requestId === null) {
      return;
    }

    const focusedLog = logs[0] ?? null;
    if (focusedLog) {
      setSelectedLog((current) => (current?.id === focusedLog.id ? current : focusedLog));
      return;
    }

    if (!loading) {
      setSelectedLog(null);
    }
  }, [loading, logs, requestId]);

  const filteredAndSortedRows = useMemo(
    () => sortRequestLogRows(logs.filter(matchesClientFilters), triage),
    [logs, matchesClientFilters, triage]
  );

  const displayedRows = requestId !== null ? logs : filteredAndSortedRows;
  const displayedLoading = loading;
  const displayedTotal = total;
  const displayedPageRowCount = requestId !== null ? displayedRows.length : logs.length;
  const allColumnsMode = view === "all";

  const openLogDetail = (log: RequestLogEntry, tab: RequestDetailTab = "overview") => {
    setDetailTab(tab);
    setSelectedLog(log);
  };

  return {
    allColumnsMode,
    connections,
    displayedLoading,
    displayedPageRowCount,
    displayedRows,
    displayedTotal,
    endpoints,
    models,
    openLogDetail,
    providers,
    refresh: fetchLogs,
    selectedLog,
    setSelectedLog,
  };
}
