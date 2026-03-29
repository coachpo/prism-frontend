import { describe, expect, it } from "vitest";
import type { ApiFamily, Vendor } from "../types";
import { ConfigImportSchema } from "../configImportValidation";

function buildAutoRecoveryEnabled(options?: {
  status_codes?: number[];
  cooldown?: Partial<{
    base_seconds: number;
    failure_threshold: number;
    backoff_multiplier: number;
    max_cooldown_seconds: number;
    jitter_ratio: number;
  }>;
  ban?:
    | { mode: "off" }
    | { mode: "manual"; max_cooldown_strikes_before_ban: number }
    | {
        mode: "temporary";
        max_cooldown_strikes_before_ban: number;
        ban_duration_seconds: number;
      };
}) {
  return {
    mode: "enabled" as const,
    status_codes: options?.status_codes ?? [503, 429],
    cooldown: {
      base_seconds: 60,
      failure_threshold: 2,
      backoff_multiplier: 2,
      max_cooldown_seconds: 900,
      jitter_ratio: 0.2,
      ...(options?.cooldown ?? {}),
    },
    ban: options?.ban ?? ({ mode: "off" } as const),
  };
}

function buildImportPayload() {
  return {
    version: 9,
    exported_at: "2026-03-25T08:00:00Z",
    vendors: [
      {
        key: "openai",
        name: "OpenAI",
        description: "OpenAI vendor",
        icon_key: "openai",
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
        auto_recovery: buildAutoRecoveryEnabled(),
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

function getIssuePairs(payload: unknown) {
  const result = ConfigImportSchema.safeParse(payload);

  expect(result.success).toBe(false);
  if (result.success) {
    throw new Error("Expected config import validation to fail");
  }

  return result.error.issues.map(({ path, message }) => ({ path, message }));
}

describe("ConfigImportSchema", () => {
  it("accepts version 9 imports and exposes vendor/api-family shared types", () => {
    const vendor: Vendor = {
      id: 1,
      key: "openai",
      name: "OpenAI",
      description: "OpenAI vendor",
      icon_key: "openai",
      audit_enabled: true,
      audit_capture_bodies: false,
      created_at: "2026-03-25T08:00:00Z",
      updated_at: "2026-03-25T08:00:00Z",
    };
    const apiFamily: ApiFamily = "openai";

    const result = ConfigImportSchema.safeParse(buildImportPayload());

    expect(vendor.key).toBe("openai");
    expect(apiFamily).toBe("openai");
    expect(result.success && result.data.vendors[0]?.icon_key).toBe("openai");
    expect(result.success).toBe(true);
  });

  it("accepts explicit null vendor icon keys in version 9 imports", () => {
    const payload = {
      ...buildImportPayload(),
      vendors: [
        {
          ...buildImportPayload().vendors[0],
          key: "groq",
          name: "Groq",
          icon_key: null,
        },
      ],
      models: [
        {
          ...buildImportPayload().models[0],
          vendor_key: "groq",
        },
      ],
    };

    const result = ConfigImportSchema.safeParse(payload);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.vendors[0]).toMatchObject({
        key: "groq",
        icon_key: null,
      });
    }
  });

  it("accepts proxy models with empty proxy_targets in version 9 imports", () => {
    const result = ConfigImportSchema.safeParse({
      ...buildImportPayload(),
      models: [
        {
          vendor_key: "openai",
          api_family: "openai",
          model_id: "gateway-proxy",
          display_name: "Gateway Proxy",
          model_type: "proxy",
          proxy_targets: [],
          loadbalance_strategy_name: null,
          is_enabled: true,
          connections: [],
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("normalizes reference names through the extracted helper module", async () => {
    const { normalizeReferenceName } = await import("../configImportValidationReferences");

    expect(normalizeReferenceName("  openai-main  ")).toBe("openai-main");
    expect(normalizeReferenceName("   ")).toBeNull();
    expect(normalizeReferenceName(null)).toBeNull();
  });

  it("accepts explicit nested auto_recovery fields on imported strategies", () => {
    const explicitPayload = {
      ...buildImportPayload(),
      loadbalance_strategies: [
        {
          name: "failover-primary",
          strategy_type: "failover",
          auto_recovery: buildAutoRecoveryEnabled({
            status_codes: [504, 429, 503],
            cooldown: {
              base_seconds: 45,
              failure_threshold: 4,
              backoff_multiplier: 3.5,
              max_cooldown_seconds: 720,
              jitter_ratio: 0.35,
            },
          }),
        },
      ],
    };
    const result = ConfigImportSchema.safeParse(explicitPayload);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.loadbalance_strategies[0]).toMatchObject({
        auto_recovery: {
          mode: "enabled",
          status_codes: [429, 503, 504],
          cooldown: {
            base_seconds: 45,
            failure_threshold: 4,
            backoff_multiplier: 3.5,
            max_cooldown_seconds: 720,
            jitter_ratio: 0.35,
          },
        },
      });
    }
  });

  it("requires explicit vendor icon_key fields on version 9 imports", () => {
    const payload = {
      ...buildImportPayload(),
      vendors: [
        {
          key: "openai",
          name: "OpenAI",
          description: "OpenAI vendor",
          audit_enabled: true,
          audit_capture_bodies: false,
        },
      ],
    };

    expect(getIssuePairs(payload)).toEqual([
      {
        path: ["vendors", 0, "icon_key"],
        message: "Invalid input: expected string, received undefined",
      },
    ]);
  });

  it("rejects legacy version 8 imports", () => {
    const payload = {
      ...buildImportPayload(),
      version: 8,
    };

    expect(getIssuePairs(payload)).toEqual([
      {
        path: ["version"],
        message: "Invalid input: expected 9",
      },
    ]);
  });

  it("requires explicit auto_recovery on version 9 strategies", () => {
    const payload = {
      ...buildImportPayload(),
      loadbalance_strategies: [
        {
          name: "failover-primary",
          strategy_type: "failover",
        },
      ],
    };

    expect(getIssuePairs(payload)).toEqual([
      {
        path: ["loadbalance_strategies", 0, "auto_recovery"],
        message: "Invalid input: expected object, received undefined",
      },
    ]);
  });

  it("rejects the removed auth cooldown field in strategy imports", () => {
    const payload = {
      ...buildImportPayload(),
      loadbalance_strategies: [
        {
          ...buildImportPayload().loadbalance_strategies[0],
          auto_recovery: {
            ...buildImportPayload().loadbalance_strategies[0].auto_recovery,
            cooldown: {
              ...buildImportPayload().loadbalance_strategies[0].auto_recovery.cooldown,
              failover_auth_error_cooldown_seconds: 2400,
            },
          },
        },
      ],
    };

    expect(getIssuePairs(payload)).toEqual([
      {
        path: ["loadbalance_strategies", 0, "auto_recovery", "cooldown"],
        message: 'Unrecognized key: "failover_auth_error_cooldown_seconds"',
      },
    ]);
  });

  it("accepts fill-first strategies in version 9 imports", () => {
    const result = ConfigImportSchema.safeParse({
      ...buildImportPayload(),
      loadbalance_strategies: [
        {
          name: "fill-first-primary",
          strategy_type: "fill-first",
          auto_recovery: buildAutoRecoveryEnabled({
            cooldown: {
              base_seconds: 45,
              failure_threshold: 4,
              backoff_multiplier: 3.5,
              max_cooldown_seconds: 720,
              jitter_ratio: 0.35,
            },
            status_codes: [503, 429],
          }),
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

  it("accepts round-robin strategies in version 9 imports", () => {
    const result = ConfigImportSchema.safeParse({
      ...buildImportPayload(),
      loadbalance_strategies: [
        {
          name: "round-robin-primary",
          strategy_type: "round-robin",
          auto_recovery: buildAutoRecoveryEnabled({
            cooldown: {
              base_seconds: 45,
              failure_threshold: 4,
              backoff_multiplier: 3.5,
              max_cooldown_seconds: 720,
              jitter_ratio: 0.35,
            },
            status_codes: [503, 429],
          }),
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
    const payload = {
      ...buildImportPayload(),
      loadbalance_strategies: [
        {
          name: "failover-primary",
          strategy_type: "failover",
          auto_recovery: buildAutoRecoveryEnabled({ status_codes: [503, 429] }),
        },
        {
          name: "  failover-primary  ",
          strategy_type: "single",
          auto_recovery: { mode: "disabled" },
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
    const payload = {
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
    const payload = {
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
