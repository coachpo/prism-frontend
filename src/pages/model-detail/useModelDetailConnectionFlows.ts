import { useCallback, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Connection, ModelConfig } from "@/lib/types";
import { moveConnectionInList } from "./useModelDetailDataSupport";
import { useConnectionHealthChecks } from "./useConnectionHealthChecks";

interface UseModelDetailConnectionFlowsInput {
  connections: Connection[];
  setConnections: Dispatch<SetStateAction<Connection[]>>;
  model: ModelConfig | null;
  setModel: Dispatch<SetStateAction<ModelConfig | null>>;
  editingConnection: Connection | null;
  setDialogTestingConnection: (testing: boolean) => void;
  setDialogTestResult: (result: { status: string; detail: string } | null) => void;
}

export function useModelDetailConnectionFlows({
  connections,
  setConnections,
  model,
  setModel,
  editingConnection,
  setDialogTestingConnection,
  setDialogTestResult,
}: UseModelDetailConnectionFlowsInput) {
  const [reorderInFlight, setReorderInFlight] = useState(false);
  const { healthCheckingIds, runHealthChecks } = useConnectionHealthChecks({
    setConnections,
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
        const detail = error instanceof Error ? error.message : "Failed to save routing priority.";
        toast.error(`${detail} Order reverted.`);
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
        toast.success(`Health: ${result.health_status} (${result.response_time_ms}ms)`);
      }
      if (failedCount > 0) {
        toast.error("Health check failed");
      }
    },
    [runHealthChecks],
  );

  const handleHealthCheckAll = useCallback(async () => {
    const { failedCount, successfulChecks } = await runHealthChecks(
      connections.map((connection) => connection.id)
    );

    if (successfulChecks.size > 0) {
      toast.success(
        `Checked ${successfulChecks.size} connection${successfulChecks.size === 1 ? "" : "s"}`
      );
    }
    if (failedCount > 0) {
      toast.error(
        `Health check failed for ${failedCount} connection${failedCount === 1 ? "" : "s"}`
      );
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
    } catch {
      setDialogTestResult({ status: "error", detail: "Connection test failed" });
    } finally {
      setDialogTestingConnection(false);
    }
  }, [editingConnection, setDialogTestResult, setDialogTestingConnection]);

  return {
    healthCheckingIds,
    reorderInFlight,
    handleReorderConnections,
    handleHealthCheck,
    handleHealthCheckAll,
    handleDialogTestConnection,
  };
}
