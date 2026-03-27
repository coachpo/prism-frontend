import type { LoadbalanceBanMode, LoadbalanceStrategy } from "@/lib/types";
import { getCurrentLocale } from "@/i18n/format";

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
  const isChinese = getCurrentLocale() === "zh-CN";

  if (!formState.name.trim()) {
    return isChinese ? "名称为必填项" : "Name is required";
  }

  if (formState.failover_status_codes.length === 0) {
    return isChinese ? "请至少添加一个故障转移状态码" : "Add at least one failover status code";
  }

  if (new Set(formState.failover_status_codes).size !== formState.failover_status_codes.length) {
    return isChinese ? "故障转移状态码必须唯一" : "Failover status codes must be unique";
  }

  if (
    formState.failover_status_codes.some(
      (statusCode) => !Number.isInteger(statusCode) || statusCode < 100 || statusCode > 599,
    )
  ) {
    return isChinese
      ? "故障转移状态码必须是 100 到 599 之间的有效 HTTP 状态码"
      : "Failover status codes must be valid HTTP status codes between 100 and 599";
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

  if (!Number.isInteger(formState.failover_max_cooldown_strikes_before_ban)) {
    return isChinese
      ? "封禁前最大冷却次数必须为整数"
      : "Max-cooldown strikes before ban must be a whole number";
  }

  if (!Number.isInteger(formState.failover_ban_duration_seconds)) {
    return isChinese
      ? "封禁时长必须为整数秒"
      : "Ban duration must be a whole number of seconds";
  }

  if (formState.failover_ban_mode === "off") {
    if (
      formState.failover_max_cooldown_strikes_before_ban !== 0 ||
      formState.failover_ban_duration_seconds !== 0
    ) {
      return isChinese
        ? "封禁模式关闭时，次数和时长都必须为 0"
        : "Ban escalation must stay at 0 strikes and 0 seconds while ban mode is off";
    }

    return null;
  }

  if (formState.failover_max_cooldown_strikes_before_ban < 1) {
    return isChinese
      ? "启用封禁升级时，封禁前最大冷却次数至少为 1"
      : "Max-cooldown strikes before ban must be at least 1 when ban escalation is enabled";
  }

  if (formState.failover_ban_mode === "temporary") {
    if (formState.failover_ban_duration_seconds < 1) {
      return isChinese
        ? "临时封禁时长至少为 1 秒"
        : "Ban duration must be at least 1 second for temporary bans";
    }

    return null;
  }

  if (formState.failover_ban_duration_seconds !== 0) {
    return isChinese
      ? "手动解除封禁时，封禁时长必须为 0 秒"
      : "Ban duration must be 0 seconds for manual dismiss bans";
  }

  return null;
}

export function getFailoverStatusCodeInputError(
  formState: Pick<LoadbalanceStrategyFormState, "failover_status_codes" | "failover_status_code_input">,
): string | null {
  const isChinese = getCurrentLocale() === "zh-CN";
  const rawValue = formState.failover_status_code_input.trim();

  if (!rawValue) {
    return null;
  }

  if (!/^\d+$/.test(rawValue)) {
    return isChinese
      ? "状态码必须是 100 到 599 之间的整数"
      : "Status code must be a whole number between 100 and 599";
  }

  const statusCode = Number(rawValue);
  if (statusCode < 100 || statusCode > 599) {
    return isChinese
      ? "状态码必须是 100 到 599 之间的整数"
      : "Status code must be a whole number between 100 and 599";
  }

  if (formState.failover_status_codes.includes(statusCode)) {
    return isChinese ? "该状态码已存在" : "That status code is already included";
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
