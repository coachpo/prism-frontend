import type {
  ApiFamily,
  ModelConfig,
  ModelConfigCreate,
  ModelConfigListItem,
  ModelConfigUpdate,
  ProxyTarget,
  Vendor,
} from "@/lib/types";

export type SubmitEventLike = Pick<Event, "preventDefault">;

const DEFAULT_API_FAMILY: ApiFamily = "openai";

function vendorKeyToApiFamily(key: string | undefined): ApiFamily {
  if (key === "anthropic") {
    return "anthropic";
  }

  if (key === "google") {
    return "gemini";
  }

  return "openai";
}

export function resolveModelApiFamily(
  model: Pick<ModelConfigListItem, "api_family"> | Pick<ModelConfig, "api_family">,
): ApiFamily {
  return model.api_family ?? DEFAULT_API_FAMILY;
}

function resolveModelVendorId(
  model: Pick<ModelConfigListItem, "vendor_id"> | Pick<ModelConfig, "vendor_id">,
  existing?: Pick<ModelConfigListItem, "vendor_id" | "vendor">,
): number {
  return model.vendor_id ?? existing?.vendor_id ?? existing?.vendor?.id ?? 0;
}

function resolveModelVendor(
  model: Pick<ModelConfigListItem, "vendor"> | Pick<ModelConfig, "vendor">,
  vendorId: number,
  apiFamily: ApiFamily,
  existing?: Pick<ModelConfigListItem, "vendor">,
) {
  if (model.vendor) {
    return model.vendor;
  }

  if (existing?.vendor) {
    return existing.vendor;
  }

  return {
    id: vendorId,
    key: apiFamily === "gemini" ? "google" : apiFamily,
    name: apiFamily,
    description: null,
    audit_enabled: false,
    audit_capture_bodies: false,
    created_at: "",
    updated_at: "",
  };
}

export const DEFAULT_MODEL_FORM_DATA: ModelConfigCreate = {
  vendor_id: 0,
  api_family: DEFAULT_API_FAMILY,
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
  const vendorId = resolveModelVendorId(model);

  return {
    vendor_id: vendorId,
    api_family: resolveModelApiFamily(model),
    model_id: model.model_id,
    display_name: model.display_name || "",
    model_type: model.model_type,
    proxy_targets: normalizeProxyTargets(model.proxy_targets),
    loadbalance_strategy_id: model.loadbalance_strategy_id,
    is_enabled: model.is_enabled,
  };
}

export function createNewModelFormData(vendors: Vendor[]): ModelConfigCreate {
  const firstVendor = vendors[0];
  const vendorId = firstVendor?.id ?? 0;

  return {
    ...DEFAULT_MODEL_FORM_DATA,
    vendor_id: vendorId,
    api_family: vendorKeyToApiFamily(firstVendor?.key),
  };
}

export function toModelCreatePayload(formData: ModelConfigCreate): ModelConfigCreate {
  return {
    vendor_id: formData.vendor_id,
    api_family: formData.api_family,
    model_id: formData.model_id,
    display_name: formData.display_name,
    model_type: formData.model_type,
    is_enabled: formData.is_enabled,
    ...getNormalizedRoutingState(formData),
  };
}

export function toModelUpdatePayload(formData: ModelConfigCreate): ModelConfigUpdate {
  return {
    vendor_id: formData.vendor_id,
    api_family: formData.api_family,
    display_name: formData.display_name || null,
    model_id: formData.model_id,
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

export function getNativeModelsForApiFamily(
  models: ModelConfigListItem[],
  apiFamily: ApiFamily,
  excludedModelId?: string,
): ModelConfigListItem[] {
  return models.filter(
    (model) =>
      model.model_type === "native" &&
      resolveModelApiFamily(model) === apiFamily &&
      (!excludedModelId || model.model_id !== excludedModelId),
  );
}

export function toModelListItem(
  model: ModelConfig,
  existing?: ModelConfigListItem,
): ModelConfigListItem {
  const vendorId = resolveModelVendorId(model, existing);
  const apiFamily = resolveModelApiFamily(model);
  const vendor = resolveModelVendor(model, vendorId, apiFamily, existing);

  return {
    id: model.id,
    vendor_id: vendorId,
    vendor,
    api_family: apiFamily,
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
