import type {
  Connection,
  ConnectionCreate,
  LoadbalanceStrategySummary,
  LoadbalanceStrategy,
  LoadbalanceStrategyCreate,
  LoadbalanceStrategyUpdate,
  ModelConnectionsBatchParams,
  ModelConnectionsBatchResponse,
  ConnectionDropdownResponse,
  ConnectionHealthCheckPreviewResponse,
  ConnectionOwnerResponse,
  ConnectionPricingTemplateUpdate,
  ConnectionUpdate,
  Endpoint,
  EndpointModelsBatchParams,
  EndpointModelsBatchResponse,
  EndpointCreate,
  EndpointUpdate,
  HealthCheckResponse,
  ModelConfig,
  ModelConfigCreate,
  ModelConfigListItem,
  ModelConfigUpdate,
  PricingTemplate,
  PricingTemplateConnectionsResponse,
  PricingTemplateCreate,
  PricingTemplateUpdate,
  Profile,
  ProfileActivateRequest,
  ProfileBootstrapResponse,
  ProfileCreate,
  ProfileUpdate,
  VendorModelUsageItem,
  Vendor,
  VendorCreate,
  VendorUpdate,
} from "../types";
import { createDefaultRoutingPolicy, normalizeFailureStatusCodes } from "../loadbalanceRoutingPolicy";
import { request } from "./core";

type RawAdaptiveRoutingPolicy = {
  kind?: string;
  routing_objective?: string;
  deadline_budget_ms?: unknown;
  hedge?: {
    enabled?: unknown;
    delay_ms?: unknown;
    max_additional_attempts?: unknown;
  };
  circuit_breaker?: {
    failure_status_codes?: unknown;
    base_open_seconds?: unknown;
    failure_threshold?: unknown;
    backoff_multiplier?: unknown;
    max_open_seconds?: unknown;
    jitter_ratio?: unknown;
    ban_mode?: unknown;
    max_open_strikes_before_ban?: unknown;
    ban_duration_seconds?: unknown;
  };
  admission?: {
    respect_qps_limit?: unknown;
    respect_in_flight_limits?: unknown;
  };
  monitoring?: {
    enabled?: unknown;
    stale_after_seconds?: unknown;
    endpoint_ping_weight?: unknown;
    conversation_delay_weight?: unknown;
    failure_penalty_weight?: unknown;
  };
};

type RawLoadbalanceStrategySummary = Omit<LoadbalanceStrategySummary, "routing_policy"> & {
  routing_policy?: RawAdaptiveRoutingPolicy;
};

type RawLoadbalanceStrategy = Omit<LoadbalanceStrategy, "routing_policy"> & {
  routing_policy?: RawAdaptiveRoutingPolicy;
};

type RawModelConfigListItem = Omit<ModelConfigListItem, "loadbalance_strategy"> & {
  loadbalance_strategy: RawLoadbalanceStrategySummary | null;
};

type RawModelConfig = Omit<ModelConfig, "loadbalance_strategy"> & {
  loadbalance_strategy: RawLoadbalanceStrategySummary | null;
};

type RawEndpointModelsBatchResponse = {
  items: Array<{
    endpoint_id: number;
    models: RawModelConfigListItem[];
  }>;
};

function normalizeNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeStatusCodes(value: unknown) {
  return Array.isArray(value)
    ? normalizeFailureStatusCodes(
        value.filter((statusCode): statusCode is number => typeof statusCode === "number"),
      )
    : [];
}

