import { EVENT_TYPE_OPTIONS, FAILURE_KIND_OPTIONS } from "./constants";
import type {
  LoadbalanceEventFilters,
  LoadbalanceEventTypeFilter,
  LoadbalanceFailureKindFilter,
  LoadbalanceListParams,
  LoadbalanceEventRow,
} from "./types";

function isAllowedValue<TValue extends string>(
  value: string | null,
  allowedValues: readonly TValue[],
  fallback: TValue
): TValue {
  if (!value) {
    return fallback;
  }

  return allowedValues.includes(value as TValue) ? (value as TValue) : fallback;
}

export function parseEventTypeFilter(value: string | null): LoadbalanceEventTypeFilter {
  return isAllowedValue(
    value,
    EVENT_TYPE_OPTIONS.map((option) => option.value),
    "all"
  );
}

export function parseFailureKindFilter(value: string | null): LoadbalanceFailureKindFilter {
  return isAllowedValue(
    value,
    FAILURE_KIND_OPTIONS.map((option) => option.value),
    "all"
  );
}

export function buildLoadbalanceSearchParams(filters: Pick<LoadbalanceEventFilters, "eventType" | "failureKind" | "connectionId" | "modelId">) {
  const params = new URLSearchParams();
  if (filters.eventType !== "all") params.set("event_type", filters.eventType);
  if (filters.failureKind !== "all") params.set("failure_kind", filters.failureKind);
  if (filters.connectionId) params.set("connection_id", filters.connectionId);
  if (filters.modelId) params.set("model_id", filters.modelId);
  return params;
}

export function buildLoadbalanceListParams(
  filters: LoadbalanceEventFilters
): LoadbalanceListParams {
  const params: LoadbalanceListParams = {
    limit: filters.limit,
    offset: filters.offset,
  };

  if (filters.eventType !== "all") {
    params.event_type = filters.eventType;
  }
  if (filters.failureKind !== "all") {
    params.failure_kind = filters.failureKind;
  }
  if (filters.connectionId) {
    const parsedConnectionId = Number.parseInt(filters.connectionId, 10);
    if (!Number.isNaN(parsedConnectionId)) {
      params.connection_id = parsedConnectionId;
    }
  }
  if (filters.modelId) {
    params.model_id = filters.modelId;
  }

  return params;
}

export function matchesLoadbalanceFilters(
  event: LoadbalanceEventRow,
  filters: Pick<LoadbalanceEventFilters, "eventType" | "failureKind" | "connectionId" | "modelId">
) {
  if (filters.eventType !== "all" && event.event_type !== filters.eventType) return false;
  if (filters.failureKind !== "all" && event.failure_kind !== filters.failureKind) return false;
  if (filters.connectionId && event.connection_id !== Number(filters.connectionId)) return false;
  if (filters.modelId && event.model_id !== filters.modelId) return false;
  return true;
}

export function getLoadbalanceRangeLabel(total: number, offset: number, limit: number) {
  if (total === 0) {
    return "Showing 0 of 0 events";
  }

  return `Showing ${offset + 1} to ${Math.min(offset + limit, total)} of ${total} events`;
}
