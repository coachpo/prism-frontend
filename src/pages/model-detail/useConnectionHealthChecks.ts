import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Connection, HealthCheckResponse } from "@/lib/types";
import { applyConnectionHealthChecks } from "./useModelDetailDataSupport";

interface UseConnectionHealthChecksInput {
  id: string | undefined;
  revision: number;
  loading: boolean;
  connections: Connection[];
  setConnections: Dispatch<SetStateAction<Connection[]>>;
}

export function useConnectionHealthChecks({
  id,
  revision,
  loading,
  connections,
  setConnections,
}: UseConnectionHealthChecksInput) {
  const [healthCheckingIds, setHealthCheckingIds] = useState<Set<number>>(new Set());
  const autoHealthCheckKeyRef = useRef<string | null>(null);

  const runHealthChecks = useCallback(
    async (connectionIds: number[]) => {
      if (connectionIds.length === 0) {
        return {
          successfulChecks: new Map<number, HealthCheckResponse>(),
          failedCount: 0,
        };
      }

      setHealthCheckingIds((prev) => {
        const next = new Set(prev);
        connectionIds.forEach((connectionId) => next.add(connectionId));
        return next;
      });

      const results = await Promise.allSettled(
        connectionIds.map(async (connectionId) => ({
          connectionId,
          response: await api.connections.healthCheck(connectionId),
        }))
      );

      const successfulChecks = new Map<number, HealthCheckResponse>();
      let failedCount = 0;

      for (const result of results) {
        if (result.status === "fulfilled") {
          successfulChecks.set(result.value.connectionId, result.value.response);
        } else {
          failedCount += 1;
        }
      }

      setConnections((prevConnections) =>
        applyConnectionHealthChecks(prevConnections, successfulChecks)
      );

      setHealthCheckingIds((prev) => {
        const next = new Set(prev);
        connectionIds.forEach((connectionId) => next.delete(connectionId));
        return next;
      });

      return { successfulChecks, failedCount };
    },
    [setConnections]
  );

  useEffect(() => {
    autoHealthCheckKeyRef.current = null;
  }, [id, revision]);

  useEffect(() => {
    if (!id || loading) {
      return;
    }

    const connectionIds = [...connections]
      .map((connection) => connection.id)
      .sort((a, b) => a - b);
    if (connectionIds.length === 0) {
      return;
    }

    const endpointIdsHash = connectionIds.join(",");
    const runKey = `${id}:${revision}:${endpointIdsHash}`;
    if (autoHealthCheckKeyRef.current === runKey) {
      return;
    }
    autoHealthCheckKeyRef.current = runKey;

    let cancelled = false;

    const runAutoHealthChecks = async () => {
      const { failedCount } = await runHealthChecks(connectionIds);
      if (cancelled) {
        return;
      }

      if (failedCount > 0) {
        toast.warning(
          `Auto health check could not verify ${failedCount} connection${failedCount === 1 ? "" : "s"}.`
        );
      }
    };

    void runAutoHealthChecks();

    return () => {
      cancelled = true;
    };
  }, [connections, id, loading, revision, runHealthChecks]);

  return {
    healthCheckingIds,
    runHealthChecks,
  };
}
