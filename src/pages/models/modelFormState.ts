import type {
  ModelConfig,
  ModelConfigCreate,
  ModelConfigListItem,
  ModelConfigUpdate,
  ProxyTarget,
  Provider,
} from "@/lib/types";

export type SubmitEventLike = Pick<Event, "preventDefault">;

export const DEFAULT_MODEL_FORM_DATA: ModelConfigCreate = {
  provider_id: 0,
  model_id: "",
  display_name: "",
  model_type: "native",
  proxy_targets: [],
  loadbalance_strategy_id: null,
  is_enabled: true,
};

export function normalizeProxyTargets(proxyTargets: ProxyTarget[] | null | undefined): ProxyTarget[] {
  const seenTargetIds = new Set<string>();

  return (proxyTargets ?? [])
    .map((target) => ({
      target_model_id: target.target_model_id.trim(),
      position: target.position,
    }))
    .filter((target) => {
      if (!target.target_model_id || seenTargetIds.has(target.target_model_id)) {
        return false;
      }

      seenTargetIds.add(target.target_model_id);
      return true;
    })
    .map((target, index) => ({
      target_model_id: target.target_model_id,
      position: index,
    }));
}

function getNormalizedRoutingState(formData: ModelConfigCreate) {
  return {
    proxy_targets: formData.model_type === "proxy" ? normalizeProxyTargets(formData.proxy_targets) : [],
    loadbalance_strategy_id:
      formData.model_type === "native" ? formData.loadbalance_strategy_id ?? null : null,
  };
}

export function moveProxyTarget(proxyTargets: ProxyTarget[], fromIndex: number, toIndex: number): ProxyTarget[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= proxyTargets.length ||
    toIndex >= proxyTargets.length ||
    fromIndex === toIndex
  ) {
    return normalizeProxyTargets(proxyTargets);
  }

  const nextTargets = [...normalizeProxyTargets(proxyTargets)];
  const [movedTarget] = nextTargets.splice(fromIndex, 1);

  if (!movedTarget) {
    return normalizeProxyTargets(proxyTargets);
  }

  nextTargets.splice(toIndex, 0, movedTarget);
  return normalizeProxyTargets(nextTargets);
}

export function appendProxyTarget(proxyTargets: ProxyTarget[], targetModelId: string): ProxyTarget[] {
  return normalizeProxyTargets([
    ...normalizeProxyTargets(proxyTargets),
    { target_model_id: targetModelId, position: proxyTargets.length },
  ]);
}

export function removeProxyTarget(proxyTargets: ProxyTarget[], targetModelId: string): ProxyTarget[] {
  return normalizeProxyTargets(
    normalizeProxyTargets(proxyTargets).filter((target) => target.target_model_id !== targetModelId),
  );
}

export function createEditModelFormData(model: ModelConfigListItem): ModelConfigCreate {
  return {
    provider_id: model.provider_id,
    model_id: model.model_id,
    display_name: model.display_name || "",
    model_type: model.model_type,
    proxy_targets: normalizeProxyTargets(model.proxy_targets),
    loadbalance_strategy_id: model.loadbalance_strategy_id,
    is_enabled: model.is_enabled,
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

export function setModelTypeOnForm(
  formData: ModelConfigCreate,
  modelType: "native" | "proxy",
): ModelConfigCreate {
  return {
    ...formData,
    model_type: modelType,
    proxy_targets: modelType === "native" ? [] : normalizeProxyTargets(formData.proxy_targets),
  };
}

export function setLoadbalanceStrategyIdOnForm(
  formData: ModelConfigCreate,
  strategyId: number | null,
): ModelConfigCreate {
  return { ...formData, loadbalance_strategy_id: strategyId };
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

export function toModelListItem(
  model: ModelConfig,
  existing?: ModelConfigListItem,
): ModelConfigListItem {
  return {
    id: model.id,
    provider_id: model.provider_id,
    provider: model.provider,
    model_id: model.model_id,
    display_name: model.display_name,
    model_type: model.model_type,
    proxy_targets: normalizeProxyTargets(model.proxy_targets),
    loadbalance_strategy_id: model.loadbalance_strategy_id,
    loadbalance_strategy: model.loadbalance_strategy,
    is_enabled: model.is_enabled,
    connection_count: model.connections.length,
    active_connection_count: model.connections.filter((connection) => connection.is_active).length,
    health_success_rate: existing?.health_success_rate ?? null,
    health_total_requests: existing?.health_total_requests ?? 0,
    created_at: model.created_at,
    updated_at: model.updated_at,
  };
}
