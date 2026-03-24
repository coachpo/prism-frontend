import { api } from "@/lib/api";
import type {
  ConnectionDropdownItem,
  Endpoint,
  LoadbalanceStrategy,
  ModelConfigListItem,
  PricingTemplate,
  Provider,
} from "@/lib/types";

type ReferenceDataKind =
  | "connections"
  | "endpoints"
  | "loadbalanceStrategies"
  | "models"
  | "pricingTemplates"
  | "providers";

const dataCache = new Map<string, unknown>();
const requestCache = new Map<string, Promise<unknown>>();

function buildKey(kind: ReferenceDataKind, revision: number) {
  return `${kind}:${revision}`;
}

function pruneKind(kind: ReferenceDataKind, revision: number) {
  const prefix = `${kind}:`;
  const activeKey = buildKey(kind, revision);

  for (const key of dataCache.keys()) {
    if (key.startsWith(prefix) && key !== activeKey) {
      dataCache.delete(key);
    }
  }

  for (const key of requestCache.keys()) {
    if (key.startsWith(prefix) && key !== activeKey) {
      requestCache.delete(key);
    }
  }
}

async function loadReferenceData<T>(
  kind: ReferenceDataKind,
  revision: number,
  loader: () => Promise<T>,
  forceRefresh = false,
): Promise<T> {
  const key = buildKey(kind, revision);

  if (forceRefresh) {
    dataCache.delete(key);
    requestCache.delete(key);
  }

  if (dataCache.has(key)) {
    return dataCache.get(key) as T;
  }

  const inFlight = requestCache.get(key);
  if (inFlight) {
    return inFlight as Promise<T>;
  }

  const request = loader()
    .then((data) => {
      pruneKind(kind, revision);
      dataCache.set(key, data);
      return data;
    })
    .finally(() => {
      if (requestCache.get(key) === request) {
        requestCache.delete(key);
      }
    });

  requestCache.set(key, request);
  return request;
}

function setReferenceData<T>(kind: ReferenceDataKind, revision: number, data: T) {
  pruneKind(kind, revision);
  dataCache.set(buildKey(kind, revision), data);
}

export function clearSharedReferenceData(kind?: ReferenceDataKind, revision?: number) {
  if (kind === undefined && revision === undefined) {
    dataCache.clear();
    requestCache.clear();
    return;
  }

  for (const key of dataCache.keys()) {
    const [entryKind, entryRevision] = key.split(":");
    const kindMatches = kind === undefined || entryKind === kind;
    const revisionMatches = revision === undefined || entryRevision === String(revision);

    if (kindMatches && revisionMatches) {
      dataCache.delete(key);
    }
  }

  for (const key of requestCache.keys()) {
    const [entryKind, entryRevision] = key.split(":");
    const kindMatches = kind === undefined || entryKind === kind;
    const revisionMatches = revision === undefined || entryRevision === String(revision);

    if (kindMatches && revisionMatches) {
      requestCache.delete(key);
    }
  }
}

export function getSharedModels(revision: number, forceRefresh = false) {
  return loadReferenceData("models", revision, () => api.models.list(), forceRefresh);
}

export function setSharedModels(revision: number, data: ModelConfigListItem[]) {
  setReferenceData("models", revision, data);
}

export function getSharedProviders(revision: number, forceRefresh = false) {
  return loadReferenceData("providers", revision, () => api.providers.list(), forceRefresh);
}

export function setSharedProviders(revision: number, data: Provider[]) {
  setReferenceData("providers", revision, data);
}

export function getSharedEndpoints(revision: number, forceRefresh = false) {
  return loadReferenceData("endpoints", revision, () => api.endpoints.list(), forceRefresh);
}

export function setSharedEndpoints(revision: number, data: Endpoint[]) {
  setReferenceData("endpoints", revision, data);
}

export function getSharedConnectionOptions(revision: number, forceRefresh = false) {
  return loadReferenceData(
    "connections",
    revision,
    async () => {
      const response = await api.endpoints.connections();
      return response.items;
    },
    forceRefresh,
  );
}

export function setSharedConnectionOptions(
  revision: number,
  data: ConnectionDropdownItem[],
) {
  setReferenceData("connections", revision, data);
}

export function getSharedPricingTemplates(revision: number, forceRefresh = false) {
  return loadReferenceData(
    "pricingTemplates",
    revision,
    () => api.pricingTemplates.list(),
    forceRefresh,
  );
}

export function setSharedPricingTemplates(revision: number, data: PricingTemplate[]) {
  setReferenceData("pricingTemplates", revision, data);
}

export function getSharedLoadbalanceStrategies(revision: number, forceRefresh = false) {
  return loadReferenceData(
    "loadbalanceStrategies",
    revision,
    () => api.loadbalanceStrategies.list(),
    forceRefresh,
  );
}

export function setSharedLoadbalanceStrategies(revision: number, data: LoadbalanceStrategy[]) {
  setReferenceData("loadbalanceStrategies", revision, data);
}
