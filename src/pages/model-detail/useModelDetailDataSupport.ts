import type {
  Connection,
  ConnectionCreate,
  Endpoint,
  EndpointCreate,
  HealthCheckResponse,
  ModelConfig,
  ModelConfigListItem,
} from "@/lib/types";
import { normalizeProxyTargets } from "../models/modelFormState";

export const createDefaultEndpointForm = (): EndpointCreate => ({
  name: "",
  base_url: "",
  api_key: "",
});

export const createDefaultConnectionForm = (): ConnectionCreate => ({
  name: "",
  is_active: true,
  custom_headers: null,
  pricing_template_id: null,
  qps_limit: null,
  max_in_flight_non_stream: null,
  max_in_flight_stream: null,
});

export function resequenceConnections(connections: Connection[]): Connection[] {
  return connections.map((connection, index) => {
    if (connection.priority === index) {
      return connection;
    }

    return {
      ...connection,
      priority: index,
    };
  });
}

export function moveConnectionInList(
  connections: Connection[],
  fromIndex: number,
  toIndex: number
): Connection[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= connections.length ||
    toIndex >= connections.length ||
    fromIndex === toIndex
  ) {
    return connections;
  }

  const nextConnections = [...connections];
  const [movedConnection] = nextConnections.splice(fromIndex, 1);

  if (!movedConnection) {
    return connections;
  }

  nextConnections.splice(toIndex, 0, movedConnection);
  return resequenceConnections(nextConnections);
}

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

export function upsertConnectionInList(
  connections: Connection[],
  nextConnection: Connection,
): Connection[] {
  const hasExistingConnection = connections.some((connection) => connection.id === nextConnection.id);
  const nextConnections = hasExistingConnection
    ? connections.map((connection) => (
      connection.id === nextConnection.id ? nextConnection : connection
    ))
    : [...connections, nextConnection];

  return resequenceConnections(
    [...nextConnections].sort((left, right) => left.priority - right.priority),
  );
}

export function removeConnectionFromList(
  connections: Connection[],
  connectionId: number,
): Connection[] {
  return resequenceConnections(
    connections.filter((connection) => connection.id !== connectionId),
  );
}

export function upsertEndpointInList(
  endpoints: Endpoint[],
  endpoint: Endpoint | undefined,
): Endpoint[] {
  if (!endpoint) {
    return endpoints;
  }

  const hasExistingEndpoint = endpoints.some((current) => current.id === endpoint.id);
  const nextEndpoints = hasExistingEndpoint
    ? endpoints.map((current) => (current.id === endpoint.id ? endpoint : current))
    : [...endpoints, endpoint];

  return [...nextEndpoints].sort((left, right) => left.position - right.position);
}

export function patchModelListConnectionCounts(
  models: ModelConfigListItem[],
  modelConfigId: number,
  connections: Connection[],
): ModelConfigListItem[] {
  return models.map((item) => {
    if (item.id !== modelConfigId) {
      return item;
    }

    return {
      ...item,
      connection_count: connections.length,
      active_connection_count: connections.filter((connection) => connection.is_active).length,
    };
  });
}

export function patchModelListItemFromDetail(
  models: ModelConfigListItem[],
  model: ModelConfig,
): ModelConfigListItem[] {
  return models.map((item) => {
    if (item.id !== model.id) {
      return item;
    }

    return {
      ...item,
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
      updated_at: model.updated_at,
    };
  });
}

function formatTargetLabel(candidate: ModelConfigListItem) {
  return candidate.display_name
    ? `${candidate.display_name} (${candidate.model_id})`
    : candidate.model_id;
}

export function buildProxyTargetOptions(
  model: ModelConfig | null,
  allModels: ModelConfigListItem[]
): { modelId: string; label: string }[] {
  if (!model || model.model_type !== "proxy") return [];

  const nativeTargets = allModels
    .filter((candidate) => (
      candidate.provider_id === model.provider_id &&
      candidate.model_type === "native" &&
      candidate.id !== model.id
    ))
    .map((candidate) => ({
      modelId: candidate.model_id,
      label: formatTargetLabel(candidate),
    }));

  const currentTargets = normalizeProxyTargets(model.proxy_targets)
    .filter((target) => !nativeTargets.some((candidate) => candidate.modelId === target.target_model_id))
    .map((target) => ({
      modelId: target.target_model_id,
      label: `${target.target_model_id} (current target)`,
    }));

  return [...currentTargets, ...nativeTargets];
}

export function resolveProxyTargetLabel(
  targetModelId: string,
  targetOptions: { modelId: string; label: string }[],
) {
  return targetOptions.find((target) => target.modelId === targetModelId)?.label ?? targetModelId;
}

export function buildProxyTargetSummary(
  model: ModelConfig | null,
  allModels: ModelConfigListItem[],
) {
  const proxyTargets = normalizeProxyTargets(model?.proxy_targets);
  const targetOptions = buildProxyTargetOptions(model, allModels);
  const firstTargetId = proxyTargets[0]?.target_model_id ?? null;

  return {
    targetCount: proxyTargets.length,
    firstTargetId,
    firstTargetLabel: firstTargetId ? resolveProxyTargetLabel(firstTargetId, targetOptions) : null,
    routePolicyLabel: "Ordered priority routing",
  };
}