function normalizeRoutingPolicy(routingPolicy?: RawAdaptiveRoutingPolicy): LoadbalanceStrategy["routing_policy"] {
  const defaultPolicy = createDefaultRoutingPolicy(
    routingPolicy?.routing_objective === "maximize_availability"
      ? "maximize_availability"
      : "minimize_latency",
  );
  const hedge = routingPolicy?.hedge;
  const circuitBreaker = routingPolicy?.circuit_breaker;
  const admission = routingPolicy?.admission;
  const monitoring = routingPolicy?.monitoring;
  const banMode =
    circuitBreaker?.ban_mode === "temporary" || circuitBreaker?.ban_mode === "manual"
      ? circuitBreaker.ban_mode
      : "off";
  const maxOpenStrikesBeforeBan = normalizeNumber(
    circuitBreaker?.max_open_strikes_before_ban,
    defaultPolicy.circuit_breaker.max_open_strikes_before_ban,
  );
  const banDurationSeconds = normalizeNumber(
    circuitBreaker?.ban_duration_seconds,
    defaultPolicy.circuit_breaker.ban_duration_seconds,
  );

  return {
    kind: "adaptive",
    routing_objective: defaultPolicy.routing_objective,
    deadline_budget_ms: normalizeNumber(
      routingPolicy?.deadline_budget_ms,
      defaultPolicy.deadline_budget_ms,
    ),
    hedge: {
      enabled: normalizeBoolean(hedge?.enabled, defaultPolicy.hedge.enabled),
      delay_ms: normalizeNumber(hedge?.delay_ms, defaultPolicy.hedge.delay_ms),
      max_additional_attempts: normalizeNumber(
        hedge?.max_additional_attempts,
        defaultPolicy.hedge.max_additional_attempts,
      ),
    },
    circuit_breaker: {
      failure_status_codes:
        routingPolicy?.circuit_breaker?.failure_status_codes === undefined
          ? [...defaultPolicy.circuit_breaker.failure_status_codes]
          : normalizeStatusCodes(routingPolicy.circuit_breaker.failure_status_codes),
      base_open_seconds: normalizeNumber(
        circuitBreaker?.base_open_seconds,
        defaultPolicy.circuit_breaker.base_open_seconds,
      ),
      failure_threshold: normalizeNumber(
        circuitBreaker?.failure_threshold,
        defaultPolicy.circuit_breaker.failure_threshold,
      ),
      backoff_multiplier: normalizeNumber(
        circuitBreaker?.backoff_multiplier,
        defaultPolicy.circuit_breaker.backoff_multiplier,
      ),
      max_open_seconds: normalizeNumber(
        circuitBreaker?.max_open_seconds,
        defaultPolicy.circuit_breaker.max_open_seconds,
      ),
      jitter_ratio: normalizeNumber(
        circuitBreaker?.jitter_ratio,
        defaultPolicy.circuit_breaker.jitter_ratio,
      ),
      ban_mode: banMode,
      max_open_strikes_before_ban: banMode === "off" ? 0 : Math.max(maxOpenStrikesBeforeBan, 1),
      ban_duration_seconds: banMode === "temporary" ? Math.max(banDurationSeconds, 1) : 0,
    },
    admission: {
      respect_qps_limit: normalizeBoolean(
        admission?.respect_qps_limit,
        defaultPolicy.admission.respect_qps_limit,
      ),
      respect_in_flight_limits: normalizeBoolean(
        admission?.respect_in_flight_limits,
        defaultPolicy.admission.respect_in_flight_limits,
      ),
    },
    monitoring: {
      enabled: normalizeBoolean(monitoring?.enabled, defaultPolicy.monitoring.enabled),
      stale_after_seconds: normalizeNumber(
        monitoring?.stale_after_seconds,
        defaultPolicy.monitoring.stale_after_seconds,
      ),
      endpoint_ping_weight: normalizeNumber(
        monitoring?.endpoint_ping_weight,
        defaultPolicy.monitoring.endpoint_ping_weight,
      ),
      conversation_delay_weight: normalizeNumber(
        monitoring?.conversation_delay_weight,
        defaultPolicy.monitoring.conversation_delay_weight,
      ),
      failure_penalty_weight: normalizeNumber(
        monitoring?.failure_penalty_weight,
        defaultPolicy.monitoring.failure_penalty_weight,
      ),
    },
  };
}

function normalizeLoadbalanceStrategySummary(
  strategy: RawLoadbalanceStrategySummary | null,
): LoadbalanceStrategySummary | null {
  if (!strategy) {
    return null;
  }

  const { routing_policy: routingPolicy, ...rest } = strategy;

  return {
    ...rest,
    routing_policy: normalizeRoutingPolicy(routingPolicy),
  };
}

function normalizeLoadbalanceStrategy(strategy: RawLoadbalanceStrategy): LoadbalanceStrategy {
  const normalizedSummary = normalizeLoadbalanceStrategySummary(strategy);
  if (!normalizedSummary) {
    throw new Error("Loadbalance strategy normalization unexpectedly received null");
  }

  return normalizedSummary as LoadbalanceStrategy;
}

function normalizeModelConfigListItem(model: RawModelConfigListItem): ModelConfigListItem {
  return {
    ...model,
    loadbalance_strategy: normalizeLoadbalanceStrategySummary(model.loadbalance_strategy),
  };
}

function normalizeModelConfig(model: RawModelConfig): ModelConfig {
  return {
    ...model,
    loadbalance_strategy: normalizeLoadbalanceStrategySummary(model.loadbalance_strategy),
  };
}

