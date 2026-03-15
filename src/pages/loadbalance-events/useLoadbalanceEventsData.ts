import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { LoadbalanceEvent, LoadbalanceStats } from "@/lib/types";
import { buildLoadbalanceListParams } from "./loadbalanceEventUtils";
import type { LoadbalanceEventFilters } from "./types";

interface UseLoadbalanceEventsDataInput {
  filters: LoadbalanceEventFilters;
  revision: number;
}

export function useLoadbalanceEventsData({
  filters,
  revision,
}: UseLoadbalanceEventsDataInput) {
  const [events, setEvents] = useState<LoadbalanceEvent[]>([]);
  const [stats, setStats] = useState<LoadbalanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchEvents = useCallback(async () => {
    setLoading(true);

    try {
      const params = buildLoadbalanceListParams(filters);

      const [eventsData, statsData] = await Promise.all([
        api.loadbalance.listEvents(params),
        api.loadbalance.getStats({}),
      ]);

      setEvents(eventsData.items);
      setTotal(eventsData.total);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to load loadbalance events", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents, revision]);

  return {
    events,
    stats,
    loading,
    total,
    refresh: () => fetchEvents(),
  };
}
