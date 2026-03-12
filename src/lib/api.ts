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
  ConnectionSuccessRateParams,
  ThroughputStatsResponse,
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
  PricingTemplate,
  PricingTemplateCreate,
  PricingTemplateUpdate,
  PricingTemplateConnectionsResponse,
  ConnectionPricingTemplateUpdate,
  Profile,
  ProfileCreate,
  ProfileUpdate,
  ProfileActivateRequest,
  AuthStatus,
  AuthSettings,
  AuthSettingsUpdate,
  EmailVerificationRequest,
  EmailVerificationConfirmRequest,
  EmailVerificationResponse,
  LoginRequest,
  SessionResponse,
  PasswordResetRequest,
  PasswordResetConfirmRequest,
  ProxyApiKey,
  ProxyApiKeyCreate,
  ProxyApiKeyCreateResponse,
  ProxyApiKeyRotateResponse,
  LoadbalanceEventDetail,
  LoadbalanceEventListResponse,
  LoadbalanceStats,
} from "./types";

const rawApiBase = import.meta.env.VITE_API_BASE;
const API_BASE =
  typeof rawApiBase === "string" && rawApiBase.trim().length > 0
    ? rawApiBase.trim().replace(/\/+$/, "")
    : "";

let currentProfileId: number | null = null;

export function setApiProfileId(profileId: number | null) {
  currentProfileId = profileId;
}

export function getApiProfileId(): number | null {
  return currentProfileId;
}

export class ApiError extends Error {
  readonly status: number;
  readonly detail: unknown;

  constructor(message: string, status: number, detail: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

function extractErrorMessage(body: unknown): string {
  if (!body || typeof body !== "object") {
    return "Request failed";
  }
  const detail = (body as { detail?: unknown }).detail;
  if (typeof detail === "string" && detail.trim().length > 0) {
    return detail;
  }
  if (Array.isArray(detail) && detail.length > 0) {
    return detail.map((item) => JSON.stringify(item)).join(", ");
  }
  if (detail && typeof detail === "object") {
    const maybeMessage = (detail as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim().length > 0) {
      return maybeMessage;
    }
  }
  return "Request failed";
}

const AUTH_REFRESH_EXEMPT_PATHS = new Set([
  "/api/auth/status",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/refresh",
  "/api/auth/password-reset/request",
  "/api/auth/password-reset/confirm",
]);

function buildHeaders(path: string, init?: RequestInit): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>),
  };

  if (path.startsWith("/api/") && currentProfileId !== null) {
    headers["X-Profile-Id"] = String(currentProfileId);
  }

  return headers;
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        return false;
      }

      const body = (await res.json()) as SessionResponse;
      return body.authenticated;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