export const profiles = {
  bootstrap: () => request<ProfileBootstrapResponse>("/api/profiles/bootstrap"),
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
  delete: (id: number) => request<void>(`/api/profiles/${id}`, { method: "DELETE" }),
  activate: (id: number, payload: ProfileActivateRequest) =>
    request<Profile>(`/api/profiles/${id}/activate`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const vendors = {
  list: () => request<Vendor[]>("/api/vendors"),
  get: (id: number) => request<Vendor>(`/api/vendors/${id}`),
  create: (data: VendorCreate) =>
    request<Vendor>("/api/vendors", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: VendorUpdate) =>
    request<Vendor>(`/api/vendors/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  models: (id: number) => request<VendorModelUsageItem[]>(`/api/vendors/${id}/models`),
  delete: (id: number) => request<void>(`/api/vendors/${id}`, { method: "DELETE" }),
};

export const models = {
  list: () =>
    request<RawModelConfigListItem[]>("/api/models").then((models) =>
      models.map(normalizeModelConfigListItem),
    ),
  byEndpoints: (data: EndpointModelsBatchParams) =>
    request<RawEndpointModelsBatchResponse>("/api/models/by-endpoints", {
      method: "POST",
      body: JSON.stringify(data),
    }).then((response) => ({
      items: response.items.map((item) => ({
        ...item,
        models: item.models.map(normalizeModelConfigListItem),
      })),
    }) as EndpointModelsBatchResponse),
  byEndpoint: (endpointId: number) =>
    request<RawModelConfigListItem[]>(`/api/models/by-endpoint/${endpointId}`).then((models) =>
      models.map(normalizeModelConfigListItem),
    ),
  get: (id: number) =>
    request<RawModelConfig>(`/api/models/${id}`).then(normalizeModelConfig),
  create: (data: ModelConfigCreate) =>
    request<RawModelConfig>("/api/models", {
      method: "POST",
      body: JSON.stringify(data),
    }).then(normalizeModelConfig),
  update: (id: number, data: ModelConfigUpdate) =>
    request<RawModelConfig>(`/api/models/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }).then(normalizeModelConfig),
  delete: (id: number) => request<void>(`/api/models/${id}`, { method: "DELETE" }),
};

export const loadbalanceStrategies = {
  list: () =>
    request<RawLoadbalanceStrategy[]>("/api/loadbalance/strategies").then((strategies) =>
      strategies.map(normalizeLoadbalanceStrategy),
    ),
  get: (id: number) =>
    request<RawLoadbalanceStrategy>(`/api/loadbalance/strategies/${id}`).then(
      normalizeLoadbalanceStrategy,
    ),
  create: (data: LoadbalanceStrategyCreate) =>
    request<RawLoadbalanceStrategy>("/api/loadbalance/strategies", {
      method: "POST",
      body: JSON.stringify(data),
    }).then(normalizeLoadbalanceStrategy),
  update: (id: number, data: LoadbalanceStrategyUpdate) =>
    request<RawLoadbalanceStrategy>(`/api/loadbalance/strategies/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }).then(normalizeLoadbalanceStrategy),
  delete: (id: number) =>
    request<{ deleted: boolean }>(`/api/loadbalance/strategies/${id}`, {
      method: "DELETE",
    }),
};

export const endpoints = {
  list: () => request<Endpoint[]>("/api/endpoints"),
  connections: () => request<ConnectionDropdownResponse>("/api/endpoints/connections"),
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
  delete: (id: number) => request<void>(`/api/endpoints/${id}`, { method: "DELETE" }),
};

export const connections = {
  list: (modelConfigId: number) =>
    request<Connection[]>(`/api/models/${modelConfigId}/connections`),
  byModels: (data: ModelConnectionsBatchParams) =>
    request<ModelConnectionsBatchResponse>("/api/models/connections/batch", {
      method: "POST",
      body: JSON.stringify(data),
    }),
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
    request<Connection[]>(
      `/api/models/${modelConfigId}/connections/${connectionId}/priority`,
      {
        method: "PATCH",
        body: JSON.stringify({ to_index: toIndex }),
      }
    ),
  delete: (id: number) => request<void>(`/api/connections/${id}`, { method: "DELETE" }),
  healthCheck: (id: number) =>
    request<HealthCheckResponse>(`/api/connections/${id}/health-check`, {
      method: "POST",
    }),
  healthCheckPreview: (modelConfigId: number, data: ConnectionCreate) =>
    request<ConnectionHealthCheckPreviewResponse>(
      `/api/models/${modelConfigId}/connections/health-check-preview`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    ),
  owner: (id: number) => request<ConnectionOwnerResponse>(`/api/connections/${id}/owner`),
  setPricingTemplate: (id: number, data: ConnectionPricingTemplateUpdate) =>
    request<Connection>(`/api/connections/${id}/pricing-template`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

export const pricingTemplates = {
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
};
