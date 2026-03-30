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
  ProfileCreate,
  ProfileUpdate,
  VendorModelUsageItem,
  Vendor,
  VendorCreate,
  VendorUpdate,
} from "../types";
import { request } from "./core";

type RawAdaptiveRoutingPolicy = {
  kind?: string;
  legacy_strategy_type?: LoadbalanceStrategy["strategy_type"];
  legacy_auto_recovery?: LoadbalanceStrategy["auto_recovery"];
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
};

type RawLoadbalanceStrategySummary = Omit<
  LoadbalanceStrategySummary,
  "strategy_type" | "auto_recovery"
> & {
  strategy_type?: LoadbalanceStrategySummary["strategy_type"];
  auto_recovery?: LoadbalanceStrategySummary["auto_recovery"];
  routing_policy?: RawAdaptiveRoutingPolicy;
};

type RawLoadbalanceStrategy = Omit<LoadbalanceStrategy, "strategy_type" | "auto_recovery"> & {
  strategy_type?: LoadbalanceStrategy["strategy_type"];
  auto_recovery?: LoadbalanceStrategy["auto_recovery"];
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

function normalizeStatusCodes(value: unknown) {
  return Array.isArray(value)
    ? value.filter((statusCode): statusCode is number => typeof statusCode === "number").sort((a, b) => a - b)
    : [];
}

function normalizeAutoRecovery(
  autoRecovery: LoadbalanceStrategy["auto_recovery"] | undefined,
): LoadbalanceStrategy["auto_recovery"] {
  if (!autoRecovery || autoRecovery.mode !== "enabled") {
    return { mode: "disabled" };
  }

  const ban = autoRecovery.ban;

  return {
    mode: "enabled",
    status_codes: normalizeStatusCodes(autoRecovery.status_codes),
    cooldown: {
      base_seconds: normalizeNumber(autoRecovery.cooldown.base_seconds, 60),
      failure_threshold: normalizeNumber(autoRecovery.cooldown.failure_threshold, 2),
      backoff_multiplier: normalizeNumber(autoRecovery.cooldown.backoff_multiplier, 2),
      max_cooldown_seconds: normalizeNumber(autoRecovery.cooldown.max_cooldown_seconds, 900),
      jitter_ratio: normalizeNumber(autoRecovery.cooldown.jitter_ratio, 0.2),
    },
    ban:
      ban.mode === "temporary"
        ? {
            mode: "temporary",
            max_cooldown_strikes_before_ban: normalizeNumber(
              ban.max_cooldown_strikes_before_ban,
              0,
            ),
            ban_duration_seconds: normalizeNumber(ban.ban_duration_seconds, 0),
          }
        : ban.mode === "manual"
          ? {
              mode: "manual",
              max_cooldown_strikes_before_ban: normalizeNumber(
                ban.max_cooldown_strikes_before_ban,
                0,
              ),
            }
          : { mode: "off" },
  };
}

function deriveAutoRecoveryFromRoutingPolicy(
  strategyType: LoadbalanceStrategy["strategy_type"],
  routingPolicy?: RawAdaptiveRoutingPolicy,
): LoadbalanceStrategy["auto_recovery"] {
  if (!routingPolicy || routingPolicy.kind !== "adaptive" || strategyType === "single") {
    return { mode: "disabled" };
  }

  const circuitBreaker = routingPolicy.circuit_breaker;
  const banMode =
    circuitBreaker?.ban_mode === "temporary" || circuitBreaker?.ban_mode === "manual"
      ? circuitBreaker.ban_mode
      : "off";

  return {
    mode: "enabled",
    status_codes: normalizeStatusCodes(circuitBreaker?.failure_status_codes),
    cooldown: {
      base_seconds: normalizeNumber(circuitBreaker?.base_open_seconds, 60),
      failure_threshold: normalizeNumber(circuitBreaker?.failure_threshold, 2),
      backoff_multiplier: normalizeNumber(circuitBreaker?.backoff_multiplier, 2),
      max_cooldown_seconds: normalizeNumber(circuitBreaker?.max_open_seconds, 900),
      jitter_ratio: normalizeNumber(circuitBreaker?.jitter_ratio, 0.2),
    },
    ban:
      banMode === "temporary"
        ? {
            mode: "temporary",
            max_cooldown_strikes_before_ban: normalizeNumber(
              circuitBreaker?.max_open_strikes_before_ban,
              0,
            ),
            ban_duration_seconds: normalizeNumber(circuitBreaker?.ban_duration_seconds, 0),
          }
        : banMode === "manual"
          ? {
              mode: "manual",
              max_cooldown_strikes_before_ban: normalizeNumber(
                circuitBreaker?.max_open_strikes_before_ban,
                0,
              ),
            }
          : { mode: "off" },
  };
}

function normalizeLoadbalanceStrategySummary(
  strategy: RawLoadbalanceStrategySummary | null,
): LoadbalanceStrategySummary | null {
  if (!strategy) {
    return null;
  }

  const {
    routing_policy: routingPolicy,
    strategy_type: rawStrategyType,
    auto_recovery: rawAutoRecovery,
    ...rest
  } = strategy;
  const strategyType =
    rawStrategyType ?? routingPolicy?.legacy_strategy_type ?? (routingPolicy?.kind === "adaptive" ? "failover" : "single");
  const autoRecovery = normalizeAutoRecovery(
    rawAutoRecovery ?? routingPolicy?.legacy_auto_recovery ?? deriveAutoRecoveryFromRoutingPolicy(strategyType, routingPolicy),
  );

  return {
    ...rest,
    strategy_type: strategyType,
    auto_recovery: autoRecovery,
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
