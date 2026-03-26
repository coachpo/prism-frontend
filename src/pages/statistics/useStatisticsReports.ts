import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type {
  ApiFamily,
  SpendingReportResponse,
  StatisticsRequestLogEntry,
  ThroughputStatsResponse,
} from "@/lib/types";
import { getFromTime } from "./queryParams";
import type { StatisticsPageState } from "./useStatisticsPageState";
import { toIsoFromDateInput } from "./utils";

const API_FAMILIES: ApiFamily[] = ["openai", "anthropic", "gemini"];

function toApiFamily(value: string): ApiFamily | undefined {
  return API_FAMILIES.find((apiFamily) => apiFamily === value);
}

type Params = {
  latestOperationsLogIdRef: React.MutableRefObject<number>;
  revision: number;
  state: StatisticsPageState;
};

export function useStatisticsReports({ latestOperationsLogIdRef, revision, state }: Params) {
  const {
    activeTab,
    apiFamily,
    connectionId,
    modelId,
    spendingApiFamily,
    spendingConnectionId,
    spendingFrom,
    spendingGroupBy,
    spendingLimit,
    spendingModelId,
    spendingOffset,
    spendingPreset,
    spendingTo,
    spendingTopN,
    timeRange,
  } = state;

  const [logs, setLogs] = useState<StatisticsRequestLogEntry[]>([]);
  const [operationsLoading, setOperationsLoading] = useState(activeTab === "operations");
  const [throughput, setThroughput] = useState<ThroughputStatsResponse | null>(null);
  const [throughputLoading, setThroughputLoading] = useState(activeTab === "throughput");
  const [spending, setSpending] = useState<SpendingReportResponse | null>(null);
  const [spendingLoading, setSpendingLoading] = useState(activeTab === "spending");
  const [spendingError, setSpendingError] = useState<string | null>(null);
  const [spendingUpdatedAt, setSpendingUpdatedAt] = useState<string | null>(null);
  const operationsRequestIdRef = useRef(0);
  const throughputRequestIdRef = useRef(0);
  const spendingRequestIdRef = useRef(0);

  const fetchOperationsLogs = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      const requestId = operationsRequestIdRef.current + 1;
      operationsRequestIdRef.current = requestId;

      if (!silent) {
        setOperationsLoading(true);
      }

      try {
        const requestParams = {
          model_id: modelId !== "__all__" ? modelId : undefined,
          api_family: apiFamily !== "all" ? toApiFamily(apiFamily) : undefined,
          connection_id:
            connectionId !== "__all__" ? Number.parseInt(connectionId, 10) : undefined,
          from_time: getFromTime(timeRange),
        };

        const response = await api.stats.operationsRequests({
          ...requestParams,
          limit: 200,
        });

        if (requestId !== operationsRequestIdRef.current) {
          return;
        }

        setLogs(response.items);
        latestOperationsLogIdRef.current = response.items[0]?.id ?? 0;
      } catch (error) {
        console.error("Failed to fetch statistics:", error);
      } finally {
        if (requestId === operationsRequestIdRef.current) {
          setOperationsLoading(false);
        }
      }
    },
    [apiFamily, connectionId, latestOperationsLogIdRef, modelId, timeRange]
  );

  const fetchThroughputData = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      const requestId = throughputRequestIdRef.current + 1;
      throughputRequestIdRef.current = requestId;

      if (!silent) {
        setThroughputLoading(true);
      }

      try {
        const response = await api.stats.throughput({
          from_time: getFromTime(timeRange),
          model_id: modelId !== "__all__" ? modelId : undefined,
          api_family: apiFamily !== "all" ? toApiFamily(apiFamily) : undefined,
          connection_id:
            connectionId !== "__all__" ? Number.parseInt(connectionId, 10) : undefined,
        });

        if (requestId !== throughputRequestIdRef.current) {
          return;
        }

        setThroughput(response);
      } catch (error) {
        console.error("Failed to fetch throughput:", error);
      } finally {
        if (requestId === throughputRequestIdRef.current) {
          setThroughputLoading(false);
        }
      }
    },
    [apiFamily, connectionId, modelId, timeRange]
  );

  const fetchSpendingData = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      const requestId = spendingRequestIdRef.current + 1;
      spendingRequestIdRef.current = requestId;

      if (!silent) {
        setSpendingLoading(true);
      }

      setSpendingError(null);

      try {
        const response = await api.stats.spending({
          preset: spendingPreset,
          from_time:
            spendingPreset === "custom"
              ? toIsoFromDateInput(spendingFrom, "start")
              : undefined,
          to_time:
            spendingPreset === "custom" ? toIsoFromDateInput(spendingTo, "end") : undefined,
          api_family: spendingApiFamily === "all" ? undefined : toApiFamily(spendingApiFamily),
          model_id: spendingModelId || undefined,
          connection_id: spendingConnectionId
            ? Number.parseInt(spendingConnectionId, 10)
            : undefined,
          group_by: spendingGroupBy,
          limit: spendingLimit,
          offset: spendingOffset,
          top_n: spendingTopN,
        });

        if (requestId !== spendingRequestIdRef.current) {
          return;
        }

        setSpending(response);
        setSpendingUpdatedAt(new Date().toISOString());
      } catch (error) {
        if (requestId !== spendingRequestIdRef.current) {
          return;
        }

        const message =
          error instanceof Error ? error.message : "Failed to fetch spending report";
        setSpendingError(message);
      } finally {
        if (requestId === spendingRequestIdRef.current) {
          setSpendingLoading(false);
        }
      }
    },
    [
      spendingConnectionId,
      spendingFrom,
      spendingGroupBy,
      spendingLimit,
      spendingModelId,
      spendingOffset,
      spendingPreset,
      spendingApiFamily,
      spendingTo,
      spendingTopN,
    ]
  );

  useEffect(() => {
    if (activeTab !== "operations") {
      return;
    }

    void revision;

    const timeout = window.setTimeout(() => {
      void fetchOperationsLogs();
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [activeTab, fetchOperationsLogs, revision]);

  useEffect(() => {
    if (activeTab !== "throughput") {
      return;
    }

    void revision;

    const timeout = window.setTimeout(() => {
      void fetchThroughputData();
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [activeTab, fetchThroughputData, revision]);

  useEffect(() => {
    if (activeTab !== "spending") {
      return;
    }

    void revision;

    const timeout = window.setTimeout(() => {
      void fetchSpendingData();
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [activeTab, fetchSpendingData, revision]);

  return {
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
  };
}
