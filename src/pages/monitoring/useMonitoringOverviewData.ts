import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { getStaticMessages } from "@/i18n/staticMessages";
import type { MonitoringOverviewResponse } from "@/lib/types";
import {
  DEFAULT_MONITORING_POLL_INTERVAL_SECONDS,
  toMonitoringPollIntervalMs,
} from "./monitoringPolling";

interface UseMonitoringOverviewDataInput {
  revision: number;
  selectedProfileId: number | null;
}

export function useMonitoringOverviewData({ revision, selectedProfileId }: UseMonitoringOverviewDataInput) {
  const [data, setData] = useState<MonitoringOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const pollIntervalSeconds = DEFAULT_MONITORING_POLL_INTERVAL_SECONDS;

  const fetchOverview = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const response = await api.monitoring.overview();
      if (requestId !== requestIdRef.current) {
        return;
      }
      setData(response);
    } catch (fetchError) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : getStaticMessages().monitoring.loadOverviewFailed,
      );
      setData(null);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void revision;
    void selectedProfileId;
    void fetchOverview();

    const intervalId = window.setInterval(() => {
      void fetchOverview();
    }, toMonitoringPollIntervalMs(pollIntervalSeconds));

    return () => {
      window.clearInterval(intervalId);
      requestIdRef.current += 1;
    };
  }, [fetchOverview, revision, selectedProfileId]);

  return {
    data,
    error,
    loading,
    refresh: fetchOverview,
  };
}
