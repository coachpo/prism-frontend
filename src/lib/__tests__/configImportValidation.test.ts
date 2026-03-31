import { describe, expect, it } from "vitest";
import type { ApiFamily, Vendor } from "../types";
import { ConfigImportSchema } from "../configImportValidation";

function buildRoutingPolicy(options?: {
  circuit_breaker?: Partial<{
    failure_status_codes: number[];
    base_open_seconds: number;
    failure_threshold: number;
    backoff_multiplier: number;
    max_open_seconds: number;
    jitter_ratio: number;
    ban_mode: "off" | "manual" | "temporary";
    max_open_strikes_before_ban: number;
    ban_duration_seconds: number;
  }>;
  deadline_budget_ms?: number;
  routing_objective?: "minimize_latency" | "maximize_availability";
}) {
  return {
    kind: "adaptive" as const,
    routing_objective: options?.routing_objective ?? "minimize_latency",
    deadline_budget_ms: options?.deadline_budget_ms ?? 30000,
    hedge: {
      enabled: false,
      delay_ms: 1500,
      max_additional_attempts: 1,
    },
    circuit_breaker: {
      failure_status_codes: options?.circuit_breaker?.failure_status_codes ?? [503, 429],
      base_open_seconds: 60,
      failure_threshold: 2,
      backoff_multiplier: 2,
      max_open_seconds: 900,
      jitter_ratio: 0.2,
      ban_mode: "off" as const,
      max_open_strikes_before_ban: 0,
      ban_duration_seconds: 0,
      ...(options?.circuit_breaker ?? {}),
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
  };
}

function buildImportPayload() {
  return {
    version: 1,
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
        name: "adaptive-primary",
        routing_policy: buildRoutingPolicy(),
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
        loadbalance_strategy_name: "adaptive-primary",
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
  it("accepts the current config format and exposes vendor/api-family shared types", () => {
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

  it("accepts explicit null vendor icon keys in the current config format", () => {
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

  it("accepts proxy models with empty proxy_targets in the current config format", () => {
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

  it("accepts explicit adaptive routing_policy fields on imported strategies", () => {
    const explicitPayload = {
      ...buildImportPayload(),
      loadbalance_strategies: [
        {
          name: "adaptive-primary",
          routing_policy: buildRoutingPolicy({
            routing_objective: "maximize_availability",
            circuit_breaker: {
              failure_status_codes: [504, 429, 503],
              base_open_seconds: 45,
              failure_threshold: 4,
              backoff_multiplier: 3.5,
              max_open_seconds: 720,
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
        routing_policy: {
          kind: "adaptive",
          routing_objective: "maximize_availability",
          circuit_breaker: {
            failure_status_codes: [429, 503, 504],
            base_open_seconds: 45,
            failure_threshold: 4,
            backoff_multiplier: 3.5,
            max_open_seconds: 720,
            jitter_ratio: 0.35,
          },
        },
      });
    }
  });

  it("requires explicit vendor icon_key fields in the current config format", () => {
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

  it("rejects unsupported config versions", () => {
    const payload = {
      ...buildImportPayload(),
      version: 2,
    };

    expect(getIssuePairs(payload)).toEqual([
      {
        path: ["version"],
        message: "Invalid input: expected 1",
      },
    ]);
  });

  it("requires explicit routing_policy in the current strategy format", () => {
    const payload = {
      ...buildImportPayload(),
      loadbalance_strategies: [
        {
          name: "adaptive-primary",
        },
      ],
    };

    expect(getIssuePairs(payload)).toEqual([
      {
        path: ["loadbalance_strategies", 0, "routing_policy"],
        message: "Invalid input: expected object, received undefined",
      },
    ]);
  });

  it("rejects unrecognized cooldown fields in strategy imports", () => {
    const payload = {
      ...buildImportPayload(),
      loadbalance_strategies: [
        {
          ...buildImportPayload().loadbalance_strategies[0],
          routing_policy: {
            ...buildImportPayload().loadbalance_strategies[0].routing_policy,
            circuit_breaker: {
              ...buildImportPayload().loadbalance_strategies[0].routing_policy.circuit_breaker,
              unexpected_cooldown_seconds: 2400,
            },
          },
        },
      ],
    };

    expect(getIssuePairs(payload)).toEqual([
      {
        path: ["loadbalance_strategies", 0, "routing_policy", "circuit_breaker"],
        message: 'Unrecognized key: "unexpected_cooldown_seconds"',
      },
    ]);
  });

  it("accepts adaptive strategies with custom circuit-breaker settings in the current config format", () => {
    const result = ConfigImportSchema.safeParse({
      ...buildImportPayload(),
      loadbalance_strategies: [
        {
          name: "adaptive-availability",
          routing_policy: buildRoutingPolicy({
            routing_objective: "maximize_availability",
            circuit_breaker: {
              base_open_seconds: 45,
              failure_threshold: 4,
              backoff_multiplier: 3.5,
              max_open_seconds: 720,
              jitter_ratio: 0.35,
              failure_status_codes: [503, 429],
            },
          }),
        },
      ],
      models: [
        {
          ...buildImportPayload().models[0],
          loadbalance_strategy_name: "adaptive-availability",
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects legacy strategy_type fields in the current config format", () => {
    expect(getIssuePairs({
      ...buildImportPayload(),
      loadbalance_strategies: [
        {
          name: "legacy-round-robin",
          strategy_type: "round-robin",
          routing_policy: buildRoutingPolicy(),
        },
      ],
    })).toEqual([
      {
        path: ["loadbalance_strategies", 0],
        message: 'Unrecognized key: "strategy_type"',
      },
    ]);
  });

  it("reports duplicate strategy names by exact issue path and message", () => {
    const payload = {
      ...buildImportPayload(),
      loadbalance_strategies: [
        {
          name: "adaptive-primary",
          routing_policy: buildRoutingPolicy({
            circuit_breaker: { failure_status_codes: [503, 429] },
          }),
        },
        {
          name: "  adaptive-primary  ",
          routing_policy: buildRoutingPolicy({
            routing_objective: "maximize_availability",
          }),
        },
      ],
    };

    expect(getIssuePairs(payload)).toEqual([
      {
        path: ["loadbalance_strategies", 1, "name"],
        message: "Duplicate loadbalance strategy name 'adaptive-primary'",
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
