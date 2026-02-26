import {
  applyTokenPair,
  clearSessionTokens,
  getAccessToken,
  getRefreshToken,
} from "@/lib/auth";
import type {
  ApiKeyCreateRequest,
  ApiKeyCreateResponse,
  ApiKeyResponse,
  ApiKeyUpdateRequest,
  AuditLogListResponse,
  AuditLogQuery,
  AuditLogResponse,
  AuthMessageResponse,
  AuthStatusResponse,
  ChangePasswordRequest,
  ConfigExportResponse,
  ConfigImportRequest,
  ConfigImportResponse,
  DeleteRowsResponse,
  DisableAuthConfirmRequest,
  EnableAuthRequest,
  LoginPasswordRequest,
  OtpChallengeResponse,
  OtpRequest,
  PasskeyLoginBeginRequest,
  PasskeyLoginBeginResponse,
  PasskeyLoginFinishRequest,
  PasskeyOtpRequest,
  PasskeyRegisterBeginRequest,
  PasskeyRegisterBeginResponse,
  PasskeyRegisterFinishRequest,
  PasskeyResponse,
  PasskeyRevokeRequest,
  PasswordResetConfirmRequest,
  ProfileModel,
  ProfileModelPricing,
  ProfileModelPricingUpsertRequest,
  ProfileModelsUpsertRequest,
  Provider,
  ProviderProfile,
  ProviderProfileCreateRequest,
  ProviderProfileUpdateRequest,
  ProviderType,
  RefreshTokenRequest,
  RequestLogListResponse,
  RequestLogQuery,
  StatsSummaryResponse,
  TelemetrySnapshot,
  TokenPairResponse,
} from "@/lib/types";

const rawApiBase = import.meta.env.VITE_API_BASE?.trim();
const API_BASE = rawApiBase ? rawApiBase.replace(/\/+$/, "") : "";

type RequestOptions = {
  auth?: boolean;
  retryOnAuth?: boolean;
};

export class ApiClientError extends Error {
  status: number;
  code: string;
  details: Record<string, unknown> | null;

  constructor(
    status: number,
    code: string,
    message: string,
    details: Record<string, unknown> | null = null,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function buildQuery(params: object) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    query.set(key, String(value));
  }
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

async function toApiError(res: Response) {
  const fallback = new ApiClientError(
    res.status,
    `HTTP_${res.status}`,
    `HTTP ${res.status}`,
    null,
  );

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return fallback;
  }

  if (typeof body !== "object" || body === null) {
    return fallback;
  }

  const envelope = body as Record<string, unknown>;
  const detail = envelope.detail;
  if (typeof detail === "object" && detail !== null) {
    const nestedError = (detail as Record<string, unknown>).error;
    if (typeof nestedError === "object" && nestedError !== null) {
      const parsed = nestedError as Record<string, unknown>;
      return new ApiClientError(
        res.status,
        typeof parsed.code === "string" ? parsed.code : fallback.code,
        typeof parsed.message === "string" ? parsed.message : fallback.message,
        (parsed.details as Record<string, unknown> | null) ?? null,
      );
    }
    if (typeof detail === "string") {
      return new ApiClientError(res.status, fallback.code, detail, null);
    }
  }

  const topLevelError = envelope.error;
  if (typeof topLevelError === "object" && topLevelError !== null) {
    const parsed = topLevelError as Record<string, unknown>;
    return new ApiClientError(
      res.status,
      typeof parsed.code === "string" ? parsed.code : fallback.code,
      typeof parsed.message === "string" ? parsed.message : fallback.message,
      (parsed.details as Record<string, unknown> | null) ?? null,
    );
  }

  return fallback;
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshTokens() {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    try {
      const pair = await request<TokenPairResponse>(
        "/api/v2/auth/token/refresh",
        {
          method: "POST",
          body: JSON.stringify({ refresh_token: refreshToken } satisfies RefreshTokenRequest),
        },
        { auth: false, retryOnAuth: false },
      );
      applyTokenPair(pair);
      return true;
    } catch {
      clearSessionTokens();
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  options: RequestOptions = {},
): Promise<T> {
  const auth = options.auth ?? true;
  const retryOnAuth = options.retryOnAuth ?? true;

  const headers = new Headers(init.headers ?? {});
  const isFormDataBody = typeof FormData !== "undefined" && init.body instanceof FormData;
  if (!isFormDataBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const accessToken = getAccessToken();
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
  }

  const response = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (response.status === 401 && auth && retryOnAuth) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      return request<T>(path, init, { auth: true, retryOnAuth: false });
    }
  }

