import { describe, expect, it } from "vitest";
import type { ApiFamily, ConfigImportRequest, Vendor } from "../types";
import { ConfigImportSchema } from "../configImportValidation";

function buildImportPayload(): ConfigImportRequest {
  return {
    version: 6,
    exported_at: "2026-03-25T08:00:00Z",
    vendors: [
      {
        key: "openai",
        name: "OpenAI",
        description: "OpenAI vendor",
        audit_enabled: true,
        audit_capture_bodies: false,
      },
    ],
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
        vendor_key: "openai",
        api_family: "openai",
        model_id: "gpt-4o",
        display_name: "GPT-4o",
        model_type: "native",
        proxy_targets: [],
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

function getIssuePairs(payload: ConfigImportRequest) {
  const result = ConfigImportSchema.safeParse(payload);

  expect(result.success).toBe(false);
  if (result.success) {
    throw new Error("Expected config import validation to fail");
  }

  return result.error.issues.map(({ path, message }) => ({ path, message }));
}

describe("ConfigImportSchema", () => {
  it("accepts version 6 imports and exposes vendor/api-family shared types", () => {
    const vendor: Vendor = {
      id: 1,
      key: "openai",
      name: "OpenAI",
      description: "OpenAI vendor",
      audit_enabled: true,
      audit_capture_bodies: false,
      created_at: "2026-03-25T08:00:00Z",
      updated_at: "2026-03-25T08:00:00Z",
    };
    const apiFamily: ApiFamily = "openai";

    const result = ConfigImportSchema.safeParse(buildImportPayload());

    expect(vendor.key).toBe("openai");
    expect(apiFamily).toBe("openai");
    expect(result.success).toBe(true);
  });

  it("normalizes reference names through the extracted helper module", async () => {
    const { normalizeReferenceName } = await import("../configImportValidationReferences");

    expect(normalizeReferenceName("  openai-main  ")).toBe("openai-main");
    expect(normalizeReferenceName("   ")).toBeNull();
    expect(normalizeReferenceName(null)).toBeNull();
  });

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

  it("keeps version 6 strategy payloads valid when the new fields are omitted", () => {
    const result = ConfigImportSchema.safeParse(buildImportPayload());

    expect(result.success).toBe(true);
  });

  it("accepts fill-first strategies in version 6 imports", () => {
    const result = ConfigImportSchema.safeParse({
      ...buildImportPayload(),
      loadbalance_strategies: [
        {
          name: "fill-first-primary",
          strategy_type: "fill-first",
          failover_recovery_enabled: true,
          failover_cooldown_seconds: 45,
          failover_failure_threshold: 4,
          failover_backoff_multiplier: 3.5,
          failover_max_cooldown_seconds: 720,
          failover_jitter_ratio: 0.35,
          failover_auth_error_cooldown_seconds: 2400,
        },
      ],
      models: [
        {
          ...buildImportPayload().models[0],
          loadbalance_strategy_name: "fill-first-primary",
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("accepts round-robin strategies in version 6 imports", () => {
    const result = ConfigImportSchema.safeParse({
      ...buildImportPayload(),
      loadbalance_strategies: [
        {
          name: "round-robin-primary",
          strategy_type: "round-robin",
          failover_recovery_enabled: true,
          failover_cooldown_seconds: 45,
          failover_failure_threshold: 4,
          failover_backoff_multiplier: 3.5,
          failover_max_cooldown_seconds: 720,
          failover_jitter_ratio: 0.35,
          failover_auth_error_cooldown_seconds: 2400,
        },
      ],
      models: [
        {
          ...buildImportPayload().models[0],
          loadbalance_strategy_name: "round-robin-primary",
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("reports duplicate strategy names by exact issue path and message", () => {
    const payload: ConfigImportRequest = {
      ...buildImportPayload(),
      loadbalance_strategies: [
        {
          name: "failover-primary",
          strategy_type: "failover",
          failover_recovery_enabled: true,
        },
        {
          name: "  failover-primary  ",
          strategy_type: "single",
          failover_recovery_enabled: false,
        },
      ],
    };

    expect(getIssuePairs(payload)).toEqual([
      {
        path: ["loadbalance_strategies", 1, "name"],
        message: "Duplicate loadbalance strategy name 'failover-primary'",
      },
    ]);
  });

  it("reports unknown references by exact issue path and message", () => {
    const payload: ConfigImportRequest = {
      ...buildImportPayload(),
      pricing_templates: [
        {
          name: "template-a",
          description: null,
          pricing_unit: "PER_1M",
          pricing_currency_code: "USD",
          input_price: "1.00",
          output_price: "2.00",
          cached_input_price: null,
          cache_creation_price: null,
          reasoning_price: null,
          missing_special_token_price_policy: "MAP_TO_OUTPUT",
          version: 1,
        },
      ],
      models: [
        {
          ...buildImportPayload().models[0],
          loadbalance_strategy_name: "missing-strategy",
          connections: [
            {
              ...buildImportPayload().models[0].connections[0],
              pricing_template_name: "missing-template",
            },
          ],
        },
      ],
    };

    expect(getIssuePairs(payload)).toEqual([
      {
        path: ["models", 0, "loadbalance_strategy_name"],
        message: "Unknown loadbalance strategy 'missing-strategy' in import payload",
      },
      {
        path: ["models", 0, "connections", 0, "pricing_template_name"],
        message: "Unknown pricing_template_name 'missing-template' in import payload",
      },
    ]);
  });

  it("reports FX mapping errors by exact issue path and message", () => {
    const payload: ConfigImportRequest = {
      ...buildImportPayload(),
      user_settings: {
        endpoint_fx_mappings: [
          {
            model_id: "gpt-4o",
            endpoint_name: "openai-main",
            fx_rate: "7.10",
          },
          {
            model_id: "gpt-4o",
            endpoint_name: "openai-main",
            fx_rate: "7.20",
          },
          {
            model_id: "gpt-4.1",
            endpoint_name: "openai-main",
            fx_rate: "7.30",
          },
        ],
      },
    };

    expect(getIssuePairs(payload)).toEqual([
      {
        path: ["user_settings", "endpoint_fx_mappings", 1],
        message: "Duplicate FX mapping for model_id='gpt-4o', endpoint_name='openai-main'",
      },
      {
        path: ["user_settings", "endpoint_fx_mappings", 2],
        message:
          "FX mapping must reference an imported model/endpoint pair: model_id='gpt-4.1', endpoint_name='openai-main'",
      },
    ]);
  });
});
