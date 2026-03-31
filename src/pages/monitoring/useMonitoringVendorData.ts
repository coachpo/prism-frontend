import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { getStaticMessages } from "@/i18n/staticMessages";
import type { MonitoringVendorResponse } from "@/lib/types";
import {
  DEFAULT_MONITORING_POLL_INTERVAL_SECONDS,
  toMonitoringPollIntervalMs,
} from "./monitoringPolling";

interface UseMonitoringVendorDataInput {
  revision: number;
  selectedProfileId: number | null;
  vendorId: number | null;
}

export function useMonitoringVendorData({ revision, selectedProfileId, vendorId }: UseMonitoringVendorDataInput) {
  const [data, setData] = useState<MonitoringVendorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const pollIntervalSeconds = DEFAULT_MONITORING_POLL_INTERVAL_SECONDS;

  const fetchVendor = useCallback(async () => {
    if (!vendorId) {
      setData(null);
      setError(getStaticMessages().monitoring.invalidVendorId);
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const response = await api.monitoring.vendor(vendorId);
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
          : getStaticMessages().monitoring.loadVendorFailed,
      );
      setData(null);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [vendorId]);

  useEffect(() => {
    void revision;
    void selectedProfileId;
    void fetchVendor();

    const intervalId = window.setInterval(() => {
      void fetchVendor();
    }, toMonitoringPollIntervalMs(pollIntervalSeconds));

    return () => {
      window.clearInterval(intervalId);
      requestIdRef.current += 1;
    };
  }, [fetchVendor, revision, selectedProfileId]);

  return {
    data,
    error,
    loading,
    refresh: fetchVendor,
  };
}
