import { useCallback, useEffect, useRef } from "react";

interface UseCoalescedReconcileOptions {
  enabled?: boolean;
  intervalMs?: number;
  reconcile: () => Promise<void>;
  visibilityReloadThresholdMs?: number;
}

export function useCoalescedReconcile({
  enabled = true,
  intervalMs,
  reconcile,
  visibilityReloadThresholdMs,
}: UseCoalescedReconcileOptions) {
  const reconcileRef = useRef(reconcile);
  const hiddenAtRef = useRef<number | null>(null);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const queuedRef = useRef(false);

  useEffect(() => {
    reconcileRef.current = reconcile;
  }, [reconcile]);

  const requestReconcile = useCallback(async () => {
    if (!enabled) {
      return;
    }

    if (inFlightRef.current) {
      queuedRef.current = true;
      return inFlightRef.current;
    }

    const request = (async () => {
      try {
        await reconcileRef.current();
      } finally {
        inFlightRef.current = null;

        if (queuedRef.current) {
          queuedRef.current = false;
          void requestReconcile();
        }
      }
    })();

    inFlightRef.current = request;
    return request;
  }, [enabled]);

  useEffect(() => {
    if (!enabled || intervalMs === undefined) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void requestReconcile();
    }, intervalMs);

    return () => window.clearInterval(intervalId);
  }, [enabled, intervalMs, requestReconcile]);

  useEffect(() => {
    if (!enabled || visibilityReloadThresholdMs === undefined) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        hiddenAtRef.current = Date.now();
        return;
      }

      if (
        hiddenAtRef.current !== null &&
        Date.now() - hiddenAtRef.current > visibilityReloadThresholdMs
      ) {
        void requestReconcile();
      }

      hiddenAtRef.current = null;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, requestReconcile, visibilityReloadThresholdMs]);

  return requestReconcile;
}
