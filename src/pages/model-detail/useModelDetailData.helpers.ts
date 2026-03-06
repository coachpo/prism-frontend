import type {
  Connection,
  ConnectionCreate,
  Endpoint,
  EndpointCreate,
  HealthCheckResponse,
  ModelConfig,
  ModelConfigListItem,
} from "@/lib/types";

export const createDefaultEndpointForm = (): EndpointCreate => ({
  name: "",
  base_url: "",
  api_key: "",
});

export const createDefaultConnectionForm = (): ConnectionCreate => ({
  priority: 0,
  name: "",
  is_active: true,
  custom_headers: null,
  pricing_template_id: null,
});

export function applyConnectionHealthChecks(
  connections: Connection[],
  checks: Map<number, HealthCheckResponse>
): Connection[] {
  return connections.map((connection) => {
    const check = checks.get(connection.id);
    if (!check) return connection;

    return {
      ...connection,
      health_status: check.health_status,
      health_detail: check.detail,
      last_health_check: check.checked_at,
    };
  });
}

export function getSelectedEndpoint(
  globalEndpoints: Endpoint[],
  selectedEndpointId: string
): Endpoint | null {
  const parsedEndpointId = Number.parseInt(selectedEndpointId, 10);
  if (!Number.isFinite(parsedEndpointId)) {
    return null;
  }
  return globalEndpoints.find((endpoint) => endpoint.id === parsedEndpointId) ?? null;
}

export function buildRedirectTargetOptions(
  model: ModelConfig | null,
  allModels: ModelConfigListItem[]
): { modelId: string; label: string }[] {
  if (!model || model.model_type !== "proxy") return [];

  const nativeTargets = allModels
    .filter((candidate) => (
      candidate.provider_id === model.provider_id &&
      candidate.model_type === "native"
    ))
    .map((candidate) => ({
      modelId: candidate.model_id,
      label: candidate.display_name
        ? `${candidate.display_name} (${candidate.model_id})`
        : candidate.model_id,
    }));

  if (
    model.redirect_to &&
    !nativeTargets.some((target) => target.modelId === model.redirect_to)
  ) {
    return [
      { modelId: model.redirect_to, label: `${model.redirect_to} (current target)` },
      ...nativeTargets,
    ];
  }

  return nativeTargets;
}
