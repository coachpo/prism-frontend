import type {
  LoadBalancingStrategy,
  ModelConfig,
  ModelConfigCreate,
  ModelConfigListItem,
  ModelConfigUpdate,
  Provider,
} from "@/lib/types";

export type SubmitEventLike = Pick<Event, "preventDefault">;

export const DEFAULT_MODEL_FORM_DATA: ModelConfigCreate = {
  provider_id: 0,
  model_id: "",
  display_name: "",
  model_type: "native",
  redirect_to: null,
  lb_strategy: "single",
  is_enabled: true,
  failover_recovery_enabled: true,
  failover_recovery_cooldown_seconds: 60,
};

function getNormalizedRoutingState(formData: ModelConfigCreate) {
  const isFailoverNative = formData.model_type === "native" && formData.lb_strategy === "failover";

  return {
    redirect_to: formData.model_type === "proxy" ? formData.redirect_to : null,
    lb_strategy: formData.model_type === "native" ? formData.lb_strategy : "single",
    failover_recovery_enabled: isFailoverNative ? formData.failover_recovery_enabled : true,
    failover_recovery_cooldown_seconds: isFailoverNative
      ? formData.failover_recovery_cooldown_seconds
      : 60,
  };
}

export function createEditModelFormData(model: ModelConfigListItem): ModelConfigCreate {
  return {
    provider_id: model.provider_id,
    model_id: model.model_id,
    display_name: model.display_name || "",
    model_type: model.model_type,
    redirect_to: model.redirect_to,
    lb_strategy: model.lb_strategy,
    is_enabled: model.is_enabled,
    failover_recovery_enabled: model.failover_recovery_enabled,
    failover_recovery_cooldown_seconds: model.failover_recovery_cooldown_seconds,
  };
}

export function createNewModelFormData(providers: Provider[]): ModelConfigCreate {
  return {
    ...DEFAULT_MODEL_FORM_DATA,
    provider_id: providers[0]?.id ?? 0,
  };
}

export function toModelCreatePayload(formData: ModelConfigCreate): ModelConfigCreate {
  return {
    ...formData,
    ...getNormalizedRoutingState(formData),
  };
}

export function toModelUpdatePayload(formData: ModelConfigCreate): ModelConfigUpdate {
  return {
    provider_id: formData.provider_id,
    display_name: formData.display_name || null,
    model_type: formData.model_type,
    is_enabled: formData.is_enabled,
    ...getNormalizedRoutingState(formData),
  };
}

export function setModelTypeOnForm(formData: ModelConfigCreate, modelType: "native" | "proxy"): ModelConfigCreate {
  return {
    ...formData,
    model_type: modelType,
    redirect_to: modelType === "native" ? null : formData.redirect_to,
  };
}

export function setLoadBalancingStrategyOnForm(
  formData: ModelConfigCreate,
  strategy: LoadBalancingStrategy,
): ModelConfigCreate {
  return { ...formData, lb_strategy: strategy };
}

export function getNativeModelsForProvider(
  models: ModelConfigListItem[],
  providerId: number,
  excludedModelId?: string,
): ModelConfigListItem[] {
  return models.filter(
    (model) =>
      model.model_type === "native" &&
      model.provider_id === providerId &&
      (!excludedModelId || model.model_id !== excludedModelId),
  );
}

export function toModelListItem(model: ModelConfig, existing?: ModelConfigListItem): ModelConfigListItem {
  return {
    id: model.id,
    provider_id: model.provider_id,
    provider: model.provider,
    model_id: model.model_id,
    display_name: model.display_name,
    model_type: model.model_type,
    redirect_to: model.redirect_to,
    lb_strategy: model.lb_strategy,
    is_enabled: model.is_enabled,
    failover_recovery_enabled: model.failover_recovery_enabled,
    failover_recovery_cooldown_seconds: model.failover_recovery_cooldown_seconds,
    connection_count: model.connections.length,
    active_connection_count: model.connections.filter((connection) => connection.is_active).length,
    health_success_rate: existing?.health_success_rate ?? null,
    health_total_requests: existing?.health_total_requests ?? 0,
    created_at: model.created_at,
    updated_at: model.updated_at,
  };
}
