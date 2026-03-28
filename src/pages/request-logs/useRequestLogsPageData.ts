import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { getStaticMessages } from "@/i18n/staticMessages";
import type {
  ApiFamily,
  Endpoint,
  ModelConfigListItem,
  RequestLogEntry,
} from "@/lib/types";
import type { RequestLogPageState } from "./queryParams";
import { timeRangeToFromTime } from "./queryParams";

const API_FAMILIES: ApiFamily[] = ["openai", "anthropic", "gemini"];

function toApiFamily(value: string): ApiFamily | undefined {
  return API_FAMILIES.find((apiFamily) => apiFamily === value);
}

interface ConnectionOption {
  id: number;
  label: string;
}

export interface FilterOptions {
  apiFamilies: ApiFamily[];
  models: ModelConfigListItem[];
  endpoints: Endpoint[];
  connections: ConnectionOption[];
}

interface UseRequestLogsPageDataParams {
  revision: number;
  state: RequestLogPageState;
}

export function useRequestLogsPageData({ revision, state }: UseRequestLogsPageDataParams) {
  const messages = getStaticMessages();
  const [items, setItems] = useState<RequestLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    apiFamilies: API_FAMILIES,
    models: [],
    endpoints: [],
    connections: [],
  });
  const [filterOptionsLoaded, setFilterOptionsLoaded] = useState(false);

  const fetchIdRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bootstrapFilterOptions = useCallback(async () => {
    const [modelsResult, endpointsResult, connectionsResult] =
      await Promise.allSettled([
        api.models.list(),
        api.endpoints.list(),
        api.endpoints.connections(),
      ]);

    const models = modelsResult.status === "fulfilled" ? modelsResult.value : [];
    const endpoints = endpointsResult.status === "fulfilled" ? endpointsResult.value : [];

    const connMap: ConnectionOption[] = [];
    if (connectionsResult.status === "fulfilled") {
      const data = connectionsResult.value;
      for (const c of data.items) {
        if (!connMap.some((x) => x.id === c.id)) {
          connMap.push({ id: c.id, label: `#${c.id}${c.name ? ` — ${c.name}` : ""}` });
        }
      }
    }

    setFilterOptions({ apiFamilies: API_FAMILIES, models, endpoints, connections: connMap });
    setFilterOptionsLoaded(true);
  }, []);

  useEffect(() => {
    void revision;
    const bootstrapId = setTimeout(() => {
      void bootstrapFilterOptions();
    }, 0);

    return () => {
      clearTimeout(bootstrapId);
    };
  }, [bootstrapFilterOptions, revision]);

  const fetchData = useCallback(() => {
    const id = ++fetchIdRef.current;
    setLoading(true);
    setError(null);

    const isExact = state.request_id !== "";
    const fromTime = timeRangeToFromTime(state.time_range);

    const params = isExact
      ? { request_id: parseInt(state.request_id, 10), limit: 1 }
        : {
          ingress_request_id: state.ingress_request_id || undefined,
          model_id: state.model_id || undefined,
          api_family: state.api_family ? toApiFamily(state.api_family) : undefined,
          status_family: state.status_family === "all" ? undefined : state.status_family,
          connection_id: state.connection_id ? parseInt(state.connection_id, 10) : undefined,
          endpoint_id: state.endpoint_id ? parseInt(state.endpoint_id, 10) : undefined,
          from_time: fromTime,
          limit: state.limit,
          offset: state.offset,
        };

    api.stats
      .requests(params)
      .then((res) => {
        if (id !== fetchIdRef.current) return;
        setItems(res.items);
        setTotal(res.total);
      })
      .catch((err) => {
        if (id !== fetchIdRef.current) return;
        setError(err instanceof Error ? err.message : messages.requestLogs.loadFailed);
        setItems([]);
        setTotal(0);
      })
      .finally(() => {
        if (id !== fetchIdRef.current) return;
        setLoading(false);
      });
  }, [
    state.request_id,
    state.ingress_request_id,
    state.model_id,
    state.api_family,
    state.status_family,
    state.connection_id,
    state.endpoint_id,
    state.time_range,
    state.limit,
    state.offset,
    messages.requestLogs.loadFailed,
  ]);

  useEffect(() => {
    void revision;
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchData, 300);
    return () => {
      if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    };
  }, [fetchData, revision]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    items,
    total,
    loading,
    error,
    filterOptions,
    filterOptionsLoaded,
    refresh,
  };
}
