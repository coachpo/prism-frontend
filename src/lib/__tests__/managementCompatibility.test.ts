import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("management api compatibility", () => {
  it("normalizes loadbalance strategy responses that only expose routing_policy", async () => {
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
        strategy_type: "failover",
        auto_recovery: {
          mode: "enabled",
          status_codes: [429, 503],
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
        updated_at: "2026-03-25T08:05:00Z",
      },
    ]);
  });

  it("normalizes nested model strategy summaries that only expose routing_policy", async () => {
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
                legacy_strategy_type: "fill-first",
                legacy_auto_recovery: { mode: "disabled" },
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
      strategy_type: "fill-first",
      auto_recovery: { mode: "disabled" },
    });
  });
});
