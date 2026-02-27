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
  Connection,
  ConnectionCreate,
  ConnectionUpdate,
  HealthCheckResponse,
  ConnectionOwnerResponse,
  RequestLogListResponse,
  StatsSummary,
  StatsRequestParams,
  StatsSummaryParams,
  ConnectionSuccessRate,
  ConfigExportResponse,
  ConfigImportRequest,
  ConfigImportResponse,
  AuditLogListResponse,
  AuditLogDetail,
  AuditLogParams,
  AuditLogDeleteResponse,
  BatchDeleteResponse,
  CostingSettingsResponse,
  CostingSettingsUpdate,
  HeaderBlocklistRule,
  HeaderBlocklistRuleCreate,
  HeaderBlocklistRuleUpdate,
  SpendingReportParams,
  SpendingReportResponse,
} from "./types";

const rawApiBase = import.meta.env.VITE_API_BASE?.trim();
const API_BASE = rawApiBase ? rawApiBase.replace(/\/+$/, "") : "";

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
    list: () => request<Endpoint[]>("/api/endpoints"),
    create: (data: EndpointCreate) =>
      request<Endpoint>("/api/endpoints", {
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
  },

  connections: {
    list: (modelConfigId: number) =>
      request<Connection[]>(`/api/models/${modelConfigId}/connections`),
    create: (modelConfigId: number, data: ConnectionCreate) =>
      request<Connection>(`/api/models/${modelConfigId}/connections`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: ConnectionUpdate) =>
      request<Connection>(`/api/connections/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<void>(`/api/connections/${id}`, { method: "DELETE" }),
    healthCheck: (id: number) =>
      request<HealthCheckResponse>(`/api/connections/${id}/health-check`, {
        method: "POST",
      }),
    owner: (id: number) =>
      request<ConnectionOwnerResponse>(`/api/connections/${id}/owner`),
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
    connectionSuccessRates: () =>
      request<ConnectionSuccessRate[]>("/api/stats/connection-success-rates"),
    spending: (params?: SpendingReportParams) => {
      const qs = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
        });
      }
      const query = qs.toString();
      return request<SpendingReportResponse>(
        `/api/stats/spending${query ? `?${query}` : ""}`
      );
    },
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

  settings: {
    costing: {
      get: () => request<CostingSettingsResponse>("/api/settings/costing"),
      update: (data: CostingSettingsUpdate) =>
        request<CostingSettingsResponse>("/api/settings/costing", {
          method: "PUT",
          body: JSON.stringify(data),
        }),
    },
  },

  config: {
    export: () => request<ConfigExportResponse>("/api/config/export"),
    import: (data: ConfigImportRequest) =>
      request<ConfigImportResponse>("/api/config/import", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    headerBlocklistRules: {
      list: (includeDisabled = true) =>
        request<HeaderBlocklistRule[]>(
          `/api/config/header-blocklist-rules?include_disabled=${includeDisabled}`
        ),
      get: (id: number) =>
        request<HeaderBlocklistRule>(`/api/config/header-blocklist-rules/${id}`),
      create: (data: HeaderBlocklistRuleCreate) =>
        request<HeaderBlocklistRule>("/api/config/header-blocklist-rules", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (id: number, data: HeaderBlocklistRuleUpdate) =>
        request<HeaderBlocklistRule>(`/api/config/header-blocklist-rules/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        }),
      delete: (id: number) =>
        request<void>(`/api/config/header-blocklist-rules/${id}`, {
          method: "DELETE",
        }),
    },
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
