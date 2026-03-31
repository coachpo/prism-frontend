import type { LoadbalanceBanMode, LoadbalanceStrategy, RoutingPolicy } from "@/lib/types";
import { createDefaultRoutingPolicy, normalizeFailureStatusCodes } from "@/lib/loadbalanceRoutingPolicy";
import { getStaticMessages } from "@/i18n/staticMessages";

type RoutingPolicyDraft = Omit<RoutingPolicy, "circuit_breaker"> & {
  circuit_breaker: RoutingPolicy["circuit_breaker"] & {
    status_code_input: string;
  };
};

export type LoadbalanceStrategyFormState = {
  name: string;
  routing_policy: RoutingPolicyDraft;
};

export type LoadbalanceStrategyFormPayload = {
  name: string;
  routing_policy: RoutingPolicy;
};

function createDefaultRoutingPolicyDraft(): RoutingPolicyDraft {
  return {
    ...createDefaultRoutingPolicy(),
    circuit_breaker: {
      ...createDefaultRoutingPolicy().circuit_breaker,
      status_code_input: "",
    },
  };
}

export const DEFAULT_LOADBALANCE_STRATEGY_FORM: LoadbalanceStrategyFormState = {
  name: "",
  routing_policy: createDefaultRoutingPolicyDraft(),
};

function normalizeInteger(value: number) {
  return Math.trunc(value);
}

function normalizeRoutingPolicyDraft(routingPolicy: RoutingPolicy): RoutingPolicyDraft {
  return {
    ...routingPolicy,
    circuit_breaker: {
      ...routingPolicy.circuit_breaker,
      failure_status_codes: normalizeFailureStatusCodes(
        routingPolicy.circuit_breaker.failure_status_codes,
      ),
      status_code_input: "",
    },
  };
}

export function loadbalanceStrategyFormStateFromStrategy(
  strategy: LoadbalanceStrategy,
): LoadbalanceStrategyFormState {
  return {
    name: strategy.name,
    routing_policy: normalizeRoutingPolicyDraft(strategy.routing_policy),
  };
}

export function toLoadbalanceStrategyPayload(
  formState: LoadbalanceStrategyFormState,
): LoadbalanceStrategyFormPayload {
  const circuitBreaker = formState.routing_policy.circuit_breaker;
  const banMode = circuitBreaker.ban_mode;

  return {
    name: formState.name.trim(),
    routing_policy: {
      ...formState.routing_policy,
      circuit_breaker: {
        failure_status_codes: normalizeFailureStatusCodes(circuitBreaker.failure_status_codes),
        base_open_seconds: normalizeInteger(circuitBreaker.base_open_seconds),
        failure_threshold: normalizeInteger(circuitBreaker.failure_threshold),
        backoff_multiplier: circuitBreaker.backoff_multiplier,
        max_open_seconds: normalizeInteger(circuitBreaker.max_open_seconds),
        jitter_ratio: circuitBreaker.jitter_ratio,
        ban_mode: banMode,
        max_open_strikes_before_ban:
          banMode === "off"
            ? 0
            : Math.max(normalizeInteger(circuitBreaker.max_open_strikes_before_ban), 1),
        ban_duration_seconds:
          banMode === "temporary"
            ? Math.max(normalizeInteger(circuitBreaker.ban_duration_seconds), 1)
            : 0,
      },
    },
  };
}

export function setLoadbalanceStrategyBanMode(
  formState: LoadbalanceStrategyFormState,
  mode: LoadbalanceBanMode,
): LoadbalanceStrategyFormState {
  const currentCircuitBreaker = formState.routing_policy.circuit_breaker;

  return {
    ...formState,
    routing_policy: {
      ...formState.routing_policy,
      circuit_breaker: {
        ...currentCircuitBreaker,
        ban_mode: mode,
        max_open_strikes_before_ban:
          mode === "off"
            ? 0
            : Math.max(currentCircuitBreaker.max_open_strikes_before_ban, 1),
        ban_duration_seconds:
          mode === "temporary"
            ? Math.max(currentCircuitBreaker.ban_duration_seconds, 1)
            : 0,
      },
    },
  };
}

export function getCircuitBreakerStatusCodeInputError(
  formState: Pick<RoutingPolicyDraft["circuit_breaker"], "failure_status_codes" | "status_code_input">,
): string | null {
  const messages = getStaticMessages().loadbalanceStrategyValidation;
  const rawValue = (formState.status_code_input ?? "").trim();

  if (!rawValue) {
    return null;
  }

  if (!/^\d+$/.test(rawValue)) {
    return messages.statusCodeIntegerRange;
  }

  const statusCode = Number(rawValue);
  if (statusCode < 100 || statusCode > 599) {
    return messages.statusCodeIntegerRange;
  }

  if (formState.failure_status_codes.includes(statusCode)) {
    return messages.statusCodeExists;
  }

  return null;
}

