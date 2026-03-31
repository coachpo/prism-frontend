import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("management api compatibility", () => {
  it("normalizes loadbalance strategy responses around routing_policy", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify([
            {
              id: 12,
              profile_id: 3,
              name: "adaptive-primary",
              routing_policy: {
                kind: "adaptive",
                circuit_breaker: {
                  failure_status_codes: [503, 429],
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
              attached_model_count: 2,
              created_at: "2026-03-25T08:00:00Z",
              updated_at: "2026-03-25T08:05:00Z",
            },
          ]),
          { status: 200 },
        ),
      ),
    );

    const { loadbalanceStrategies } = await import("../api/management");

    await expect(loadbalanceStrategies.list()).resolves.toEqual([
      {
        id: 12,
        profile_id: 3,
        name: "adaptive-primary",
        routing_policy: {
          kind: "adaptive",
          routing_objective: "minimize_latency",
          deadline_budget_ms: 30000,
          hedge: {
            enabled: false,
            delay_ms: 1500,
            max_additional_attempts: 1,
          },
          circuit_breaker: {
            failure_status_codes: [429, 503],
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
        attached_model_count: 2,
        created_at: "2026-03-25T08:00:00Z",
        updated_at: "2026-03-25T08:05:00Z",
      },
    ]);
  });

  it("normalizes nested model strategy summaries around routing_policy", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: 1,
            model_id: "gpt-5.4-mini",
            display_name: "GPT-5.4 Mini",
            model_type: "native",
            proxy_targets: [],
            loadbalance_strategy_id: 12,
            loadbalance_strategy: {
              id: 12,
              name: "adaptive-primary",
              routing_policy: {
                kind: "adaptive",
                routing_objective: "maximize_availability",
              },
            },
            is_enabled: true,
            connections: [],
            created_at: "2026-03-25T08:00:00Z",
            updated_at: "2026-03-25T08:05:00Z",
          }),
          { status: 200 },
        ),
      ),
    );

    const { models } = await import("../api/management");

    const model = await models.get(1);

    expect(model.loadbalance_strategy).toEqual({
      id: 12,
      name: "adaptive-primary",
      routing_policy: {
        kind: "adaptive",
        routing_objective: "maximize_availability",
        deadline_budget_ms: 30000,
        hedge: {
          enabled: false,
          delay_ms: 1500,
          max_additional_attempts: 1,
        },
        circuit_breaker: {
          failure_status_codes: [403, 422, 429, 500, 502, 503, 504, 529],
          base_open_seconds: 60,
          failure_threshold: 2,
          backoff_multiplier: 2,
          max_open_seconds: 900,
          jitter_ratio: 0.2,
          ban_mode: "off",
          max_open_strikes_before_ban: 0,
          ban_duration_seconds: 0,
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
    });
  });
});
