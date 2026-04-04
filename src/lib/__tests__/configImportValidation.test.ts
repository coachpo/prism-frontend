import { describe, expect, it } from "vitest";
import type { ApiFamily, Vendor } from "../types";
import { ConfigImportSchema } from "../configImportValidation";

function buildAutoRecoveryDisabled() {
  return {
    mode: "disabled" as const,
  };
}

function buildAutoRecoveryEnabled(options?: {
  ban?:
    | {
        mode: "off";
        max_cooldown_strikes_before_ban?: number;
        ban_duration_seconds?: number;
      }
    | {
        mode: "manual";
        max_cooldown_strikes_before_ban: number;
      }
    | {
        mode: "temporary";
        max_cooldown_strikes_before_ban: number;
        ban_duration_seconds: number;
      };
  cooldown?: Partial<{
    base_seconds: number;
    failure_threshold: number;
    backoff_multiplier: number;
    max_cooldown_seconds: number;
    jitter_ratio: number;
  }>;
  status_codes?: number[];
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
    ban:
      options?.ban ??
      {
        mode: "off" as const,
        max_cooldown_strikes_before_ban: 0,
        ban_duration_seconds: 0,
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
        name: "single-primary",
        strategy_type: "legacy" as const,
        legacy_strategy_type: "single" as const,
        auto_recovery: buildAutoRecoveryDisabled(),
      },
    ],
    models: [
      {
        vendor_key: "openai",
        api_family: "openai" as const,
        model_id: "gpt-4o",
        display_name: "GPT-4o",
        model_type: "native" as const,
        proxy_targets: [],
        loadbalance_strategy_name: "single-primary",
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
            openai_probe_endpoint_variant: "responses_minimal",
          },
        ],
      },
    ],
  };
}

