import type { LoadbalanceBanMode, LoadbalanceStrategy } from "@/lib/types";
import { getStaticMessages } from "@/i18n/staticMessages";

export const DEFAULT_FAILOVER_STATUS_CODES = [403, 422, 429, 500, 502, 503, 504, 529];

export type LoadbalanceStrategyFormState = {
  name: string;
  strategy_type: "single" | "fill-first" | "round-robin" | "failover";
  failover_recovery_enabled: boolean;
  failover_cooldown_seconds: number;
  failover_failure_threshold: number;
  failover_backoff_multiplier: number;
  failover_max_cooldown_seconds: number;
  failover_jitter_ratio: number;
  failover_status_codes: number[];
  failover_status_code_input: string;
  failover_ban_mode: LoadbalanceBanMode;
  failover_max_cooldown_strikes_before_ban: number;
  failover_ban_duration_seconds: number;
};

export const DEFAULT_LOADBALANCE_STRATEGY_FORM: LoadbalanceStrategyFormState = {
  name: "",
  strategy_type: "single",
  failover_recovery_enabled: false,
  failover_cooldown_seconds: 60,
  failover_failure_threshold: 2,
  failover_backoff_multiplier: 2,
  failover_max_cooldown_seconds: 900,
  failover_jitter_ratio: 0.2,
  failover_status_codes: [...DEFAULT_FAILOVER_STATUS_CODES],
  failover_status_code_input: "",
  failover_ban_mode: "off",
  failover_max_cooldown_strikes_before_ban: 0,
  failover_ban_duration_seconds: 0,
};

export function loadbalanceStrategyFormStateFromStrategy(
  strategy: LoadbalanceStrategy,
): LoadbalanceStrategyFormState {
  return {
    name: strategy.name,
    strategy_type: strategy.strategy_type,
    failover_recovery_enabled: strategy.failover_recovery_enabled,
    failover_cooldown_seconds: strategy.failover_cooldown_seconds,
    failover_failure_threshold: strategy.failover_failure_threshold,
    failover_backoff_multiplier: strategy.failover_backoff_multiplier,
    failover_max_cooldown_seconds: strategy.failover_max_cooldown_seconds,
    failover_jitter_ratio: strategy.failover_jitter_ratio,
    failover_status_codes: normalizeFailoverStatusCodes(strategy.failover_status_codes),
    failover_status_code_input: "",
    failover_ban_mode: strategy.failover_ban_mode,
    failover_max_cooldown_strikes_before_ban:
      strategy.failover_max_cooldown_strikes_before_ban,
    failover_ban_duration_seconds: strategy.failover_ban_duration_seconds,
  };
}

export type LoadbalanceStrategyFormPayload = Omit<
  LoadbalanceStrategyFormState,
  "failover_status_code_input"
>;

export function toLoadbalanceStrategyPayload(
  formState: LoadbalanceStrategyFormState,
): LoadbalanceStrategyFormPayload {
  const normalizeInteger = (value: number) => Math.trunc(value);

  return {
    name: formState.name.trim(),
    strategy_type: formState.strategy_type,
    failover_recovery_enabled:
      formState.strategy_type === "single" ? false : formState.failover_recovery_enabled,
    failover_cooldown_seconds: normalizeInteger(formState.failover_cooldown_seconds),
    failover_failure_threshold: normalizeInteger(formState.failover_failure_threshold),
    failover_backoff_multiplier: formState.failover_backoff_multiplier,
    failover_max_cooldown_seconds: normalizeInteger(formState.failover_max_cooldown_seconds),
    failover_jitter_ratio: formState.failover_jitter_ratio,
    failover_status_codes: normalizeFailoverStatusCodes(formState.failover_status_codes),
    failover_ban_mode: formState.failover_ban_mode,
    failover_max_cooldown_strikes_before_ban: normalizeInteger(
      formState.failover_max_cooldown_strikes_before_ban,
    ),
    failover_ban_duration_seconds: normalizeInteger(formState.failover_ban_duration_seconds),
  };
}

