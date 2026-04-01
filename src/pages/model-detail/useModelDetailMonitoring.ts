import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { getStaticMessages } from "@/i18n/staticMessages";
import type { MonitoringModelConnection, MonitoringModelResponse } from "@/lib/types";

interface UseModelDetailMonitoringInput {
  modelConfigId: number | undefined;
  revision: number;
  selectedProfileId: number | null;
}

function isValidModelConfigId(modelConfigId: number | undefined): modelConfigId is number {
  return typeof modelConfigId === "number" && Number.isFinite(modelConfigId) && modelConfigId > 0;
}

function toMonitoringConnectionMap(connections: MonitoringModelConnection[]) {
  return new Map(connections.map((connection) => [connection.connection_id, connection]));
}

export function useModelDetailMonitoring({
  modelConfigId,
  revision,
  selectedProfileId,
}: UseModelDetailMonitoringInput) {
  const [monitoringModel, setMonitoringModel] = useState<MonitoringModelResponse | null>(null);
  const [monitoringLoading, setMonitoringLoading] = useState(() => isValidModelConfigId(modelConfigId));
  const requestIdRef = useRef(0);
  const invalidationKeyRef = useRef<string | null>(null);
  const invalidationKey = isValidModelConfigId(modelConfigId)
    ? `${modelConfigId}:${revision}:${selectedProfileId ?? "none"}`
    : `invalid:${revision}:${selectedProfileId ?? "none"}`;

  useEffect(() => {
    if (invalidationKeyRef.current !== invalidationKey) {
      invalidationKeyRef.current = invalidationKey;
      requestIdRef.current += 1;
      setMonitoringModel(null);
      setMonitoringLoading(isValidModelConfigId(modelConfigId));
    }

    if (!isValidModelConfigId(modelConfigId)) {
      return;
    }

    const requestId = ++requestIdRef.current;

    const fetchMonitoring = async () => {
      try {
        const response = await api.monitoring.model(modelConfigId);

        if (requestId !== requestIdRef.current) {
          return;
        }

        setMonitoringModel(response);
      } catch (error) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setMonitoringModel(null);
        toast.error(error instanceof Error ? error.message : getStaticMessages().monitoring.loadModelFailed);
        console.error("Failed to load model-detail monitoring snapshot", error);
      } finally {
        if (requestId === requestIdRef.current) {
          setMonitoringLoading(false);
        }
      }
    };

    void fetchMonitoring();
  }, [invalidationKey, modelConfigId]);

  const monitoringByConnectionId = useMemo(
    () => toMonitoringConnectionMap(monitoringModel?.connections ?? []),
    [monitoringModel]
  );

  return {
    monitoringModel,
    monitoringByConnectionId,
    monitoringLoading,
  };
}
