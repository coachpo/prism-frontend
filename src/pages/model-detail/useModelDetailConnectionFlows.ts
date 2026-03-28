import { useCallback, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { getStaticMessages } from "@/i18n/staticMessages";
import type { Connection, ModelConfig } from "@/lib/types";
import { moveConnectionInList } from "./useModelDetailDataSupport";
import { useConnectionHealthChecks } from "./useConnectionHealthChecks";

interface UseModelDetailConnectionFlowsInput {
  connections: Connection[];
  setConnections: Dispatch<SetStateAction<Connection[]>>;
  model: ModelConfig | null;
  setModel: Dispatch<SetStateAction<ModelConfig | null>>;
  editingConnection: Connection | null;
  refreshCurrentState: () => void | Promise<void>;
  setDialogTestingConnection: (testing: boolean) => void;
  setDialogTestResult: (result: { status: string; detail: string } | null) => void;
}

export function useModelDetailConnectionFlows({
  connections,
  setConnections,
  model,
  setModel,
  editingConnection,
  refreshCurrentState,
  setDialogTestingConnection,
  setDialogTestResult,
}: UseModelDetailConnectionFlowsInput) {
  const [reorderInFlight, setReorderInFlight] = useState(false);
  const { healthCheckingIds, runHealthChecks } = useConnectionHealthChecks({
    setConnections,
    onSuccessfulChecks: refreshCurrentState,
  });

  const handleReorderConnections = useCallback(
    async (connectionId: number, toIndex: number) => {
      if (!model || reorderInFlight) {
        return;
      }

      const previousConnections = connections;
      const fromIndex = previousConnections.findIndex((connection) => connection.id === connectionId);

      if (
        fromIndex === -1 ||
        toIndex < 0 ||
        toIndex >= previousConnections.length ||
        fromIndex === toIndex
      ) {
        return;
      }

      const optimisticConnections = moveConnectionInList(previousConnections, fromIndex, toIndex);
      setConnections(optimisticConnections);
      setModel((prev) => (prev ? { ...prev, connections: optimisticConnections } : prev));
      setReorderInFlight(true);

      try {
        const orderedConnections = await api.connections.movePriority(model.id, connectionId, toIndex);
        setConnections(orderedConnections);
        setModel((prev) => (prev ? { ...prev, connections: orderedConnections } : prev));
      } catch (error) {
        setConnections(previousConnections);
        setModel((prev) => (prev ? { ...prev, connections: previousConnections } : prev));
        const detail = error instanceof Error ? error.message : getStaticMessages().modelDetailData.reorderPriorityReverted;
        toast.error(`${detail} ${getStaticMessages().modelDetailData.reorderPriorityReverted}`);
      } finally {
        setReorderInFlight(false);
      }
    },
    [connections, model, reorderInFlight, setConnections, setModel],
  );

  const handleHealthCheck = useCallback(
    async (connectionId: number) => {
      const { successfulChecks, failedCount } = await runHealthChecks([connectionId]);
      const result = successfulChecks.get(connectionId);

      if (result) {
        toast.success(
          getStaticMessages().modelDetailData.healthCheckResult(
            result.health_status,
            String(result.response_time_ms),
          ),
        );
      }
      if (failedCount > 0) {
        toast.error(getStaticMessages().modelDetailData.healthCheckFailed);
      }
    },
    [runHealthChecks],
  );

  const handleHealthCheckAll = useCallback(async () => {
    const { failedCount, successfulChecks } = await runHealthChecks(
      connections.map((connection) => connection.id)
    );

    if (successfulChecks.size > 0) {
      toast.success(getStaticMessages().modelDetailData.checkedConnections(String(successfulChecks.size)));
    }
    if (failedCount > 0) {
      toast.error(getStaticMessages().modelDetailData.healthCheckFailedFor(String(failedCount)));
    }
  }, [connections, runHealthChecks]);

  const handleDialogTestConnection = useCallback(async () => {
    if (!editingConnection) {
      return;
    }

    setDialogTestingConnection(true);
    setDialogTestResult(null);
    try {
      const result = await api.connections.healthCheck(editingConnection.id);
      setDialogTestResult({ status: result.health_status, detail: result.detail });
      void refreshCurrentState();
    } catch {
      setDialogTestResult({ status: "error", detail: getStaticMessages().modelDetailData.connectionTestFailed });
    } finally {
      setDialogTestingConnection(false);
    }
  }, [
    editingConnection,
    refreshCurrentState,
    setDialogTestResult,
    setDialogTestingConnection,
  ]);

  return {
    healthCheckingIds,
    reorderInFlight,
    handleReorderConnections,
    handleHealthCheck,
    handleHealthCheckAll,
    handleDialogTestConnection,
  };
}
