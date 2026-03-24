import type { LoadbalanceStrategy } from "@/lib/types";

export type LoadbalanceStrategyFormState = {
  name: string;
  strategy_type: "single" | "failover";
  failover_recovery_enabled: boolean;
};

export const DEFAULT_LOADBALANCE_STRATEGY_FORM: LoadbalanceStrategyFormState = {
  name: "",
  strategy_type: "single",
  failover_recovery_enabled: false,
};

export function loadbalanceStrategyFormStateFromStrategy(
  strategy: LoadbalanceStrategy,
): LoadbalanceStrategyFormState {
  return {
    name: strategy.name,
    strategy_type: strategy.strategy_type,
    failover_recovery_enabled: strategy.failover_recovery_enabled,
  };
}

export function toLoadbalanceStrategyPayload(
  formState: LoadbalanceStrategyFormState,
): LoadbalanceStrategyFormState {
  return {
    name: formState.name.trim(),
    strategy_type: formState.strategy_type,
    failover_recovery_enabled:
      formState.strategy_type === "failover" ? formState.failover_recovery_enabled : false,
  };
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
