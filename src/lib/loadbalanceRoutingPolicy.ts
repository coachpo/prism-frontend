import type { RoutingObjective, RoutingPolicy } from "./types";

export const DEFAULT_FAILURE_STATUS_CODES = [403, 422, 429, 500, 502, 503, 504, 529];

export function normalizeFailureStatusCodes(statusCodes: readonly number[]): number[] {
  return Array.from(
    new Set(
      statusCodes
        .filter((statusCode) => Number.isFinite(statusCode))
        .map((statusCode) => Math.trunc(statusCode)),
    ),
  ).sort((left, right) => left - right);
}

export function createDefaultRoutingPolicy(
  routingObjective: RoutingObjective = "minimize_latency",
): RoutingPolicy {
  return {
    kind: "adaptive",
    routing_objective: routingObjective,
    deadline_budget_ms: 30_000,
    hedge: {
      enabled: false,
      delay_ms: 1500,
      max_additional_attempts: 1,
    },
    circuit_breaker: {
      failure_status_codes: [...DEFAULT_FAILURE_STATUS_CODES],
      base_open_seconds: 60,
      failure_threshold: 2,
      backoff_multiplier: 2,
      max_open_seconds: 900,
      jitter_ratio: 0.2,
      ban_mode: "off",
      max_open_strikes_before_ban: 0,
      ban_duration_seconds: 0,
    },
    admission: {
      respect_qps_limit: true,
      respect_in_flight_limits: true,
    },
    monitoring: {
      enabled: true,
      stale_after_seconds: 300,
      endpoint_ping_weight: 1,
      conversation_delay_weight: 1,
      failure_penalty_weight: 2,
    },
  };
}
