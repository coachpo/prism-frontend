import type {
  LoadbalanceEvent,
  LoadbalanceEventType,
  LoadbalanceFailureKind,
} from "@/lib/types";

export type LoadbalanceEventTypeFilter = LoadbalanceEventType | "all";
export type LoadbalanceFailureKindFilter = LoadbalanceFailureKind | "all";

export interface LoadbalanceEventFilters {
  eventType: LoadbalanceEventTypeFilter;
  failureKind: LoadbalanceFailureKindFilter;
  connectionId: string;
  modelId: string;
  limit: number;
  offset: number;
}

export interface LoadbalanceListParams {
  connection_id?: number;
  event_type?: string;
  failure_kind?: string;
  model_id?: string;
  limit?: number;
  offset?: number;
}

export interface LoadbalanceOption<TValue extends string> {
  value: TValue;
  label: string;
}

export type LoadbalanceEventRow = LoadbalanceEvent;
