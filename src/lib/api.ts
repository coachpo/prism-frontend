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
  ConnectionDropdownResponse,
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
  Profile,
  ProfileCreate,
  ProfileUpdate,
  ProfileActivateRequest,
} from "./types";

const rawApiBase = import.meta.env.VITE_API_BASE?.trim();
const API_BASE = rawApiBase ? rawApiBase.replace(/\/+$/, "") : "";

let currentProfileId: number | null = null;

export function setApiProfileId(profileId: number | null) {
  currentProfileId = profileId;
}

export function getApiProfileId(): number | null {
  return currentProfileId;
}

function extractErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") {
    return fallback;
  }

  const payload = body as Record<string, unknown>;
  const detail = payload.detail;

  if (typeof detail === "string" && detail.trim().length > 0) {
    return detail;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    if (typeof first === "string" && first.trim().length > 0) {
      return first;
    }
    if (first && typeof first === "object") {
      const firstDetail = first as Record<string, unknown>;
      if (typeof firstDetail.msg === "string" && firstDetail.msg.trim().length > 0) {
        return firstDetail.msg;
      }
    }
  }

  if (detail && typeof detail === "object") {
    const detailObject = detail as Record<string, unknown>;
    if (typeof detailObject.message === "string" && detailObject.message.trim().length > 0) {
      return detailObject.message;
    }
  }

  if (typeof payload.message === "string" && payload.message.trim().length > 0) {
    return payload.message;
  }

  if (typeof payload.error === "string" && payload.error.trim().length > 0) {
    return payload.error;
  }

  if (payload.error && typeof payload.error === "object") {
    const errorObject = payload.error as Record<string, unknown>;
    if (typeof errorObject.message === "string" && errorObject.message.trim().length > 0) {
      return errorObject.message;
    }
    if (typeof errorObject.detail === "string" && errorObject.detail.trim().length > 0) {
      return errorObject.detail;
    }
  }

  return fallback;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>),
  };

  if (path.startsWith("/api/") && currentProfileId !== null) {
    headers["X-Profile-Id"] = String(currentProfileId);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });
  if (!res.ok) {
    const fallbackMessage = `HTTP ${res.status}${res.statusText ? ` ${res.statusText}` : ""}`;
    const body = await res.json().catch(() => null);
    throw new Error(extractErrorMessage(body, fallbackMessage));
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// --- Providers ---
export const api = {
  profiles: {
    list: () => request<Profile[]>("/api/profiles"),
    getActive: () => request<Profile>("/api/profiles/active"),
    create: (data: ProfileCreate) =>
      request<Profile>("/api/profiles", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: ProfileUpdate) =>
      request<Profile>(`/api/profiles/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<void>(`/api/profiles/${id}`, { method: "DELETE" }),
    activate: (id: number, payload: ProfileActivateRequest) =>
      request<Profile>(`/api/profiles/${id}/activate`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  },

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
    byEndpoint: (endpointId: number) =>
      request<ModelConfigListItem[]>(`/api/models/by-endpoint/${endpointId}`),
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
    connections: () =>
      request<ConnectionDropdownResponse>("/api/endpoints/connections"),
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
