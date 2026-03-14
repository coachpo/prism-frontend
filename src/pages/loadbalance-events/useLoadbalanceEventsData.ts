import { useCallback, useEffect, useRef, useState } from "react";
import { useRealtimeData } from "@/hooks/useRealtimeData";
import { api } from "@/lib/api";
import type { LoadbalanceEvent, LoadbalanceStats } from "@/lib/types";
import {
  LOADBALANCE_RECONCILE_INTERVAL_MS,
  LOADBALANCE_VISIBILITY_RELOAD_THRESHOLD_MS,
} from "./constants";
import {
  buildLoadbalanceListParams,
  matchesLoadbalanceFilters,
} from "./loadbalanceEventUtils";
import type { LoadbalanceEventFilters } from "./types";

interface UseLoadbalanceEventsDataInput {
  filters: LoadbalanceEventFilters;
  revision: number;
  profileId: number | null;
}

export function useLoadbalanceEventsData({
  filters,
  revision,
  profileId,
}: UseLoadbalanceEventsDataInput) {
  const [events, setEvents] = useState<LoadbalanceEvent[]>([]);
  const [stats, setStats] = useState<LoadbalanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [newEventIds, setNewEventIds] = useState<Set<number>>(() => new Set());
  const [reconcileRevision, setReconcileRevision] = useState(0);

  const hiddenAtRef = useRef<number | null>(null);
  const latestGlobalEventIdRef = useRef(0);
  const latestMatchingEventIdRef = useRef(0);

  const fetchEvents = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!silent) {
        setLoading(true);
      }

      try {
        const params = buildLoadbalanceListParams(filters);
        const matchingParams = { ...params };

        const [eventsData, statsData, latestGlobalEvent, latestMatchingEvent] = await Promise.all([
          api.loadbalance.listEvents(params),
          api.loadbalance.getStats({}),
          api.loadbalance.listEvents({ limit: 1, offset: 0 }),
          api.loadbalance.listEvents({ ...matchingParams, limit: 1, offset: 0 }),
        ]);

        setEvents(eventsData.items);
        setTotal(eventsData.total);
        setStats(statsData);
        latestGlobalEventIdRef.current = latestGlobalEvent.items[0]?.id ?? 0;
        latestMatchingEventIdRef.current = latestMatchingEvent.items[0]?.id ?? 0;
        setNewEventIds(new Set());
      } catch (error) {
        console.error("Failed to load loadbalance events", error);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  const handleNewEvent = useCallback(
    (event: LoadbalanceEvent) => {
      if (event.id <= latestGlobalEventIdRef.current) {
        return;
      }

      latestGlobalEventIdRef.current = event.id;

      setStats((prev) => {
        if (!prev) {
          return prev;
        }

        return {
          ...prev,
          total_events: prev.total_events + 1,
          events_by_type: {
            ...prev.events_by_type,
            [event.event_type]: (prev.events_by_type[event.event_type] ?? 0) + 1,
          },
        };
      });

      if (!matchesLoadbalanceFilters(event, filters)) {
        return;
      }

      if (event.id <= latestMatchingEventIdRef.current) {
        return;
      }

      latestMatchingEventIdRef.current = event.id;
      setTotal((prev) => prev + 1);

      if (filters.offset !== 0) {
        return;
      }

      setEvents((prev) => [event, ...prev].slice(0, filters.limit));
      setNewEventIds((prev) => new Set(prev).add(event.id));
    },
    [filters]
  );

  const requestRealtimeReconciliation = useCallback(() => {
    setReconcileRevision((prev) => prev + 1);
  }, []);

  const { connectionState, isSyncing, markSyncComplete } = useRealtimeData({
    profileId,
    channel: "loadbalance_events",
    onData: handleNewEvent,
    onDirty: requestRealtimeReconciliation,
    onReconnect: requestRealtimeReconciliation,
  });

  const fetchEventsAndSync = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      await fetchEvents({ silent });
      markSyncComplete();
    },
    [fetchEvents, markSyncComplete]
  );

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents, revision]);

  useEffect(() => {
    if (reconcileRevision === 0) {
      return;
    }

    void fetchEventsAndSync({ silent: true });
  }, [fetchEventsAndSync, reconcileRevision]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void fetchEventsAndSync({ silent: true });
    }, LOADBALANCE_RECONCILE_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [fetchEventsAndSync]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        hiddenAtRef.current = Date.now();
        return;
      }

      if (
        hiddenAtRef.current !== null &&
        Date.now() - hiddenAtRef.current > LOADBALANCE_VISIBILITY_RELOAD_THRESHOLD_MS
      ) {
        void fetchEventsAndSync({ silent: true });
      }

      hiddenAtRef.current = null;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchEventsAndSync]);

  const clearNewEvent = (eventId: number) => {
    setNewEventIds((prev) => {
      if (!prev.has(eventId)) {
        return prev;
      }

      const next = new Set(prev);
      next.delete(eventId);
      return next;
    });
  };

  return {
    events,
    stats,
    loading,
    total,
    newEventIds,
    clearNewEvent,
    refresh: () => fetchEvents(),
    connectionState,
    isSyncing,
  };
}
