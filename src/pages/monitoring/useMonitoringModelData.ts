import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { getStaticMessages } from "@/i18n/staticMessages";
import type { MonitoringManualProbeResult, MonitoringModelResponse } from "@/lib/types";
import {
  DEFAULT_MONITORING_POLL_INTERVAL_SECONDS,
  toMonitoringPollIntervalMs,
} from "./monitoringPolling";

interface UseMonitoringModelDataInput {
  modelConfigId: number | null;
  revision: number;
  selectedProfileId: number | null;
}

export function useMonitoringModelData({
  modelConfigId,
  revision,
  selectedProfileId,
}: UseMonitoringModelDataInput) {
  const [data, setData] = useState<MonitoringModelResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualProbeResult, setManualProbeResult] = useState<MonitoringManualProbeResult | null>(null);
  const [probingConnectionIds, setProbingConnectionIds] = useState<Set<number>>(new Set());
  const requestIdRef = useRef(0);
  const pollIntervalSeconds = DEFAULT_MONITORING_POLL_INTERVAL_SECONDS;

  const fetchModel = useCallback(async () => {
    if (!modelConfigId) {
      setData(null);
      setError(getStaticMessages().monitoring.invalidModelId);
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const response = await api.monitoring.model(modelConfigId);
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
          : getStaticMessages().monitoring.loadModelFailed,
      );
      setData(null);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [modelConfigId]);

  useEffect(() => {
    void revision;
    void selectedProfileId;
    void fetchModel();

    const intervalId = window.setInterval(() => {
      void fetchModel();
    }, toMonitoringPollIntervalMs(pollIntervalSeconds));

    return () => {
      window.clearInterval(intervalId);
      requestIdRef.current += 1;
    };
  }, [fetchModel, revision, selectedProfileId]);

  const handleManualProbe = useCallback(async (connectionId: number) => {
    setProbingConnectionIds((current) => new Set(current).add(connectionId));

    try {
      const result = await api.monitoring.probe(connectionId);
      setManualProbeResult(result);
      await fetchModel();
    } catch (probeError) {
      setError(
        probeError instanceof Error
          ? probeError.message
          : getStaticMessages().monitoring.manualProbeFailed,
      );
    } finally {
      setProbingConnectionIds((current) => {
        const next = new Set(current);
        next.delete(connectionId);
        return next;
      });
    }
  }, [fetchModel]);

  return {
    data,
    error,
    handleManualProbe,
    loading,
    manualProbeResult,
    probingConnectionIds,
    refresh: fetchModel,
  };
}
