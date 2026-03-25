import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOADBALANCE_STRATEGY_FORM,
  getLoadbalanceStrategyFormValidationError,
  loadbalanceStrategyFormStateFromStrategy,
  toLoadbalanceStrategyPayload,
} from "../loadbalanceStrategyFormState";

describe("loadbalanceStrategyFormState", () => {
  it("starts new strategies with explicit failover policy defaults", () => {
    expect(DEFAULT_LOADBALANCE_STRATEGY_FORM).toMatchObject({
      name: "",
      strategy_type: "single",
      failover_recovery_enabled: false,
      failover_cooldown_seconds: 60,
      failover_failure_threshold: 2,
      failover_backoff_multiplier: 2,
      failover_max_cooldown_seconds: 900,
      failover_jitter_ratio: 0.2,
      failover_auth_error_cooldown_seconds: 1800,
    });
  });

  it("hydrates all failover policy fields from an existing strategy", () => {
    const strategy = {
      id: 12,
      profile_id: 3,
      name: "Primary failover",
      strategy_type: "failover" as const,
      failover_recovery_enabled: true,
      failover_cooldown_seconds: 45,
      failover_failure_threshold: 4,
      failover_backoff_multiplier: 3.5,
      failover_max_cooldown_seconds: 720,
      failover_jitter_ratio: 0.35,
      failover_auth_error_cooldown_seconds: 2400,
      attached_model_count: 4,
      created_at: "2026-03-25T08:00:00Z",
      updated_at: "2026-03-25T08:00:00Z",
    };

    expect(loadbalanceStrategyFormStateFromStrategy(strategy)).toMatchObject({
      name: "Primary failover",
      strategy_type: "failover",
      failover_recovery_enabled: true,
      failover_cooldown_seconds: 45,
      failover_failure_threshold: 4,
      failover_backoff_multiplier: 3.5,
      failover_max_cooldown_seconds: 720,
      failover_jitter_ratio: 0.35,
      failover_auth_error_cooldown_seconds: 2400,
    });
  });

  it("trims the name, preserves numeric policy values, and only disables recovery for single strategies", () => {
    const failoverFormState = {
      ...DEFAULT_LOADBALANCE_STRATEGY_FORM,
      name: "  Primary failover  ",
      strategy_type: "failover" as const,
      failover_recovery_enabled: true,
      failover_cooldown_seconds: 120.9,
      failover_failure_threshold: 5.2,
      failover_backoff_multiplier: 4,
      failover_max_cooldown_seconds: 1800.6,
      failover_jitter_ratio: 0.4,
      failover_auth_error_cooldown_seconds: 3600.8,
    };

    expect(toLoadbalanceStrategyPayload(failoverFormState)).toMatchObject({
      name: "Primary failover",
      strategy_type: "failover",
      failover_recovery_enabled: true,
      failover_cooldown_seconds: 120,
      failover_failure_threshold: 5,
      failover_backoff_multiplier: 4,
      failover_max_cooldown_seconds: 1800,
      failover_jitter_ratio: 0.4,
      failover_auth_error_cooldown_seconds: 3600,
    });

    expect(
      toLoadbalanceStrategyPayload({
        ...failoverFormState,
        strategy_type: "single",
      }),
    ).toMatchObject({
      strategy_type: "single",
      failover_recovery_enabled: false,
      failover_cooldown_seconds: 120,
      failover_failure_threshold: 5,
      failover_backoff_multiplier: 4,
      failover_max_cooldown_seconds: 1800,
      failover_jitter_ratio: 0.4,
      failover_auth_error_cooldown_seconds: 3600,
    });
  });

  it("rejects non-integer and out-of-range failover policy values before save", () => {
    expect(
      getLoadbalanceStrategyFormValidationError({
        ...DEFAULT_LOADBALANCE_STRATEGY_FORM,
        name: "Failover",
        strategy_type: "failover",
        failover_cooldown_seconds: 1.5,
      }),
    ).toBe("Base cooldown must be a whole number of seconds");

    expect(
      getLoadbalanceStrategyFormValidationError({
        ...DEFAULT_LOADBALANCE_STRATEGY_FORM,
        name: "Failover",
        strategy_type: "failover",
        failover_failure_threshold: 11,
      }),
    ).toBe("Failure threshold must be between 1 and 10");

    expect(
      getLoadbalanceStrategyFormValidationError({
        ...DEFAULT_LOADBALANCE_STRATEGY_FORM,
        name: "Failover",
        strategy_type: "failover",
        failover_backoff_multiplier: 0.5,
      }),
    ).toBe("Backoff multiplier must be between 1 and 10");

    expect(
      getLoadbalanceStrategyFormValidationError({
        ...DEFAULT_LOADBALANCE_STRATEGY_FORM,
        name: "Failover",
        strategy_type: "failover",
        failover_max_cooldown_seconds: 100_000,
      }),
    ).toBe("Max cooldown must be between 1 and 86400 seconds");

    expect(
      getLoadbalanceStrategyFormValidationError({
        ...DEFAULT_LOADBALANCE_STRATEGY_FORM,
        name: "Failover",
        strategy_type: "failover",
        failover_jitter_ratio: 1.5,
      }),
    ).toBe("Jitter ratio must be between 0 and 1");

    expect(
      getLoadbalanceStrategyFormValidationError({
        ...DEFAULT_LOADBALANCE_STRATEGY_FORM,
        name: "Failover",
        strategy_type: "failover",
        failover_auth_error_cooldown_seconds: 1.25,
      }),
    ).toBe("Auth error cooldown must be a whole number of seconds");
  });

  it("returns localized validation errors when the active locale is Chinese", () => {
    document.documentElement.lang = "zh-CN";

    expect(
      getLoadbalanceStrategyFormValidationError({
        ...DEFAULT_LOADBALANCE_STRATEGY_FORM,
        name: "",
        strategy_type: "single",
      }),
    ).toBe("名称为必填项");
  });
});
