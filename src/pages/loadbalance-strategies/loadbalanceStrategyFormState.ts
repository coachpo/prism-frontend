import type {
  AutoRecovery,
  AutoRecoveryEnabled,
  LoadbalanceBanMode,
  LoadbalanceStrategy,
} from "@/lib/types";
import { getStaticMessages } from "@/i18n/staticMessages";

export const DEFAULT_FAILOVER_STATUS_CODES = [403, 422, 429, 500, 502, 503, 504, 529];

type AutoRecoveryDraftBan =
  | { mode: "off" }
  | { mode: "manual"; max_cooldown_strikes_before_ban: number }
  | {
      mode: "temporary";
      max_cooldown_strikes_before_ban: number;
      ban_duration_seconds: number;
    };

type AutoRecoveryDraftEnabled = {
  mode: "enabled";
  status_codes: number[];
  status_code_input: string;
  cooldown: {
    base_seconds: number;
    failure_threshold: number;
    backoff_multiplier: number;
    max_cooldown_seconds: number;
    jitter_ratio: number;
  };
  ban: AutoRecoveryDraftBan;
};

type AutoRecoveryDraftDisabled = {
  mode: "disabled";
};

export type AutoRecoveryDraft = AutoRecoveryDraftDisabled | AutoRecoveryDraftEnabled;

export type LoadbalanceStrategyFormState = {
  name: string;
  strategy_type: "single" | "fill-first" | "round-robin" | "failover";
  auto_recovery: AutoRecoveryDraft;
};