async function request<T>(
  path: string,
  init?: RequestInit,
  options?: { allowAuthRefresh?: boolean }
): Promise<T> {
  const headers = buildHeaders(path, init);

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });

  const allowAuthRefresh = options?.allowAuthRefresh ?? true;
  if (
    res.status === 401 &&
    allowAuthRefresh &&
    path.startsWith("/api/") &&
    !AUTH_REFRESH_EXEMPT_PATHS.has(path) &&
    (await refreshSession())
  ) {
    return request<T>(path, init, { allowAuthRefresh: false });
  }

  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    throw new ApiError(extractErrorMessage(body), res.status, body);
  }
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

  auth: {
    status: () => request<AuthStatus>("/api/auth/status"),
    login: (data: LoginRequest) =>
      request<SessionResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    logout: () => request<SessionResponse>("/api/auth/logout", { method: "POST" }),
    refresh: () => request<SessionResponse>("/api/auth/refresh", { method: "POST" }),
    session: () => request<SessionResponse>("/api/auth/session"),
    requestPasswordReset: (data: PasswordResetRequest) =>
      request<{ success: boolean }>("/api/auth/password-reset/request", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    confirmPasswordReset: (data: PasswordResetConfirmRequest) =>
      request<{ success: boolean }>("/api/auth/password-reset/confirm", {
        method: "POST",
        body: JSON.stringify(data),
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
    movePosition: (id: number, toIndex: number) =>
      request<Endpoint[]>(`/api/endpoints/${id}/position`, {
        method: "PATCH",
        body: JSON.stringify({ to_index: toIndex }),
      }),
    duplicate: (id: number) =>
      request<Endpoint>(`/api/endpoints/${id}/duplicate`, {
        method: "POST",
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
    movePriority: (modelConfigId: number, connectionId: number, toIndex: number) =>
      request<Connection[]>(`/api/models/${modelConfigId}/connections/${connectionId}/priority`, {
        method: "PATCH",
        body: JSON.stringify({ to_index: toIndex }),
      }),
    delete: (id: number) =>
      request<void>(`/api/connections/${id}`, { method: "DELETE" }),
    healthCheck: (id: number) =>
      request<HealthCheckResponse>(`/api/connections/${id}/health-check`, {
        method: "POST",
      }),
    owner: (id: number) =>
      request<ConnectionOwnerResponse>(`/api/connections/${id}/owner`),
    setPricingTemplate: (id: number, data: ConnectionPricingTemplateUpdate) =>
      request<Connection>(`/api/connections/${id}/pricing-template`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },

  pricingTemplates: {
    list: () => request<PricingTemplate[]>("/api/pricing-templates"),
    get: (id: number) => request<PricingTemplate>(`/api/pricing-templates/${id}`),
    create: (data: PricingTemplateCreate) =>
      request<PricingTemplate>("/api/pricing-templates", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: PricingTemplateUpdate) =>
      request<PricingTemplate>(`/api/pricing-templates/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: number) => request<void>(`/api/pricing-templates/${id}`, { method: "DELETE" }),
    connections: (id: number) =>
      request<PricingTemplateConnectionsResponse>(`/api/pricing-templates/${id}/connections`),
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
    connectionSuccessRates: (params?: ConnectionSuccessRateParams) => {
      const qs = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
        });
      }
      const query = qs.toString();
      return request<ConnectionSuccessRate[]>(
        `/api/stats/connection-success-rates${query ? `?${query}` : ""}`
      );
    },
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
    throughput: (params?: { from_time?: string; to_time?: string; model_id?: string; provider_type?: string; endpoint_id?: number; connection_id?: number }) => {
      const qs = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
        });
      }
      const query = qs.toString();
      return request<ThroughputStatsResponse>(
        `/api/stats/throughput${query ? `?${query}` : ""}`
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
    auth: {
      get: () => request<AuthSettings>("/api/settings/auth"),
      update: (data: AuthSettingsUpdate) =>
        request<AuthSettings>("/api/settings/auth", {
          method: "PUT",
          body: JSON.stringify(data),
        }),
      requestEmailVerification: (data: EmailVerificationRequest) =>
        request<EmailVerificationResponse>("/api/settings/auth/email-verification/request", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      confirmEmailVerification: (data: EmailVerificationConfirmRequest) =>
        request<EmailVerificationResponse>("/api/settings/auth/email-verification/confirm", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      proxyKeys: {
        list: () => request<ProxyApiKey[]>("/api/settings/auth/proxy-keys"),
        create: (data: ProxyApiKeyCreate) =>
          request<ProxyApiKeyCreateResponse>("/api/settings/auth/proxy-keys", {
            method: "POST",
            body: JSON.stringify(data),
          }),
        rotate: (id: number) =>
          request<ProxyApiKeyRotateResponse>(`/api/settings/auth/proxy-keys/${id}/rotate`, {
            method: "POST",
          }),
        delete: (id: number) =>
          request<{ deleted: boolean }>(`/api/settings/auth/proxy-keys/${id}`, {
            method: "DELETE",
          }),
      },
      webauthn: {
        registrationOptions: () =>
          request<Record<string, unknown>>("/api/auth/webauthn/register/options", {
            method: "POST",
          }),
        registrationVerify: (data: { credential: Record<string, unknown>; device_name?: string }) =>
          request<{ success: boolean; credential_id: number }>("/api/auth/webauthn/register/verify", {
            method: "POST",
            body: JSON.stringify(data),
          }),
        authenticationOptions: (username?: string) => {
          const qs = new URLSearchParams();
          const normalizedUsername = username?.trim();
          if (normalizedUsername) {
            qs.set("username", normalizedUsername);
          }
          const query = qs.toString();
          return request<Record<string, unknown>>(
            `/api/auth/webauthn/authenticate/options${query ? `?${query}` : ""}`,
            {
              method: "POST",
            }
          );
        },
        authenticationVerify: (data: { credential: Record<string, unknown> }) =>
          request<{ success: boolean; authenticated: boolean; username: string }>("/api/auth/webauthn/authenticate/verify", {
            method: "POST",
            body: JSON.stringify(data),
          }),
        listCredentials: () =>
          request<{
            items: Array<{
              id: number;
              device_name: string | null;
              backup_eligible: boolean | null;
              backup_state: boolean | null;
              last_used_at: string | null;
              created_at: string;
            }>;
            total: number;
          }>("/api/auth/webauthn/credentials"),
        revokeCredential: (credentialId: number) =>
          request<{ success: boolean }>(`/api/auth/webauthn/credentials/${credentialId}`, {
            method: "DELETE",
          }),
      },
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
  loadbalance: {
    listEvents: (params: {
      connection_id?: number;
      event_type?: string;
      failure_kind?: string;
      model_id?: string;
      from_time?: string;
      to_time?: string;
      limit?: number;
      offset?: number;
    }) => {
      const qs = new URLSearchParams();
      if (params.connection_id !== undefined)
        qs.set("connection_id", String(params.connection_id));
      if (params.event_type) qs.set("event_type", params.event_type);
      if (params.failure_kind) qs.set("failure_kind", params.failure_kind);
      if (params.model_id) qs.set("model_id", params.model_id);
      if (params.from_time) qs.set("from_time", params.from_time);
      if (params.to_time) qs.set("to_time", params.to_time);
      if (params.limit !== undefined) qs.set("limit", String(params.limit));
      if (params.offset !== undefined) qs.set("offset", String(params.offset));
      const query = qs.toString();
      return request<LoadbalanceEventListResponse>(
        `/api/loadbalance/events${query ? `?${query}` : ""}`
      );
    },
    getEvent: (eventId: number) =>
      request<LoadbalanceEventDetail>(`/api/loadbalance/events/${eventId}`),
    deleteEvents: (params: {
      before?: string;
      older_than_days?: number;
      delete_all?: boolean;
    }) => {
      const qs = new URLSearchParams();
      if (params.before) qs.set("before", params.before);
      if (params.older_than_days !== undefined)
        qs.set("older_than_days", String(params.older_than_days));
      if (params.delete_all) qs.set("delete_all", "true");
      return request<{ deleted_count: number }>(
        `/api/loadbalance/events?${qs.toString()}`,
        { method: "DELETE" }
      );
    },
    getStats: (params: { from_time?: string; to_time?: string }) => {
      const qs = new URLSearchParams();
      if (params.from_time) qs.set("from_time", params.from_time);
      if (params.to_time) qs.set("to_time", params.to_time);
      const query = qs.toString();
      return request<LoadbalanceStats>(
        `/api/loadbalance/stats${query ? `?${query}` : ""}`
      );
    },
  },
};
