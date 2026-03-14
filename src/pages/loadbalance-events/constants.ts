import type {
  LoadbalanceEventTypeFilter,
  LoadbalanceFailureKindFilter,
  LoadbalanceOption,
} from "./types";

export const LOADBALANCE_PAGE_LIMIT = 50;
export const LOADBALANCE_RECONCILE_INTERVAL_MS = 300000;
export const LOADBALANCE_VISIBILITY_RELOAD_THRESHOLD_MS = 30000;

export const EVENT_TYPE_OPTIONS: ReadonlyArray<LoadbalanceOption<LoadbalanceEventTypeFilter>> = [
  { value: "all", label: "All Events" },
  { value: "opened", label: "Opened" },
  { value: "extended", label: "Extended" },
  { value: "probe_eligible", label: "Probe Eligible" },
  { value: "recovered", label: "Recovered" },
  { value: "not_opened", label: "Not Opened" },
];

export const FAILURE_KIND_OPTIONS: ReadonlyArray<
  LoadbalanceOption<LoadbalanceFailureKindFilter>
> = [
  { value: "all", label: "All Kinds" },
  { value: "transient_http", label: "Transient HTTP" },
  { value: "auth_like", label: "Auth Error" },
  { value: "connect_error", label: "Connection Error" },
  { value: "timeout", label: "Timeout" },
];