  if (!response.ok) {
    throw await toApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  providers: {
    list: () => request<Provider[]>("/api/v2/providers", {}, { auth: true }),
  },

  profiles: {
    listByProvider: (provider: ProviderType) =>
      request<ProviderProfile[]>(`/api/v2/providers/${provider}/profiles`, {}, { auth: true }),

    create: (provider: ProviderType, body: ProviderProfileCreateRequest) =>
      request<ProviderProfile>(`/api/v2/providers/${provider}/profiles`, {
        method: "POST",
        body: JSON.stringify(body),
      }),

    patch: (profileId: string, body: ProviderProfileUpdateRequest) =>
      request<ProviderProfile>(`/api/v2/profiles/${profileId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),

    delete: (profileId: string) =>
      request<void>(`/api/v2/profiles/${profileId}`, { method: "DELETE" }),

    listModels: (profileId: string) =>
      request<ProfileModel[]>(`/api/v2/profiles/${profileId}/models`),

    upsertModels: (profileId: string, body: ProfileModelsUpsertRequest) =>
      request<ProfileModel[]>(`/api/v2/profiles/${profileId}/models`, {
        method: "POST",
        body: JSON.stringify(body),
      }),

    deleteModel: (profileId: string, modelId: string) =>
      request<void>(
        `/api/v2/profiles/${profileId}/models/${encodeURIComponent(modelId)}`,
        { method: "DELETE" },
      ),

    upsertPricing: (
      profileId: string,
      modelId: string,
      body: ProfileModelPricingUpsertRequest,
    ) =>
      request<ProfileModelPricing>(
        `/api/v2/profiles/${profileId}/models/${encodeURIComponent(modelId)}/pricing`,
        {
          method: "PUT",
          body: JSON.stringify(body),
        },
      ),

    deletePricing: (profileId: string, modelId: string) =>
      request<void>(
        `/api/v2/profiles/${profileId}/models/${encodeURIComponent(modelId)}/pricing`,
        { method: "DELETE" },
      ),

    findById: async (profileId: string) => {
      const providers = await api.providers.list();
      const profileSets = await Promise.all(
        providers.map((provider) => api.profiles.listByProvider(provider.provider_type)),
      );
      for (const profiles of profileSets) {
        const match = profiles.find((profile) => profile.id === profileId);
        if (match) {
          return match;
        }
      }
      return null;
    },
  },

  auth: {
    status: () => request<AuthStatusResponse>("/api/v2/auth/status", {}, { auth: false }),

    setupRequestOtp: (body: OtpRequest) =>
      request<OtpChallengeResponse>("/api/v2/auth/setup/request-otp", {
        method: "POST",
        body: JSON.stringify(body),
      }, { auth: false }),

    setupEnable: (body: EnableAuthRequest) =>
      request<TokenPairResponse>("/api/v2/auth/setup/enable", {
        method: "POST",
        body: JSON.stringify(body),
      }, { auth: false }),

    loginPassword: (body: LoginPasswordRequest) =>
      request<TokenPairResponse>("/api/v2/auth/login/password", {
        method: "POST",
        body: JSON.stringify(body),
      }, { auth: false }),

    loginPasskeyBegin: (body: PasskeyLoginBeginRequest) =>
      request<PasskeyLoginBeginResponse>("/api/v2/auth/login/passkey/begin", {
        method: "POST",
        body: JSON.stringify(body),
      }, { auth: false }),

    loginPasskeyFinish: (body: PasskeyLoginFinishRequest) =>
      request<TokenPairResponse>("/api/v2/auth/login/passkey/finish", {
        method: "POST",
        body: JSON.stringify(body),
      }, { auth: false }),

    refresh: (refreshToken: string) =>
      request<TokenPairResponse>("/api/v2/auth/token/refresh", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken } satisfies RefreshTokenRequest),
      }, { auth: false, retryOnAuth: false }),

    logout: () => request<AuthMessageResponse>("/api/v2/auth/logout", { method: "POST" }),

    revokeAllSessions: () =>
      request<AuthMessageResponse>("/api/v2/auth/revoke-all-sessions", { method: "POST" }),

    changePassword: (body: ChangePasswordRequest) =>
      request<AuthMessageResponse>("/api/v2/auth/password/change", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    passwordResetRequestOtp: (body: OtpRequest) =>
      request<OtpChallengeResponse>("/api/v2/auth/password/reset/request-otp", {
        method: "POST",
        body: JSON.stringify(body),
      }, { auth: false }),

    passwordResetConfirm: (body: PasswordResetConfirmRequest) =>
      request<AuthMessageResponse>("/api/v2/auth/password/reset/confirm", {
        method: "POST",
        body: JSON.stringify(body),
      }, { auth: false }),

    disableRequestOtp: () =>
      request<OtpChallengeResponse>("/api/v2/auth/disable/request-otp", { method: "POST" }),

    disableConfirm: (body: DisableAuthConfirmRequest) =>
      request<AuthMessageResponse>("/api/v2/auth/disable/confirm", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    listApiKeys: () => request<ApiKeyResponse[]>("/api/v2/auth/api-keys"),

    createApiKey: (body: ApiKeyCreateRequest) =>
      request<ApiKeyCreateResponse>("/api/v2/auth/api-keys", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    updateApiKey: (keyId: string, body: ApiKeyUpdateRequest) =>
      request<ApiKeyResponse>(`/api/v2/auth/api-keys/${keyId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),

    revokeApiKey: (keyId: string) =>
      request<AuthMessageResponse>(`/api/v2/auth/api-keys/${keyId}`, {
        method: "DELETE",
      }),

    listPasskeys: () => request<PasskeyResponse[]>("/api/v2/auth/passkeys"),

    requestPasskeyOtp: (body: PasskeyOtpRequest) =>
      request<OtpChallengeResponse>("/api/v2/auth/passkeys/request-otp", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    beginPasskeyRegistration: (body: PasskeyRegisterBeginRequest) =>
      request<PasskeyRegisterBeginResponse>("/api/v2/auth/passkeys/register/begin", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    finishPasskeyRegistration: (body: PasskeyRegisterFinishRequest) =>
      request<PasskeyResponse>("/api/v2/auth/passkeys/register/finish", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    revokePasskey: (passkeyId: string, body: PasskeyRevokeRequest) =>
      request<AuthMessageResponse>(`/api/v2/auth/passkeys/${passkeyId}`, {
        method: "DELETE",
        body: JSON.stringify(body),
      }),
  },

  stats: {
    requests: (query: RequestLogQuery = {}) =>
      request<RequestLogListResponse>(`/api/v2/stats/requests${buildQuery(query)}`),

    summary: () => request<StatsSummaryResponse>("/api/v2/stats/summary"),

    telemetry: () => request<TelemetrySnapshot>("/api/v2/stats/telemetry"),

    delete: (params: { older_than_days?: number; delete_all?: boolean }) =>
      request<DeleteRowsResponse>(`/api/v2/stats/requests${buildQuery(params)}`, {
        method: "DELETE",
      }),
  },

  audit: {
    list: (query: AuditLogQuery = {}) =>
      request<AuditLogListResponse>(`/api/v2/audit/logs${buildQuery(query)}`),

    get: (auditId: number) => request<AuditLogResponse>(`/api/v2/audit/logs/${auditId}`),

    delete: (params: { older_than_days?: number; delete_all?: boolean }) =>
      request<DeleteRowsResponse>(`/api/v2/audit/logs${buildQuery(params)}`, {
        method: "DELETE",
      }),
  },

  config: {
    export: () => request<ConfigExportResponse>("/api/v2/config/export"),

    import: (body: ConfigImportRequest) =>
      request<ConfigImportResponse>("/api/v2/config/import", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },
};
