import type { LoadbalanceStrategy } from "@/lib/types";
import { getCurrentLocale } from "@/i18n/format";

export type LoadbalanceStrategyFormState = {
  name: string;
  strategy_type: "single" | "failover";
  failover_recovery_enabled: boolean;
  failover_cooldown_seconds: number;
  failover_failure_threshold: number;
  failover_backoff_multiplier: number;
  failover_max_cooldown_seconds: number;
  failover_jitter_ratio: number;
  failover_auth_error_cooldown_seconds: number;
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
  failover_auth_error_cooldown_seconds: 1800,
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
    failover_auth_error_cooldown_seconds: strategy.failover_auth_error_cooldown_seconds,
  };
}

export function toLoadbalanceStrategyPayload(
  formState: LoadbalanceStrategyFormState,
): LoadbalanceStrategyFormState {
  const normalizeInteger = (value: number) => Math.trunc(value);

  return {
    name: formState.name.trim(),
    strategy_type: formState.strategy_type,
    failover_recovery_enabled:
      formState.strategy_type === "failover" ? formState.failover_recovery_enabled : false,
    failover_cooldown_seconds: normalizeInteger(formState.failover_cooldown_seconds),
    failover_failure_threshold: normalizeInteger(formState.failover_failure_threshold),
    failover_backoff_multiplier: formState.failover_backoff_multiplier,
    failover_max_cooldown_seconds: normalizeInteger(formState.failover_max_cooldown_seconds),
    failover_jitter_ratio: formState.failover_jitter_ratio,
    failover_auth_error_cooldown_seconds: normalizeInteger(
      formState.failover_auth_error_cooldown_seconds,
    ),
  };
}

export function getLoadbalanceStrategyFormValidationError(
  formState: LoadbalanceStrategyFormState,
): string | null {
  const isChinese = getCurrentLocale() === "zh-CN";
  if (!formState.name.trim()) {
    return isChinese ? "名称为必填项" : "Name is required";
  }

  if (!Number.isInteger(formState.failover_cooldown_seconds)) {
    return isChinese ? "基础冷却时间必须为整数秒" : "Base cooldown must be a whole number of seconds";
  }
  if (formState.failover_cooldown_seconds < 0) {
    return isChinese ? "基础冷却时间至少为 0 秒" : "Base cooldown must be at least 0 seconds";
  }

  if (!Number.isInteger(formState.failover_failure_threshold)) {
    return isChinese ? "失败阈值必须为整数" : "Failure threshold must be a whole number";
  }
  if (
    formState.failover_failure_threshold < 1 ||
    formState.failover_failure_threshold > 10
  ) {
    return isChinese ? "失败阈值必须在 1 到 10 之间" : "Failure threshold must be between 1 and 10";
  }

  if (
    !Number.isFinite(formState.failover_backoff_multiplier) ||
    formState.failover_backoff_multiplier < 1 ||
    formState.failover_backoff_multiplier > 10
  ) {
    return isChinese ? "退避倍数必须在 1 到 10 之间" : "Backoff multiplier must be between 1 and 10";
  }

  if (!Number.isInteger(formState.failover_max_cooldown_seconds)) {
    return isChinese ? "最大冷却时间必须为整数秒" : "Max cooldown must be a whole number of seconds";
  }
  if (
    formState.failover_max_cooldown_seconds < 1 ||
    formState.failover_max_cooldown_seconds > 86_400
  ) {
    return isChinese ? "最大冷却时间必须在 1 到 86400 秒之间" : "Max cooldown must be between 1 and 86400 seconds";
  }

  if (
    !Number.isFinite(formState.failover_jitter_ratio) ||
    formState.failover_jitter_ratio < 0 ||
    formState.failover_jitter_ratio > 1
  ) {
    return isChinese ? "抖动比率必须在 0 到 1 之间" : "Jitter ratio must be between 0 and 1";
  }

  if (!Number.isInteger(formState.failover_auth_error_cooldown_seconds)) {
    return isChinese ? "认证错误冷却时间必须为整数秒" : "Auth error cooldown must be a whole number of seconds";
  }
  if (
    formState.failover_auth_error_cooldown_seconds < 1 ||
    formState.failover_auth_error_cooldown_seconds > 86_400
  ) {
    return isChinese ? "认证错误冷却时间必须在 1 到 86400 秒之间" : "Auth error cooldown must be between 1 and 86400 seconds";
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
