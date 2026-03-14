import { useCallback, useEffect, useRef, useState } from "react";
import { useCoalescedReconcile } from "@/hooks/useCoalescedReconcile";
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

  const latestGlobalEventIdRef = useRef(0);
  const latestMatchingEventIdRef = useRef(0);
  const markSyncCompleteRef = useRef<() => void>(() => undefined);

  const fetchEvents = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!silent) {
        setLoading(true);
      }

      try {
        const params = buildLoadbalanceListParams(filters);

        const [eventsData, statsData] = await Promise.all([
          api.loadbalance.listEvents(params),
          api.loadbalance.getStats({}),
        ]);

        setEvents(eventsData.items);
        setTotal(eventsData.total);
        setStats(statsData);
        const latestEventId = eventsData.items[0]?.id ?? 0;
        latestGlobalEventIdRef.current = latestEventId;
        latestMatchingEventIdRef.current = latestEventId;
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

  const fetchEventsAndSync = useCallback(async () => {
    await fetchEvents({ silent: true });
    markSyncCompleteRef.current();
  }, [fetchEvents]);

  const requestRealtimeReconciliation = useCoalescedReconcile({
    reconcile: fetchEventsAndSync,
    intervalMs: LOADBALANCE_RECONCILE_INTERVAL_MS,
    visibilityReloadThresholdMs: LOADBALANCE_VISIBILITY_RELOAD_THRESHOLD_MS,
  });

  const { connectionState, isSyncing, markSyncComplete } = useRealtimeData({
    profileId,
    channel: "loadbalance_events",
    onData: handleNewEvent,
    onDirty: requestRealtimeReconciliation,
    onReconnect: requestRealtimeReconciliation,
  });

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents, revision]);

  useEffect(() => {
    markSyncCompleteRef.current = markSyncComplete;
  }, [markSyncComplete]);

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
