import { describe, expect, it } from "vitest";
import type { LoadbalanceStrategy } from "@/lib/types";
import {
  DEFAULT_LOADBALANCE_STRATEGY_FORM,
  getLoadbalanceStrategyFormValidationError,
  getDefaultEnabledAutoRecoveryDraft,
  loadbalanceStrategyFormStateFromStrategy,
  toLoadbalanceStrategyPayload,
  type LoadbalanceStrategyFormState,
} from "../loadbalanceStrategyFormState";

describe("loadbalanceStrategyFormState", () => {
  const buildAutoRecoveryEnabled = () => getDefaultEnabledAutoRecoveryDraft();

  it("starts new strategies with a disabled auto_recovery branch", () => {
    expect(DEFAULT_LOADBALANCE_STRATEGY_FORM).toMatchObject({
      name: "",
      strategy_type: "single",
      auto_recovery: {
        mode: "disabled",
      },
    });
  });

  it("hydrates the enabled auto_recovery branch from an existing strategy", () => {
    const strategy: LoadbalanceStrategy = {
      id: 12,
      profile_id: 3,
      name: "Primary failover",
      strategy_type: "failover",
      auto_recovery: {
        mode: "enabled",
        status_codes: [403, 429, 503],
        cooldown: {
          base_seconds: 45,
          failure_threshold: 4,
          backoff_multiplier: 3.5,
          max_cooldown_seconds: 720,
          jitter_ratio: 0.35,
        },
        ban: {
          mode: "temporary",
          max_cooldown_strikes_before_ban: 3,
          ban_duration_seconds: 1800,
        },
      },
      attached_model_count: 4,
      created_at: "2026-03-25T08:00:00Z",
      updated_at: "2026-03-25T08:00:00Z",
    };

    expect(loadbalanceStrategyFormStateFromStrategy(strategy)).toMatchObject({
      name: "Primary failover",
      strategy_type: "failover",
      auto_recovery: {
        mode: "enabled",
        status_codes: [403, 429, 503],
        cooldown: {
          base_seconds: 45,
          failure_threshold: 4,
          backoff_multiplier: 3.5,
          max_cooldown_seconds: 720,
          jitter_ratio: 0.35,
        },
        ban: {
          mode: "temporary",
          max_cooldown_strikes_before_ban: 3,
          ban_duration_seconds: 1800,
        },
      },
    });
  });

  it("accepts fill-first strategies and preserves nested recovery for non-single payloads", () => {
    const strategy: LoadbalanceStrategy = {
      id: 14,
      profile_id: 3,
      name: "Primary fill-first",
      strategy_type: "fill-first",
      auto_recovery: {
        mode: "enabled",
        status_codes: [403, 429, 503],
        cooldown: {
          base_seconds: 45,
          failure_threshold: 4,
          backoff_multiplier: 3.5,
          max_cooldown_seconds: 720,
          jitter_ratio: 0.35,
        },
        ban: {
          mode: "temporary",
          max_cooldown_strikes_before_ban: 3,
          ban_duration_seconds: 1800,
        },
      },
      attached_model_count: 2,
      created_at: "2026-03-25T08:00:00Z",
      updated_at: "2026-03-25T08:00:00Z",
    };

    expect(loadbalanceStrategyFormStateFromStrategy(strategy)).toMatchObject({
      strategy_type: "fill-first",
      auto_recovery: { mode: "enabled", status_code_input: "" },
    });

    expect(
      toLoadbalanceStrategyPayload({
        ...DEFAULT_LOADBALANCE_STRATEGY_FORM,
        name: "  Primary fill-first  ",
        strategy_type: "fill-first",
        auto_recovery: buildAutoRecoveryEnabled(),
      }),
    ).toMatchObject({
      name: "Primary fill-first",
      strategy_type: "fill-first",
      auto_recovery: {
        mode: "enabled",
        status_codes: [403, 422, 429, 500, 502, 503, 504, 529],
        cooldown: {
          base_seconds: 60,
          failure_threshold: 2,
          backoff_multiplier: 2,
          max_cooldown_seconds: 900,
          jitter_ratio: 0.2,
        },
        ban: { mode: "off" },
      },
    });
  });

  it("trims the name, sorts status codes uniquely, preserves numeric policy values, and keeps payloads nested", () => {
    const failoverFormState: LoadbalanceStrategyFormState = {
      ...DEFAULT_LOADBALANCE_STRATEGY_FORM,
      name: "  Primary failover  ",
      strategy_type: "failover" as const,
      auto_recovery: {
        ...buildAutoRecoveryEnabled(),
        status_codes: [503, 429, 503, 504],
        cooldown: {
          base_seconds: 120.9,
          failure_threshold: 5.2,
          backoff_multiplier: 4,
          max_cooldown_seconds: 1800.6,
          jitter_ratio: 0.4,
        },
        ban: {
          mode: "manual" as const,
          max_cooldown_strikes_before_ban: 4.7,
        },
      },
    };

    expect(toLoadbalanceStrategyPayload(failoverFormState)).toMatchObject({
      name: "Primary failover",
      strategy_type: "failover",
      auto_recovery: {
        mode: "enabled",
        status_codes: [429, 503, 504],
        cooldown: {
          base_seconds: 120,
          failure_threshold: 5,
          backoff_multiplier: 4,
          max_cooldown_seconds: 1800,
          jitter_ratio: 0.4,
        },
        ban: {
          mode: "manual",
          max_cooldown_strikes_before_ban: 4,
        },
      },
    });
  });

  it("forces single strategies to emit a disabled auto_recovery branch", () => {
    expect(
      toLoadbalanceStrategyPayload({
        ...DEFAULT_LOADBALANCE_STRATEGY_FORM,
        name: "Single strategy",
        strategy_type: "single",
        auto_recovery: {
          ...buildAutoRecoveryEnabled(),
          ban: {
            mode: "temporary",
            max_cooldown_strikes_before_ban: 3,
            ban_duration_seconds: 600,
          },
        },
      }),
    ).toMatchObject({
      name: "Single strategy",
      strategy_type: "single",
      auto_recovery: {
        mode: "disabled",
      },
    });
  });

  it("skips recovery validation when the auto_recovery branch is disabled", () => {
    expect(
      getLoadbalanceStrategyFormValidationError({
        ...DEFAULT_LOADBALANCE_STRATEGY_FORM,
        name: "Fill-first",
        strategy_type: "fill-first",
        auto_recovery: { mode: "disabled" },
      }),
    ).toBeNull();
  });

  it("rejects invalid enabled auto_recovery status code lists and out-of-range policy values before save", () => {
    expect(
      getLoadbalanceStrategyFormValidationError({
        ...DEFAULT_LOADBALANCE_STRATEGY_FORM,
        name: "Failover",
        strategy_type: "failover",
        auto_recovery: {
          ...buildAutoRecoveryEnabled(),
          status_codes: [],
        },
      }),
    ).toBe("Add at least one failover status code");

    expect(
      getLoadbalanceStrategyFormValidationError({
        ...DEFAULT_LOADBALANCE_STRATEGY_FORM,
        name: "Failover",
        strategy_type: "failover",
        auto_recovery: {
          ...buildAutoRecoveryEnabled(),
          status_codes: [429, 429],
        },
      }),
    ).toBe("Failover status codes must be unique");

    expect(
      getLoadbalanceStrategyFormValidationError({
        ...DEFAULT_LOADBALANCE_STRATEGY_FORM,
        name: "Failover",
        strategy_type: "failover",
        auto_recovery: {
          ...buildAutoRecoveryEnabled(),
          status_codes: [99, 429],
        },
      }),
    ).toBe("Failover status codes must be valid HTTP status codes between 100 and 599");

    expect(
      getLoadbalanceStrategyFormValidationError({
        ...DEFAULT_LOADBALANCE_STRATEGY_FORM,
        name: "Failover",
        strategy_type: "failover",
        auto_recovery: {
          ...buildAutoRecoveryEnabled(),
          cooldown: {
            ...buildAutoRecoveryEnabled().cooldown,
            base_seconds: 1.5,
          },
        },
      }),
    ).toBe("Base cooldown must be a whole number of seconds");

    expect(
      getLoadbalanceStrategyFormValidationError({
        ...DEFAULT_LOADBALANCE_STRATEGY_FORM,
        name: "Failover",
        strategy_type: "failover",
        auto_recovery: {
          ...buildAutoRecoveryEnabled(),
          cooldown: {
            ...buildAutoRecoveryEnabled().cooldown,
            failure_threshold: 11,
          },
        },
      }),
    ).toBe("Failure threshold must be between 1 and 10");

    expect(
      getLoadbalanceStrategyFormValidationError({
        ...DEFAULT_LOADBALANCE_STRATEGY_FORM,
        name: "Failover",
        strategy_type: "failover",
        auto_recovery: {
          ...buildAutoRecoveryEnabled(),
          cooldown: {
            ...buildAutoRecoveryEnabled().cooldown,
            backoff_multiplier: 0.5,
          },
        },
      }),
    ).toBe("Backoff multiplier must be between 1 and 10");

    expect(
      getLoadbalanceStrategyFormValidationError({
        ...DEFAULT_LOADBALANCE_STRATEGY_FORM,
        name: "Failover",
        strategy_type: "failover",
        auto_recovery: {
          ...buildAutoRecoveryEnabled(),
          cooldown: {
            ...buildAutoRecoveryEnabled().cooldown,
            max_cooldown_seconds: 100_000,
          },
        },
      }),
    ).toBe("Max cooldown must be between 1 and 86400 seconds");

    expect(
      getLoadbalanceStrategyFormValidationError({
        ...DEFAULT_LOADBALANCE_STRATEGY_FORM,
        name: "Failover",
        strategy_type: "failover",
        auto_recovery: {
          ...buildAutoRecoveryEnabled(),
          cooldown: {
            ...buildAutoRecoveryEnabled().cooldown,
            jitter_ratio: 1.5,
          },
        },
      }),
    ).toBe("Jitter ratio must be between 0 and 1");

    expect(
      getLoadbalanceStrategyFormValidationError({
        ...DEFAULT_LOADBALANCE_STRATEGY_FORM,
        name: "Failover",
        strategy_type: "failover",
        auto_recovery: {
          ...buildAutoRecoveryEnabled(),
          ban: {
            mode: "temporary",
            max_cooldown_strikes_before_ban: 0,
            ban_duration_seconds: 30,
          },
        },
      }),
    ).toBe("Max-cooldown strikes before ban must be at least 1 when ban escalation is enabled");

    expect(
      getLoadbalanceStrategyFormValidationError({
        ...DEFAULT_LOADBALANCE_STRATEGY_FORM,
        name: "Failover",
        strategy_type: "failover",
        auto_recovery: {
          ...buildAutoRecoveryEnabled(),
          ban: {
            mode: "temporary",
            max_cooldown_strikes_before_ban: 2,
            ban_duration_seconds: 0,
          },
        },
      }),
    ).toBe("Ban duration must be at least 1 second for temporary bans");

    expect(
      getLoadbalanceStrategyFormValidationError({
        ...DEFAULT_LOADBALANCE_STRATEGY_FORM,
        name: "Failover",
        strategy_type: "failover",
        auto_recovery: {
          ...buildAutoRecoveryEnabled(),
          ban: {
            mode: "manual",
            max_cooldown_strikes_before_ban: 2,
          },
        },
      }),
    ).toBeNull();
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
