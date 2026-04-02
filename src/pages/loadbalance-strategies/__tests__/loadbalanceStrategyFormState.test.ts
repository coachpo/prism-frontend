import { describe, expect, it } from "vitest";
import type { LoadbalanceStrategy } from "@/lib/types";
import {
  DEFAULT_LOADBALANCE_STRATEGY_FORM,
  getDefaultAutoRecoveryDraft,
  getLoadbalanceStrategyFormValidationError,
  loadbalanceStrategyFormStateFromStrategy,
  toLoadbalanceStrategyPayload,
  type LoadbalanceStrategyFormState,
} from "../loadbalanceStrategyFormState";

function buildForm(
  overrides: Partial<LoadbalanceStrategyFormState> = {},
): LoadbalanceStrategyFormState {
  return {
    ...DEFAULT_LOADBALANCE_STRATEGY_FORM,
    name: "round-robin-primary",
    strategy_type: "round-robin",
    auto_recovery: getDefaultAutoRecoveryDraft("round-robin"),
    ...overrides,
  };
}

describe("loadbalanceStrategyFormState", () => {
  it("starts new strategies in the legacy single-strategy shape", () => {
    expect(DEFAULT_LOADBALANCE_STRATEGY_FORM).toEqual({
      name: "",
      strategy_type: "single",
      auto_recovery: getDefaultAutoRecoveryDraft("single"),
    });
  });

  it("keeps enabled recovery when saving a single strategy", () => {
    expect(
      toLoadbalanceStrategyPayload({
        ...buildForm(),
        name: "  Single priority  ",
        strategy_type: "single",
        auto_recovery: {
          mode: "enabled",
          status_codes: [503, 429, 503],
          status_code_input: "",
          cooldown: {
            base_seconds: 90,
            failure_threshold: 3,
            backoff_multiplier: 2,
            max_cooldown_seconds: 600,
            jitter_ratio: 0.25,
          },
          ban: {
            mode: "off",
          },
        },
      }),
    ).toEqual({
      name: "Single priority",
      strategy_type: "single",
      auto_recovery: {
        mode: "enabled",
        status_codes: [429, 503],
        cooldown: {
          base_seconds: 90,
          failure_threshold: 3,
          backoff_multiplier: 2,
          max_cooldown_seconds: 600,
          jitter_ratio: 0.25,
        },
        ban: {
          mode: "off",
        },
      },
    });
  });

  it("hydrates the legacy auto_recovery draft from an existing strategy", () => {
    const strategy: LoadbalanceStrategy = {
      id: 12,
      profile_id: 3,
      name: "Round robin availability",
      strategy_type: "round-robin",
      auto_recovery: {
        mode: "enabled",
        status_codes: [503, 429, 503],
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

    expect(loadbalanceStrategyFormStateFromStrategy(strategy)).toEqual({
      name: "Round robin availability",
      strategy_type: "round-robin",
      auto_recovery: {
        mode: "enabled",
        status_codes: [429, 503],
        status_code_input: "",
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

  it("trims the name and normalizes enabled auto_recovery before save", () => {
    expect(
      toLoadbalanceStrategyPayload({
        ...buildForm(),
        name: "  Fill first priority  ",
        strategy_type: "fill-first",
        auto_recovery: {
          mode: "enabled",
          status_codes: [503, 429, 503, 504],
          status_code_input: "",
          cooldown: {
            base_seconds: 120.9,
            failure_threshold: 5.2,
            backoff_multiplier: 4,
            max_cooldown_seconds: 1800.6,
            jitter_ratio: 0.4,
          },
          ban: {
            mode: "manual",
            max_cooldown_strikes_before_ban: 4.7,
          },
        },
      }),
    ).toEqual({
      name: "Fill first priority",
      strategy_type: "fill-first",
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

  it("validates enabled recovery values before save", () => {
    expect(
      getLoadbalanceStrategyFormValidationError({
        ...buildForm(),
        auto_recovery: {
          mode: "enabled",
          status_codes: [],
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
        },
      }),
    ).toBe("Add at least one failure status code");

    expect(
      getLoadbalanceStrategyFormValidationError({
        ...buildForm(),
        auto_recovery: {
          mode: "enabled",
          status_codes: [429, 429],
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
        },
      }),
    ).toBe("Failure status codes must be unique");

    expect(
      getLoadbalanceStrategyFormValidationError({
        ...buildForm(),
        auto_recovery: {
          mode: "enabled",
          status_codes: [99, 429],
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
        },
      }),
    ).toBe("Failure status codes must be valid HTTP status codes between 100 and 599");

    expect(
      getLoadbalanceStrategyFormValidationError({
        ...buildForm(),
        auto_recovery: {
          mode: "enabled",
          status_codes: [429],
          status_code_input: "",
          cooldown: {
            base_seconds: 1.5,
            failure_threshold: 2,
            backoff_multiplier: 2,
            max_cooldown_seconds: 900,
            jitter_ratio: 0.2,
          },
          ban: {
            mode: "off",
          },
        },
      }),
    ).toBe("Base open window must be a whole number of seconds");

    expect(
      getLoadbalanceStrategyFormValidationError({
        ...buildForm(),
        auto_recovery: {
          mode: "enabled",
          status_codes: [429],
          status_code_input: "",
          cooldown: {
            base_seconds: 60,
            failure_threshold: 51,
            backoff_multiplier: 2,
            max_cooldown_seconds: 900,
            jitter_ratio: 0.2,
          },
          ban: {
            mode: "off",
          },
        },
      }),
    ).toBe("Failure threshold must be between 1 and 50");

    expect(
      getLoadbalanceStrategyFormValidationError({
        ...buildForm(),
        auto_recovery: {
          mode: "enabled",
          status_codes: [429],
          status_code_input: "",
          cooldown: {
            base_seconds: 60,
            failure_threshold: 2,
            backoff_multiplier: 0.5,
            max_cooldown_seconds: 900,
            jitter_ratio: 0.2,
          },
          ban: {
            mode: "off",
          },
        },
      }),
    ).toBe("Backoff multiplier must be between 1 and 10");

    expect(
      getLoadbalanceStrategyFormValidationError({
        ...buildForm(),
        auto_recovery: {
          mode: "enabled",
          status_codes: [429],
          status_code_input: "",
          cooldown: {
            base_seconds: 60,
            failure_threshold: 2,
            backoff_multiplier: 2,
            max_cooldown_seconds: 100_000,
            jitter_ratio: 0.2,
          },
          ban: {
            mode: "off",
          },
        },
      }),
    ).toBe("Max open window must be between 1 and 86400 seconds");

    expect(
      getLoadbalanceStrategyFormValidationError({
        ...buildForm(),
        auto_recovery: {
          mode: "enabled",
          status_codes: [429],
          status_code_input: "",
          cooldown: {
            base_seconds: 60,
            failure_threshold: 2,
            backoff_multiplier: 2,
            max_cooldown_seconds: 900,
            jitter_ratio: 1.5,
          },
          ban: {
            mode: "off",
          },
        },
      }),
    ).toBe("Jitter ratio must be between 0 and 1");

    expect(
      getLoadbalanceStrategyFormValidationError({
        ...buildForm(),
        auto_recovery: {
          mode: "enabled",
          status_codes: [429],
          status_code_input: "",
          cooldown: {
            base_seconds: 60,
            failure_threshold: 2,
            backoff_multiplier: 2,
            max_cooldown_seconds: 900,
            jitter_ratio: 0.2,
          },
          ban: {
            mode: "temporary",
            max_cooldown_strikes_before_ban: 0,
            ban_duration_seconds: 30,
          },
        },
      }),
    ).toBe("Max open strikes before ban must be at least 1 when ban escalation is enabled");
  });
});