export function addCircuitBreakerStatusCode(
  formState: LoadbalanceStrategyFormState,
): LoadbalanceStrategyFormState {
  if (getCircuitBreakerStatusCodeInputError(formState.routing_policy.circuit_breaker)) {
    return formState;
  }

  const nextStatusCode = Number(formState.routing_policy.circuit_breaker.status_code_input.trim());

  return {
    ...formState,
    routing_policy: {
      ...formState.routing_policy,
      circuit_breaker: {
        ...formState.routing_policy.circuit_breaker,
        failure_status_codes: normalizeFailureStatusCodes([
          ...formState.routing_policy.circuit_breaker.failure_status_codes,
          nextStatusCode,
        ]),
        status_code_input: "",
      },
    },
  };
}

export function removeCircuitBreakerStatusCode(
  formState: LoadbalanceStrategyFormState,
  statusCodeToRemove: number,
): LoadbalanceStrategyFormState {
  return {
    ...formState,
    routing_policy: {
      ...formState.routing_policy,
      circuit_breaker: {
        ...formState.routing_policy.circuit_breaker,
        failure_status_codes: formState.routing_policy.circuit_breaker.failure_status_codes.filter(
          (statusCode) => statusCode !== statusCodeToRemove,
        ),
      },
    },
  };
}

export function getLoadbalanceStrategyFormValidationError(
  formState: LoadbalanceStrategyFormState,
): string | null {
  const messages = getStaticMessages().loadbalanceStrategyValidation;
  const circuitBreaker = formState.routing_policy.circuit_breaker;

  if (!formState.name.trim()) {
    return messages.nameRequired;
  }

  if (circuitBreaker.failure_status_codes.length === 0) {
    return messages.addStatusCode;
  }

  if (
    new Set(circuitBreaker.failure_status_codes).size !==
    circuitBreaker.failure_status_codes.length
  ) {
    return messages.statusCodesUnique;
  }

  if (
    circuitBreaker.failure_status_codes.some(
      (statusCode) => !Number.isInteger(statusCode) || statusCode < 100 || statusCode > 599,
    )
  ) {
    return messages.statusCodesValidHttp;
  }

  if (!Number.isInteger(circuitBreaker.base_open_seconds)) {
    return messages.baseCooldownIntegerSeconds;
  }
  if (circuitBreaker.base_open_seconds < 0) {
    return messages.baseCooldownMin;
  }

  if (!Number.isInteger(circuitBreaker.failure_threshold)) {
    return messages.failureThresholdInteger;
  }
  if (circuitBreaker.failure_threshold < 1 || circuitBreaker.failure_threshold > 50) {
    return messages.failureThresholdRange;
  }

  if (
    !Number.isFinite(circuitBreaker.backoff_multiplier) ||
    circuitBreaker.backoff_multiplier < 1 ||
    circuitBreaker.backoff_multiplier > 10
  ) {
    return messages.backoffMultiplierRange;
  }

  if (!Number.isInteger(circuitBreaker.max_open_seconds)) {
    return messages.maxCooldownIntegerSeconds;
  }
  if (circuitBreaker.max_open_seconds < 1 || circuitBreaker.max_open_seconds > 86_400) {
    return messages.maxCooldownRange;
  }

  if (
    !Number.isFinite(circuitBreaker.jitter_ratio) ||
    circuitBreaker.jitter_ratio < 0 ||
    circuitBreaker.jitter_ratio > 1
  ) {
    return messages.jitterRatioRange;
  }

  if (circuitBreaker.ban_mode === "off") {
    if (circuitBreaker.max_open_strikes_before_ban !== 0 || circuitBreaker.ban_duration_seconds !== 0) {
      return messages.banModeOffZero;
    }
    return null;
  }

  if (!Number.isInteger(circuitBreaker.max_open_strikes_before_ban)) {
    return messages.maxCooldownStrikesInteger;
  }

  if (circuitBreaker.max_open_strikes_before_ban < 1) {
    return messages.maxCooldownStrikesMin;
  }

  if (circuitBreaker.ban_mode === "temporary") {
    if (!Number.isInteger(circuitBreaker.ban_duration_seconds)) {
      return messages.banDurationIntegerSeconds;
    }
    if (circuitBreaker.ban_duration_seconds < 1) {
      return messages.banDurationTemporaryMin;
    }

    return null;
  }

  if (!Number.isInteger(circuitBreaker.ban_duration_seconds)) {
    return messages.banDurationIntegerSeconds;
  }
  if (circuitBreaker.ban_duration_seconds !== 0) {
    return messages.banDurationManualDismissZero;
  }

  return null;
}

export function getAttachedModelCountFromErrorDetail(detail: unknown): number | null {
  if (!detail || typeof detail !== "object") {
    return null;
  }

  const payload = detail as { detail?: unknown; attached_model_count?: unknown };
  if (typeof payload.attached_model_count === "number") {
    return payload.attached_model_count;
  }

  if (!payload.detail || typeof payload.detail !== "object") {
    return null;
  }

  const nestedDetail = payload.detail as { attached_model_count?: unknown };
  return typeof nestedDetail.attached_model_count === "number"
    ? nestedDetail.attached_model_count
    : null;
}

export function getDefaultRoutingPolicyDraft(): RoutingPolicyDraft {
  return createDefaultRoutingPolicyDraft();
}
