import type {
  Provider,
  ProviderUpdate,
  ModelConfig,
  ModelConfigListItem,
  ModelConfigCreate,
  ModelConfigUpdate,
  Endpoint,
  EndpointCreate,
  EndpointUpdate,
  HealthCheckResponse,
  RequestLogListResponse,
  StatsSummary,
  StatsRequestParams,
  StatsSummaryParams,
  EndpointSuccessRate,
  ConfigExportResponse,
  ConfigImportRequest,
  ConfigImportResponse,
  AuditLogListResponse,
  AuditLogDetail,
  AuditLogParams,
  AuditLogDeleteResponse,
  BatchDeleteResponse,
} from "./types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// --- Providers ---
export const api = {
  providers: {
    list: () => request<Provider[]>("/api/providers"),
    get: (id: number) => request<Provider>(`/api/providers/${id}`),
    update: (id: number, data: ProviderUpdate) =>
      request<Provider>(`/api/providers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },

  models: {
    list: () => request<ModelConfigListItem[]>("/api/models"),
    get: (id: number) => request<ModelConfig>(`/api/models/${id}`),
    create: (data: ModelConfigCreate) =>
      request<ModelConfig>("/api/models", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: ModelConfigUpdate) =>
      request<ModelConfig>(`/api/models/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<void>(`/api/models/${id}`, { method: "DELETE" }),
  },

  endpoints: {
    list: (modelConfigId: number) =>
      request<Endpoint[]>(`/api/models/${modelConfigId}/endpoints`),
    create: (modelConfigId: number, data: EndpointCreate) =>
      request<Endpoint>(`/api/models/${modelConfigId}/endpoints`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: EndpointUpdate) =>
      request<Endpoint>(`/api/endpoints/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<void>(`/api/endpoints/${id}`, { method: "DELETE" }),
    healthCheck: (id: number) =>
      request<HealthCheckResponse>(`/api/endpoints/${id}/health-check`, {
        method: "POST",
      }),
  },

  stats: {
    requests: (params?: StatsRequestParams) => {
      const qs = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
        });
      }
      const query = qs.toString();
      return request<RequestLogListResponse>(
        `/api/stats/requests${query ? `?${query}` : ""}`
      );
    },
    summary: (params?: StatsSummaryParams) => {
      const qs = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
        });
      }
      const query = qs.toString();
      return request<StatsSummary>(
        `/api/stats/summary${query ? `?${query}` : ""}`
      );
    },
    endpointSuccessRates: () =>
      request<EndpointSuccessRate[]>("/api/stats/endpoint-success-rates"),
    delete: (params: { older_than_days?: number; delete_all?: boolean }) => {
      const qs = new URLSearchParams();
      if (params.older_than_days !== undefined)
        qs.set("older_than_days", String(params.older_than_days));
      if (params.delete_all) qs.set("delete_all", "true");
      return request<BatchDeleteResponse>(
        `/api/stats/requests?${qs.toString()}`,
        { method: "DELETE" }
      );
    },
  },

  config: {
    export: () => request<ConfigExportResponse>("/api/config/export"),
    import: (data: ConfigImportRequest) =>
      request<ConfigImportResponse>("/api/config/import", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  audit: {
    list: (params?: AuditLogParams) => {
      const qs = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
        });
      }
      const query = qs.toString();
      return request<AuditLogListResponse>(
        `/api/audit/logs${query ? `?${query}` : ""}`
      );
    },
    get: (id: number) => request<AuditLogDetail>(`/api/audit/logs/${id}`),
    delete: (params: { before?: string; older_than_days?: number; delete_all?: boolean }) => {
      const qs = new URLSearchParams();
      if (params.before) qs.set("before", params.before);
      if (params.older_than_days !== undefined)
        qs.set("older_than_days", String(params.older_than_days));
      if (params.delete_all) qs.set("delete_all", "true");
      return request<AuditLogDeleteResponse>(
        `/api/audit/logs?${qs.toString()}`,
        { method: "DELETE" }
      );
    },
  },
};
