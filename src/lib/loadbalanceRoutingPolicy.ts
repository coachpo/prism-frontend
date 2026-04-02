import type {
  LoadbalanceAutoRecovery,
  LoadbalanceAutoRecoveryEnabled,
  LoadbalanceStrategyType,
} from "./types";

export const LOADBALANCE_STRATEGY_TYPES = ["single", "fill-first", "round-robin"] as const;
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

export function createDefaultEnabledAutoRecovery(): LoadbalanceAutoRecoveryEnabled {
  return {
    mode: "enabled",
    status_codes: [...DEFAULT_FAILURE_STATUS_CODES],
    cooldown: {
      base_seconds: 60,
      failure_threshold: 2,
      backoff_multiplier: 2,
      max_cooldown_seconds: 900,
      jitter_ratio: 0.2,
    },
    ban: {
      mode: "off",
    },
  };
}

export function getDefaultAutoRecovery(
  _strategyType: LoadbalanceStrategyType,
): LoadbalanceAutoRecovery {
  return createDefaultEnabledAutoRecovery();
}

export function isAutoRecoveryEnabled(
  autoRecovery: LoadbalanceAutoRecovery,
): autoRecovery is LoadbalanceAutoRecoveryEnabled {
  return autoRecovery.mode === "enabled";
}
