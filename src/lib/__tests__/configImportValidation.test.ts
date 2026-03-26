import { describe, expect, it } from "vitest";
import type { ConfigImportRequest } from "../types";
import { ConfigImportSchema } from "../configImportValidation";

function buildImportPayload(): ConfigImportRequest {
  return {
    version: 3,
    exported_at: "2026-03-25T08:00:00Z",
    endpoints: [
      {
        name: "openai-main",
        base_url: "https://api.openai.com",
        api_key: "sk-test",
        position: 0,
      },
    ],
    pricing_templates: [],
    loadbalance_strategies: [
      {
        name: "failover-primary",
        strategy_type: "failover",
        failover_recovery_enabled: true,
      },
    ],
    models: [
      {
        provider_type: "openai",
        model_id: "gpt-4o",
        display_name: "GPT-4o",
        model_type: "native",
        redirect_to: null,
        loadbalance_strategy_name: "failover-primary",
        is_enabled: true,
        connections: [
          {
            endpoint_name: "openai-main",
            pricing_template_name: null,
            is_active: true,
            priority: 0,
            name: "Primary",
            auth_type: "openai",
            custom_headers: { "X-Org": "my-org" },
          },
        ],
      },
    ],
  };
}

describe("ConfigImportSchema", () => {
  it("accepts explicit failover policy fields on imported strategies", () => {
    const explicitPayload: ConfigImportRequest = {
      ...buildImportPayload(),
      loadbalance_strategies: [
        {
          name: "failover-primary",
          strategy_type: "failover",
          failover_recovery_enabled: true,
          failover_cooldown_seconds: 45,
          failover_failure_threshold: 4,
          failover_backoff_multiplier: 3.5,
          failover_max_cooldown_seconds: 720,
          failover_jitter_ratio: 0.35,
          failover_auth_error_cooldown_seconds: 2400,
        },
      ],
    };
    const result = ConfigImportSchema.safeParse(explicitPayload);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.loadbalance_strategies[0]).toMatchObject({
        failover_cooldown_seconds: 45,
        failover_failure_threshold: 4,
        failover_backoff_multiplier: 3.5,
        failover_max_cooldown_seconds: 720,
        failover_jitter_ratio: 0.35,
        failover_auth_error_cooldown_seconds: 2400,
      });
    }
  });

  it("keeps legacy v3 strategy payloads valid when the new fields are omitted", () => {
    const result = ConfigImportSchema.safeParse(buildImportPayload());

    expect(result.success).toBe(true);
  });
});