function createDefaultEnabledAutoRecovery(): AutoRecoveryDraftEnabled {
  return {
    mode: "enabled",
    status_codes: [...DEFAULT_FAILOVER_STATUS_CODES],
    status_code_input: "",
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

export const DEFAULT_LOADBALANCE_STRATEGY_FORM: LoadbalanceStrategyFormState = {
  name: "",
  strategy_type: "single",
  auto_recovery: { mode: "disabled" },
};

function normalizeEnabledDraftAutoRecovery(
  autoRecovery: AutoRecoveryEnabled,
): AutoRecoveryDraftEnabled {
  return {
    mode: "enabled",
    status_codes: normalizeFailoverStatusCodes(autoRecovery.status_codes),
    status_code_input: "",
    cooldown: {
      base_seconds: autoRecovery.cooldown.base_seconds,
      failure_threshold: autoRecovery.cooldown.failure_threshold,
      backoff_multiplier: autoRecovery.cooldown.backoff_multiplier,
      max_cooldown_seconds: autoRecovery.cooldown.max_cooldown_seconds,
      jitter_ratio: autoRecovery.cooldown.jitter_ratio,
    },
    ban:
      autoRecovery.ban.mode === "off"
        ? { mode: "off" }
        : autoRecovery.ban.mode === "temporary"
          ? {
              mode: "temporary",
              max_cooldown_strikes_before_ban:
                autoRecovery.ban.max_cooldown_strikes_before_ban,
              ban_duration_seconds: autoRecovery.ban.ban_duration_seconds,
            }
          : {
              mode: "manual",
              max_cooldown_strikes_before_ban:
                autoRecovery.ban.max_cooldown_strikes_before_ban,
            },
  };
}

export function loadbalanceStrategyFormStateFromStrategy(
  strategy: LoadbalanceStrategy,
): LoadbalanceStrategyFormState {
  return {
    name: strategy.name,
    strategy_type: strategy.strategy_type,
    auto_recovery:
      strategy.auto_recovery.mode === "enabled"
        ? normalizeEnabledDraftAutoRecovery(strategy.auto_recovery)
        : { mode: "disabled" },
  };
}

export type LoadbalanceStrategyFormPayload = Omit<
  LoadbalanceStrategyFormState,
  "auto_recovery"
> & {
  auto_recovery: AutoRecovery;
};

function normalizeInteger(value: number) {
  return Math.trunc(value);
}

export function toLoadbalanceStrategyPayload(
  formState: LoadbalanceStrategyFormState,
): LoadbalanceStrategyFormPayload {
  if (formState.strategy_type === "single" || formState.auto_recovery.mode === "disabled") {
    return {
      name: formState.name.trim(),
      strategy_type: formState.strategy_type,
      auto_recovery: { mode: "disabled" },
    };
  }

  const normalizedBan =
    formState.auto_recovery.ban.mode === "off"
      ? { mode: "off" as const }
      : formState.auto_recovery.ban.mode === "temporary"
        ? {
            mode: "temporary" as const,
            max_cooldown_strikes_before_ban: normalizeInteger(
              formState.auto_recovery.ban.max_cooldown_strikes_before_ban ?? 0,
            ),
            ban_duration_seconds: normalizeInteger(
              formState.auto_recovery.ban.ban_duration_seconds ?? 0,
            ),
          }
        : {
            mode: "manual" as const,
            max_cooldown_strikes_before_ban: normalizeInteger(
              formState.auto_recovery.ban.max_cooldown_strikes_before_ban ?? 0,
            ),
          };

  return {
    name: formState.name.trim(),
    strategy_type: formState.strategy_type,
    auto_recovery: {
      mode: "enabled",
      status_codes: normalizeFailoverStatusCodes(formState.auto_recovery.status_codes),
      cooldown: {
        base_seconds: normalizeInteger(formState.auto_recovery.cooldown.base_seconds),
        failure_threshold: normalizeInteger(formState.auto_recovery.cooldown.failure_threshold),
        backoff_multiplier: formState.auto_recovery.cooldown.backoff_multiplier,
        max_cooldown_seconds: normalizeInteger(
          formState.auto_recovery.cooldown.max_cooldown_seconds,
        ),
        jitter_ratio: formState.auto_recovery.cooldown.jitter_ratio,
      },
      ban: normalizedBan,
    },
  };
}

export function setLoadbalanceStrategyType(
  formState: LoadbalanceStrategyFormState,
  strategyType: LoadbalanceStrategyFormState["strategy_type"],
): LoadbalanceStrategyFormState {
  return {
    ...formState,
    strategy_type: strategyType,
    auto_recovery:
      strategyType === "single" ? { mode: "disabled" } : formState.auto_recovery,
  };
}

export function setLoadbalanceStrategyAutoRecoveryEnabled(
  formState: LoadbalanceStrategyFormState,
  enabled: boolean,
): LoadbalanceStrategyFormState {
  if (formState.strategy_type === "single" || !enabled) {
    return {
      ...formState,
      auto_recovery: { mode: "disabled" },
    };
  }

  if (formState.auto_recovery.mode === "enabled") {
    return formState;
  }

  return {
    ...formState,
    auto_recovery: createDefaultEnabledAutoRecovery(),
  };
}

export function setLoadbalanceStrategyBanMode(
  formState: LoadbalanceStrategyFormState,
  mode: LoadbalanceBanMode,
): LoadbalanceStrategyFormState {
  if (formState.auto_recovery.mode !== "enabled") {
    return formState;
  }

  const currentBan = formState.auto_recovery.ban;
  const nextBan: AutoRecoveryDraftBan =
    mode === "off"
      ? { mode: "off" }
      : mode === "temporary"
        ? {
            mode: "temporary",
            max_cooldown_strikes_before_ban:
              currentBan.mode === "off"
                ? 1
                : Math.max(currentBan.max_cooldown_strikes_before_ban, 1),
            ban_duration_seconds:
              currentBan.mode === "temporary"
                ? Math.max(currentBan.ban_duration_seconds, 1)
                : 1,
          }
        : {
            mode: "manual",
            max_cooldown_strikes_before_ban:
              currentBan.mode === "off"
                ? 1
                : Math.max(currentBan.max_cooldown_strikes_before_ban, 1),
          };

  return {
    ...formState,
    auto_recovery: {
      ...formState.auto_recovery,
      ban: nextBan,
    },
  };
}

export function getLoadbalanceStrategyFormValidationError(
  formState: LoadbalanceStrategyFormState,
): string | null {
  const messages = getStaticMessages().loadbalanceStrategyValidation;

  if (!formState.name.trim()) {
    return messages.nameRequired;
  }

  if (formState.strategy_type === "single" || formState.auto_recovery.mode === "disabled") {
    return null;
  }

  if (formState.auto_recovery.status_codes.length === 0) {
    return messages.addStatusCode;
  }

  if (
    new Set(formState.auto_recovery.status_codes).size !==
    formState.auto_recovery.status_codes.length
  ) {
    return messages.statusCodesUnique;
  }

  if (
    formState.auto_recovery.status_codes.some(
      (statusCode) => !Number.isInteger(statusCode) || statusCode < 100 || statusCode > 599,
    )
  ) {
    return messages.statusCodesValidHttp;
  }

  if (!Number.isInteger(formState.auto_recovery.cooldown.base_seconds)) {
    return messages.baseCooldownIntegerSeconds;
  }
  if (formState.auto_recovery.cooldown.base_seconds < 0) {
    return messages.baseCooldownMin;
  }

  if (!Number.isInteger(formState.auto_recovery.cooldown.failure_threshold)) {
    return messages.failureThresholdInteger;
  }
  if (
    formState.auto_recovery.cooldown.failure_threshold < 1 ||
    formState.auto_recovery.cooldown.failure_threshold > 10
  ) {
    return messages.failureThresholdRange;
  }

  if (
    !Number.isFinite(formState.auto_recovery.cooldown.backoff_multiplier) ||
    formState.auto_recovery.cooldown.backoff_multiplier < 1 ||
    formState.auto_recovery.cooldown.backoff_multiplier > 10
  ) {
    return messages.backoffMultiplierRange;
  }

  if (!Number.isInteger(formState.auto_recovery.cooldown.max_cooldown_seconds)) {
    return messages.maxCooldownIntegerSeconds;
  }
  if (
    formState.auto_recovery.cooldown.max_cooldown_seconds < 1 ||
    formState.auto_recovery.cooldown.max_cooldown_seconds > 86_400
  ) {
    return messages.maxCooldownRange;
  }

  if (
    !Number.isFinite(formState.auto_recovery.cooldown.jitter_ratio) ||
    formState.auto_recovery.cooldown.jitter_ratio < 0 ||
    formState.auto_recovery.cooldown.jitter_ratio > 1
  ) {
    return messages.jitterRatioRange;
  }

  const { ban } = formState.auto_recovery;

  if (ban.mode === "off") {
    return null;
  }

  if (!Number.isInteger(ban.max_cooldown_strikes_before_ban)) {
    return messages.maxCooldownStrikesInteger;
  }

  if (ban.max_cooldown_strikes_before_ban < 1) {
    return messages.maxCooldownStrikesMin;
  }

  if (ban.mode === "temporary") {
    if (!Number.isInteger(ban.ban_duration_seconds)) {
      return messages.banDurationIntegerSeconds;
    }
    if (ban.ban_duration_seconds < 1) {
      return messages.banDurationTemporaryMin;
    }

    return null;
  }

  if ((ban as { ban_duration_seconds?: number }).ban_duration_seconds !== undefined) {
    if (!Number.isInteger((ban as { ban_duration_seconds?: number }).ban_duration_seconds)) {
      return messages.banDurationIntegerSeconds;
    }
    if ((ban as { ban_duration_seconds?: number }).ban_duration_seconds !== 0) {
      return messages.banDurationManualDismissZero;
    }
  }

  return null;
}

export function getFailoverStatusCodeInputError(
  formState: Pick<AutoRecoveryDraftEnabled, "status_codes" | "status_code_input">,
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

  if (formState.status_codes.includes(statusCode)) {
    return messages.statusCodeExists;
  }

  return null;
}

export function addFailoverStatusCode(
  formState: LoadbalanceStrategyFormState,
): LoadbalanceStrategyFormState {
  if (
    formState.auto_recovery.mode !== "enabled" ||
    getFailoverStatusCodeInputError(formState.auto_recovery)
  ) {
    return formState;
  }

  const nextStatusCode = Number(formState.auto_recovery.status_code_input.trim());
  return {
    ...formState,
    auto_recovery: {
      ...formState.auto_recovery,
      status_codes: normalizeFailoverStatusCodes([
        ...formState.auto_recovery.status_codes,
        nextStatusCode,
      ]),
      status_code_input: "",
    },
  };
}

export function removeFailoverStatusCode(
  formState: LoadbalanceStrategyFormState,
  statusCodeToRemove: number,
): LoadbalanceStrategyFormState {
  if (formState.auto_recovery.mode !== "enabled") {
    return formState;
  }

  return {
    ...formState,
    auto_recovery: {
      ...formState.auto_recovery,
      status_codes: formState.auto_recovery.status_codes.filter(
        (statusCode) => statusCode !== statusCodeToRemove,
      ),
    },
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

export function getDefaultEnabledAutoRecoveryDraft(): AutoRecoveryDraftEnabled {
  return createDefaultEnabledAutoRecovery();
}