export function getLoadbalanceStrategyFormValidationError(
  formState: LoadbalanceStrategyFormState,
): string | null {
  const messages = getStaticMessages().loadbalanceStrategyValidation;

  if (!formState.name.trim()) {
    return messages.nameRequired;
  }

  if (formState.failover_status_codes.length === 0) {
    return messages.addStatusCode;
  }

  if (new Set(formState.failover_status_codes).size !== formState.failover_status_codes.length) {
    return messages.statusCodesUnique;
  }

  if (
    formState.failover_status_codes.some(
      (statusCode) => !Number.isInteger(statusCode) || statusCode < 100 || statusCode > 599,
    )
  ) {
    return messages.statusCodesValidHttp;
  }

  if (!Number.isInteger(formState.failover_cooldown_seconds)) {
    return messages.baseCooldownIntegerSeconds;
  }
  if (formState.failover_cooldown_seconds < 0) {
    return messages.baseCooldownMin;
  }

  if (!Number.isInteger(formState.failover_failure_threshold)) {
    return messages.failureThresholdInteger;
  }
  if (
    formState.failover_failure_threshold < 1 ||
    formState.failover_failure_threshold > 10
  ) {
    return messages.failureThresholdRange;
  }

  if (
    !Number.isFinite(formState.failover_backoff_multiplier) ||
    formState.failover_backoff_multiplier < 1 ||
    formState.failover_backoff_multiplier > 10
  ) {
    return messages.backoffMultiplierRange;
  }

  if (!Number.isInteger(formState.failover_max_cooldown_seconds)) {
    return messages.maxCooldownIntegerSeconds;
  }
  if (
    formState.failover_max_cooldown_seconds < 1 ||
    formState.failover_max_cooldown_seconds > 86_400
  ) {
    return messages.maxCooldownRange;
  }

  if (
    !Number.isFinite(formState.failover_jitter_ratio) ||
    formState.failover_jitter_ratio < 0 ||
    formState.failover_jitter_ratio > 1
  ) {
    return messages.jitterRatioRange;
  }

  if (!Number.isInteger(formState.failover_max_cooldown_strikes_before_ban)) {
    return messages.maxCooldownStrikesInteger;
  }

  if (!Number.isInteger(formState.failover_ban_duration_seconds)) {
    return messages.banDurationIntegerSeconds;
  }

  if (formState.failover_ban_mode === "off") {
    if (
      formState.failover_max_cooldown_strikes_before_ban !== 0 ||
      formState.failover_ban_duration_seconds !== 0
    ) {
      return messages.banModeOffZero;
    }

    return null;
  }

  if (formState.failover_max_cooldown_strikes_before_ban < 1) {
    return messages.maxCooldownStrikesMin;
  }

  if (formState.failover_ban_mode === "temporary") {
    if (formState.failover_ban_duration_seconds < 1) {
      return messages.banDurationTemporaryMin;
    }

    return null;
  }

  if (formState.failover_ban_duration_seconds !== 0) {
    return messages.banDurationManualDismissZero;
  }

  return null;
}

export function getFailoverStatusCodeInputError(
  formState: Pick<LoadbalanceStrategyFormState, "failover_status_codes" | "failover_status_code_input">,
): string | null {
  const messages = getStaticMessages().loadbalanceStrategyValidation;
  const rawValue = formState.failover_status_code_input.trim();

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

  if (formState.failover_status_codes.includes(statusCode)) {
    return messages.statusCodeExists;
  }

  return null;
}

export function addFailoverStatusCode(
  formState: LoadbalanceStrategyFormState,
): LoadbalanceStrategyFormState {
  if (getFailoverStatusCodeInputError(formState)) {
    return formState;
  }

  const nextStatusCode = Number(formState.failover_status_code_input.trim());
  return {
    ...formState,
    failover_status_codes: normalizeFailoverStatusCodes([
      ...formState.failover_status_codes,
      nextStatusCode,
    ]),
    failover_status_code_input: "",
  };
}

export function removeFailoverStatusCode(
  formState: LoadbalanceStrategyFormState,
  statusCodeToRemove: number,
): LoadbalanceStrategyFormState {
  return {
    ...formState,
    failover_status_codes: formState.failover_status_codes.filter(
      (statusCode) => statusCode !== statusCodeToRemove,
    ),
  };
}

function normalizeFailoverStatusCodes(statusCodes: readonly number[]): number[] {
  return Array.from(
    new Set(
      statusCodes
        .filter((statusCode) => Number.isFinite(statusCode))
        .map((statusCode) => Math.trunc(statusCode)),
    ),
  ).sort((left, right) => left - right);
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