function buildAdaptiveRoutingPolicy(overrides: Record<string, unknown> = {}) {
  return {
    kind: "adaptive",
    routing_objective: "minimize_latency",
    deadline_budget_ms: 1500,
    hedge: {
      enabled: false,
      delay_ms: 75,
      max_additional_attempts: 1,
    },
    circuit_breaker: {
      failure_status_codes: [429, 503, 504],
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
      stale_after_seconds: 30,
      endpoint_ping_weight: 0.4,
      conversation_delay_weight: 0.35,
      failure_penalty_weight: 0.25,
    },
    ...overrides,
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
  it("accepts the legacy config format and exposes vendor/api-family shared types", () => {
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

  it("accepts explicit null vendor icon keys in the legacy config format", () => {
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

  it("accepts proxy models with empty proxy_targets in the legacy config format", () => {
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

  it("accepts non-default OpenAI probe presets in imported connections", () => {
    const result = ConfigImportSchema.safeParse({
      ...buildImportPayload(),
      models: [
        {
          ...buildImportPayload().models[0],
          connections: [
            {
              ...buildImportPayload().models[0].connections[0],
              openai_probe_endpoint_variant: "chat_completions_reasoning_none",
            },
          ],
        },
      ],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.models[0]?.connections[0]?.openai_probe_endpoint_variant).toBe(
        "chat_completions_reasoning_none",
      );
    }
  });

  it("normalizes reference names through the extracted helper module", async () => {
    const { normalizeReferenceName } = await import("../configImportValidationReferences");

    expect(normalizeReferenceName("  openai-main  ")).toBe("openai-main");
    expect(normalizeReferenceName("   ")).toBeNull();
    expect(normalizeReferenceName(null)).toBeNull();
  });

  it("accepts legacy round-robin strategies with enabled auto_recovery settings", () => {
    const result = ConfigImportSchema.safeParse({
      ...buildImportPayload(),
      loadbalance_strategies: [
        {
          name: "legacy-round-robin",
          strategy_type: "legacy",
          legacy_strategy_type: "round-robin",
          auto_recovery: buildAutoRecoveryEnabled({
            status_codes: [504, 429, 503],
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
          }),
        },
      ],
      models: [
        {
          ...buildImportPayload().models[0],
          loadbalance_strategy_name: "legacy-round-robin",
        },
      ],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.loadbalance_strategies[0]).toMatchObject({
        strategy_type: "legacy",
        legacy_strategy_type: "round-robin",
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
          ban: {
            mode: "temporary",
            max_cooldown_strikes_before_ban: 3,
            ban_duration_seconds: 1800,
          },
        },
      });
    }
  });

  it("requires explicit vendor icon_key fields in the legacy config format", () => {
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

  it("requires explicit family-specific legacy fields in the merged strategy format", () => {
    const payload = {
      ...buildImportPayload(),
      loadbalance_strategies: [
        {
          name: "single-primary",
          strategy_type: "legacy",
        },
      ],
    };

    expect(getIssuePairs(payload)).toEqual([
      {
        path: ["loadbalance_strategies", 0, "legacy_strategy_type"],
        message: 'Invalid option: expected one of "single"|"fill-first"|"round-robin"',
      },
      {
        path: ["loadbalance_strategies", 0, "auto_recovery"],
        message: "Invalid input",
      },
    ]);
  });

  it("accepts adaptive routing_policy imports for minimize_latency", () => {
    const result = ConfigImportSchema.safeParse({
      ...buildImportPayload(),
      loadbalance_strategies: [
        {
          name: "adaptive-primary",
          strategy_type: "adaptive",
          routing_policy: buildAdaptiveRoutingPolicy(),
        },
      ],
      models: [
        {
          ...buildImportPayload().models[0],
          loadbalance_strategy_name: "adaptive-primary",
        },
      ],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.loadbalance_strategies[0]).toMatchObject({
        name: "adaptive-primary",
        strategy_type: "adaptive",
        routing_policy: buildAdaptiveRoutingPolicy(),
      });
    }
  });

  it("accepts the exact backend-exported family-null and off-ban shape", () => {
    const result = ConfigImportSchema.safeParse({
      ...buildImportPayload(),
      loadbalance_strategies: [
        {
          name: "Default adaptive routing",
          strategy_type: "adaptive",
          legacy_strategy_type: null,
          auto_recovery: null,
          routing_policy: buildAdaptiveRoutingPolicy({
            deadline_budget_ms: 30000,
            hedge: {
              enabled: false,
              delay_ms: 1500,
              max_additional_attempts: 1,
            },
            monitoring: {
              enabled: true,
              stale_after_seconds: 300,
              endpoint_ping_weight: 1,
              conversation_delay_weight: 1,
              failure_penalty_weight: 2,
            },
          }),
        },
        {
          name: "Default legacy routing",
          strategy_type: "legacy",
          legacy_strategy_type: "round-robin",
          auto_recovery: buildAutoRecoveryEnabled({
            status_codes: [403, 422, 429, 500, 502, 503, 504, 529],
            ban: {
              mode: "off",
              max_cooldown_strikes_before_ban: 0,
              ban_duration_seconds: 0,
            },
          }),
          routing_policy: null,
        },
      ],
      models: [
        {
          ...buildImportPayload().models[0],
          loadbalance_strategy_name: "Default adaptive routing",
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects non-null family crossover fields on exported strategies", () => {
    expect(
      getIssuePairs({
        ...buildImportPayload(),
        loadbalance_strategies: [
          {
            name: "bad-adaptive",
            strategy_type: "adaptive",
            legacy_strategy_type: "single",
            auto_recovery: null,
            routing_policy: buildAdaptiveRoutingPolicy(),
          },
        ],
        models: [
          {
            ...buildImportPayload().models[0],
            loadbalance_strategy_name: "bad-adaptive",
          },
        ],
      }),
    ).toEqual([
      {
        path: ["loadbalance_strategies", 0, "legacy_strategy_type"],
        message: "Invalid input: expected null, received string",
      },
    ]);

    expect(
      getIssuePairs({
        ...buildImportPayload(),
        loadbalance_strategies: [
          {
            name: "bad-legacy",
            strategy_type: "legacy",
            legacy_strategy_type: "single",
            auto_recovery: buildAutoRecoveryDisabled(),
            routing_policy: buildAdaptiveRoutingPolicy(),
          },
        ],
        models: [
          {
            ...buildImportPayload().models[0],
            loadbalance_strategy_name: "bad-legacy",
          },
        ],
      }),
    ).toEqual([
      {
        path: ["loadbalance_strategies", 0, "routing_policy"],
        message: "Invalid input: expected null, received object",
      },
    ]);
  });

  it("validates adaptive circuit breaker ban semantics by ban_mode", () => {
    const manualResult = ConfigImportSchema.safeParse({
      ...buildImportPayload(),
      loadbalance_strategies: [
        {
          name: "adaptive-manual",
          strategy_type: "adaptive",
          routing_policy: buildAdaptiveRoutingPolicy({
            circuit_breaker: {
              ...buildAdaptiveRoutingPolicy().circuit_breaker,
              ban_mode: "manual",
              max_open_strikes_before_ban: 2,
              ban_duration_seconds: 0,
            },
          }),
        },
      ],
      models: [
        {
          ...buildImportPayload().models[0],
          loadbalance_strategy_name: "adaptive-manual",
        },
      ],
    });

    expect(manualResult.success).toBe(true);

    const temporaryResult = ConfigImportSchema.safeParse({
      ...buildImportPayload(),
      loadbalance_strategies: [
        {
          name: "adaptive-temporary",
          strategy_type: "adaptive",
          routing_policy: buildAdaptiveRoutingPolicy({
            circuit_breaker: {
              ...buildAdaptiveRoutingPolicy().circuit_breaker,
              ban_mode: "temporary",
              max_open_strikes_before_ban: 2,
              ban_duration_seconds: 120,
            },
          }),
        },
      ],
      models: [
        {
          ...buildImportPayload().models[0],
          loadbalance_strategy_name: "adaptive-temporary",
        },
      ],
    });

    expect(temporaryResult.success).toBe(true);

    const payload = {
      ...buildImportPayload(),
      loadbalance_strategies: [
        {
          name: "adaptive-invalid",
          strategy_type: "adaptive",
          routing_policy: buildAdaptiveRoutingPolicy({
            circuit_breaker: {
              ...buildAdaptiveRoutingPolicy().circuit_breaker,
              ban_mode: "off",
              max_open_strikes_before_ban: 3,
              ban_duration_seconds: 1800,
            },
          }),
        },
      ],
      models: [
        {
          ...buildImportPayload().models[0],
          loadbalance_strategy_name: "adaptive-invalid",
        },
      ],
    };

    expect(getIssuePairs(payload)).toEqual([
      {
        path: ["loadbalance_strategies", 0, "routing_policy", "circuit_breaker", "max_open_strikes_before_ban"],
        message: "ban_mode 'off' requires max_open_strikes_before_ban = 0",
      },
      {
        path: ["loadbalance_strategies", 0, "routing_policy", "circuit_breaker", "ban_duration_seconds"],
        message: "ban_mode 'off' requires ban_duration_seconds = 0",
      },
    ]);
  });

  it("rejects adaptive strategies that omit routing_policy", () => {
    const payload = {
      ...buildImportPayload(),
      loadbalance_strategies: [
        {
          name: "adaptive-primary",
          strategy_type: "adaptive",
        },
      ],
      models: [
        {
          ...buildImportPayload().models[0],
          loadbalance_strategy_name: "adaptive-primary",
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

  it("accepts legacy single strategies that enable failover recovery", () => {
    const result = ConfigImportSchema.safeParse({
      ...buildImportPayload(),
      loadbalance_strategies: [
        {
          name: "single-with-recovery",
          strategy_type: "legacy",
          legacy_strategy_type: "single",
          auto_recovery: buildAutoRecoveryEnabled(),
        },
      ],
      models: [
        {
          ...buildImportPayload().models[0],
          loadbalance_strategy_name: "single-with-recovery",
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
          name: "single-primary",
          strategy_type: "legacy",
          legacy_strategy_type: "single",
          auto_recovery: buildAutoRecoveryDisabled(),
        },
        {
          name: "  single-primary  ",
          strategy_type: "legacy",
          legacy_strategy_type: "fill-first",
          auto_recovery: buildAutoRecoveryEnabled(),
        },
      ],
    };

    expect(getIssuePairs(payload)).toEqual([
      {
        path: ["loadbalance_strategies", 1, "name"],
        message: "Duplicate loadbalance strategy name 'single-primary'",
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
