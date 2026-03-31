import { describe, expect, it } from "vitest";
import type { LoadbalanceStrategy } from "@/lib/types";
import {
  DEFAULT_LOADBALANCE_STRATEGY_FORM,
  getDefaultRoutingPolicyDraft,
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
    name: "adaptive-primary",
    routing_policy: getDefaultRoutingPolicyDraft(),
    ...overrides,
  };
}

describe("loadbalanceStrategyFormState", () => {
  it("starts new strategies with an adaptive routing policy draft", () => {
    expect(DEFAULT_LOADBALANCE_STRATEGY_FORM).toMatchObject({
      name: "",
      routing_policy: {
        kind: "adaptive",
        routing_objective: "minimize_latency",
        circuit_breaker: {
          failure_status_codes: [403, 422, 429, 500, 502, 503, 504, 529],
          status_code_input: "",
        },
      },
    });
  });

  it("hydrates the routing_policy draft from an existing strategy", () => {
    const strategy: LoadbalanceStrategy = {
      id: 12,
      profile_id: 3,
      name: "Adaptive availability",
      routing_policy: {
        kind: "adaptive",
        routing_objective: "maximize_availability",
        deadline_budget_ms: 45000,
        hedge: {
          enabled: false,
          delay_ms: 1500,
          max_additional_attempts: 1,
        },
        circuit_breaker: {
          failure_status_codes: [503, 429, 503],
          base_open_seconds: 45,
          failure_threshold: 4,
          backoff_multiplier: 3.5,
          max_open_seconds: 720,
          jitter_ratio: 0.35,
          ban_mode: "temporary",
          max_open_strikes_before_ban: 3,
          ban_duration_seconds: 1800,
        },
        admission: {
          respect_qps_limit: true,
          respect_in_flight_limits: true,
        },
        monitoring: {
          enabled: true,
          stale_after_seconds: 300,
          endpoint_ping_weight: 1,
          conversation_delay_weight: 1,
          failure_penalty_weight: 2,
        },
      },
      attached_model_count: 4,
      created_at: "2026-03-25T08:00:00Z",
      updated_at: "2026-03-25T08:00:00Z",
    };

    expect(loadbalanceStrategyFormStateFromStrategy(strategy)).toMatchObject({
      name: "Adaptive availability",
      routing_policy: {
        kind: "adaptive",
        routing_objective: "maximize_availability",
        circuit_breaker: {
          failure_status_codes: [429, 503],
          status_code_input: "",
          base_open_seconds: 45,
          failure_threshold: 4,
          backoff_multiplier: 3.5,
          max_open_seconds: 720,
          jitter_ratio: 0.35,
          ban_mode: "temporary",
          max_open_strikes_before_ban: 3,
          ban_duration_seconds: 1800,
        },
      },
    });
  });

  it("trims the name, sorts status codes uniquely, and preserves nested routing policy values", () => {
    expect(
      toLoadbalanceStrategyPayload({
        ...buildForm(),
        name: "  Adaptive availability  ",
        routing_policy: {
          ...getDefaultRoutingPolicyDraft(),
          routing_objective: "maximize_availability",
          circuit_breaker: {
            ...getDefaultRoutingPolicyDraft().circuit_breaker,
            failure_status_codes: [503, 429, 503, 504],
            base_open_seconds: 120.9,
            failure_threshold: 5.2,
            backoff_multiplier: 4,
            max_open_seconds: 1800.6,
            jitter_ratio: 0.4,
            ban_mode: "manual",
            max_open_strikes_before_ban: 4.7,
            ban_duration_seconds: 9,
          },
        },
      }),
    ).toMatchObject({
      name: "Adaptive availability",
      routing_policy: {
        kind: "adaptive",
        routing_objective: "maximize_availability",
        circuit_breaker: {
          failure_status_codes: [429, 503, 504],
          base_open_seconds: 120,
          failure_threshold: 5,
          backoff_multiplier: 4,
          max_open_seconds: 1800,
          jitter_ratio: 0.4,
          ban_mode: "manual",
          max_open_strikes_before_ban: 4,
          ban_duration_seconds: 0,
        },
      },
    });
  });

  it("rejects invalid failure status code lists and out-of-range policy values before save", () => {
    expect(
      getLoadbalanceStrategyFormValidationError({
        ...buildForm(),
        routing_policy: {
          ...getDefaultRoutingPolicyDraft(),
          circuit_breaker: {
            ...getDefaultRoutingPolicyDraft().circuit_breaker,
            failure_status_codes: [],
          },
        },
      }),
    ).toBe("Add at least one failure status code");

    expect(
      getLoadbalanceStrategyFormValidationError({
        ...buildForm(),
        routing_policy: {
          ...getDefaultRoutingPolicyDraft(),
          circuit_breaker: {
            ...getDefaultRoutingPolicyDraft().circuit_breaker,
            failure_status_codes: [429, 429],
          },
        },
      }),
    ).toBe("Failure status codes must be unique");

    expect(
      getLoadbalanceStrategyFormValidationError({
        ...buildForm(),
        routing_policy: {
          ...getDefaultRoutingPolicyDraft(),
          circuit_breaker: {
            ...getDefaultRoutingPolicyDraft().circuit_breaker,
            failure_status_codes: [99, 429],
          },
        },
      }),
    ).toBe("Failure status codes must be valid HTTP status codes between 100 and 599");

    expect(
      getLoadbalanceStrategyFormValidationError({
        ...buildForm(),
        routing_policy: {
          ...getDefaultRoutingPolicyDraft(),
          circuit_breaker: {
            ...getDefaultRoutingPolicyDraft().circuit_breaker,
            base_open_seconds: 1.5,
          },
        },
      }),
    ).toBe("Base open window must be a whole number of seconds");

    expect(
      getLoadbalanceStrategyFormValidationError({
        ...buildForm(),
        routing_policy: {
          ...getDefaultRoutingPolicyDraft(),
          circuit_breaker: {
            ...getDefaultRoutingPolicyDraft().circuit_breaker,
            failure_threshold: 51,
          },
        },
      }),
    ).toBe("Failure threshold must be between 1 and 50");

    expect(
      getLoadbalanceStrategyFormValidationError({
        ...buildForm(),
        routing_policy: {
          ...getDefaultRoutingPolicyDraft(),
          circuit_breaker: {
            ...getDefaultRoutingPolicyDraft().circuit_breaker,
            backoff_multiplier: 0.5,
          },
        },
      }),
    ).toBe("Backoff multiplier must be between 1 and 10");

    expect(
      getLoadbalanceStrategyFormValidationError({
        ...buildForm(),
        routing_policy: {
          ...getDefaultRoutingPolicyDraft(),
          circuit_breaker: {
            ...getDefaultRoutingPolicyDraft().circuit_breaker,
            max_open_seconds: 100_000,
          },
        },
      }),
    ).toBe("Max open window must be between 1 and 86400 seconds");

    expect(
      getLoadbalanceStrategyFormValidationError({
        ...buildForm(),
        routing_policy: {
          ...getDefaultRoutingPolicyDraft(),
          circuit_breaker: {
            ...getDefaultRoutingPolicyDraft().circuit_breaker,
            jitter_ratio: 1.5,
          },
        },
      }),
    ).toBe("Jitter ratio must be between 0 and 1");

    expect(
      getLoadbalanceStrategyFormValidationError({
        ...buildForm(),
        routing_policy: {
          ...getDefaultRoutingPolicyDraft(),
          circuit_breaker: {
            ...getDefaultRoutingPolicyDraft().circuit_breaker,
            ban_mode: "temporary",
            max_open_strikes_before_ban: 0,
            ban_duration_seconds: 30,
          },
        },
      }),
    ).toBe("Max open strikes before ban must be at least 1 when ban escalation is enabled");
  });
});
