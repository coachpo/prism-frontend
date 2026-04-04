import { z } from "zod";
import { getStaticMessages } from "@/i18n/staticMessages";
import {
  addCustomIssue,
  collectNamedReferences,
  normalizeReferenceName,
  resolveOptionalReferenceName,
  resolveRequiredReferenceName,
} from "./configImportValidationReferences";

const EndpointImportSchema = z.strictObject({
  name: z.string(),
  base_url: z.string(),
  api_key: z.string(),
  position: z.number().int().min(0).nullable().optional(),
});

const PricingTemplateImportSchema = z.strictObject({
  name: z.string(),
  description: z.string().nullable(),
  pricing_unit: z.literal("PER_1M"),
  pricing_currency_code: z.string(),
  input_price: z.string(),
  output_price: z.string(),
  cached_input_price: z.string().nullable(),
  cache_creation_price: z.string().nullable(),
  reasoning_price: z.string().nullable(),
  missing_special_token_price_policy: z.enum(["MAP_TO_OUTPUT", "ZERO_COST"]),
  version: z.number().int().min(1),
});

const FailureStatusCodesImportSchema = z
  .array(z.number().int().min(100).max(599))
  .min(1)
  .superRefine((codes, ctx) => {
    if (new Set(codes).size !== codes.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: getStaticMessages().settingsBackupValidation.statusCodesUnique,
      });
    }
  })
  .transform((codes) => [...codes].sort((left, right) => left - right));

const AutoRecoveryCooldownImportSchema = z.strictObject({
  base_seconds: z.number().int().min(0),
  failure_threshold: z.number().int().min(1).max(50),
  backoff_multiplier: z.number().min(1).max(10),
  max_cooldown_seconds: z.number().int().min(1).max(86_400),
  jitter_ratio: z.number().min(0).max(1),
});

const AutoRecoveryBanImportSchema = z.union([
  z.strictObject({
    mode: z.literal("off"),
    max_cooldown_strikes_before_ban: z.literal(0).optional(),
    ban_duration_seconds: z.literal(0).optional(),
  }),
  z.strictObject({
    mode: z.literal("manual"),
    max_cooldown_strikes_before_ban: z.number().int().min(1).max(100),
    ban_duration_seconds: z.literal(0).optional(),
  }),
  z.strictObject({
    mode: z.literal("temporary"),
    max_cooldown_strikes_before_ban: z.number().int().min(1).max(100),
    ban_duration_seconds: z.number().int().min(1).max(86_400),
  }),
]);

const AutoRecoveryImportSchema = z.union([
  z.strictObject({
    mode: z.literal("disabled"),
  }),
  z.strictObject({
    mode: z.literal("enabled"),
    status_codes: FailureStatusCodesImportSchema,
    cooldown: AutoRecoveryCooldownImportSchema,
    ban: AutoRecoveryBanImportSchema,
  }),
]);

const AdaptiveCircuitBreakerImportSchema = z
  .strictObject({
    failure_status_codes: FailureStatusCodesImportSchema,
    base_open_seconds: z.number().min(0),
    failure_threshold: z.number().int().min(1),
    backoff_multiplier: z.number().min(1),
    max_open_seconds: z.number().int().min(1),
    jitter_ratio: z.number().min(0).max(1),
    ban_mode: z.enum(["off", "temporary", "manual"]),
    max_open_strikes_before_ban: z.number().int().min(0),
    ban_duration_seconds: z.number().int().min(0),
  })
  .superRefine((value, ctx) => {
    if (value.ban_mode === "off") {
      if (value.max_open_strikes_before_ban !== 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["max_open_strikes_before_ban"],
          message: "ban_mode 'off' requires max_open_strikes_before_ban = 0",
        });
      }
      if (value.ban_duration_seconds !== 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ban_duration_seconds"],
          message: "ban_mode 'off' requires ban_duration_seconds = 0",
        });
      }
      return;
    }

    if (value.max_open_strikes_before_ban < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["max_open_strikes_before_ban"],
        message: `ban_mode '${value.ban_mode}' requires max_open_strikes_before_ban >= 1`,
      });
    }

    if (value.ban_mode === "manual") {
      if (value.ban_duration_seconds !== 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ban_duration_seconds"],
          message: "ban_mode 'manual' requires ban_duration_seconds = 0",
        });
      }
      return;
    }

    if (value.ban_duration_seconds < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ban_duration_seconds"],
        message: "ban_mode 'temporary' requires ban_duration_seconds >= 1",
      });
    }
  });

const AdaptiveRoutingPolicyImportSchema = z.strictObject({
  kind: z.literal("adaptive"),
  routing_objective: z.enum(["maximize_availability", "minimize_latency"]),
  deadline_budget_ms: z.number().int().min(1),
  hedge: z.strictObject({
    enabled: z.boolean(),
    delay_ms: z.number().int().min(0),
    max_additional_attempts: z.number().int().min(0),
  }),
  circuit_breaker: AdaptiveCircuitBreakerImportSchema,
  admission: z.strictObject({
    respect_qps_limit: z.boolean(),
    respect_in_flight_limits: z.boolean(),
  }),
  monitoring: z.strictObject({
    enabled: z.boolean(),
    stale_after_seconds: z.number().int().min(1),
    endpoint_ping_weight: z.number().min(0),
    conversation_delay_weight: z.number().min(0),
    failure_penalty_weight: z.number().min(0),
  }),
});

const LoadbalanceStrategyImportSchema = z.discriminatedUnion("strategy_type", [
  z.strictObject({
    name: z.string(),
    strategy_type: z.literal("legacy"),
    legacy_strategy_type: z.enum(["single", "fill-first", "round-robin"]),
    auto_recovery: AutoRecoveryImportSchema,
    routing_policy: z.null().optional(),
  }),
  z.strictObject({
    name: z.string(),
    strategy_type: z.literal("adaptive"),
    routing_policy: AdaptiveRoutingPolicyImportSchema,
    legacy_strategy_type: z.null().optional(),
    auto_recovery: z.null().optional(),
  }),
]);

const VendorImportSchema = z.strictObject({
  key: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  icon_key: z.string().nullable(),
  audit_enabled: z.boolean(),
  audit_capture_bodies: z.boolean(),
});

const ConnectionImportSchema = z.strictObject({
  endpoint_name: z.string(),
  pricing_template_name: z.string().nullable().optional(),
  is_active: z.boolean(),
  priority: z.number().int().min(0),
  name: z.string().nullable(),
  auth_type: z.string().nullable(),
  custom_headers: z.record(z.string(), z.string()).nullable(),
  openai_probe_endpoint_variant: z
    .enum([
      "responses_minimal",
      "responses_reasoning_none",
      "chat_completions_minimal",
      "chat_completions_reasoning_none",
    ])
    .optional(),
  qps_limit: z.number().int().min(1).nullable().optional(),
  max_in_flight_non_stream: z.number().int().min(1).nullable().optional(),
  max_in_flight_stream: z.number().int().min(1).nullable().optional(),
});

const ProxyTargetImportSchema = z.strictObject({
  target_model_id: z.string(),
  position: z.number().int().min(0),
});

const ModelImportSchema = z.strictObject({
  vendor_key: z.string(),
  api_family: z.enum(["openai", "anthropic", "gemini"]),
  model_id: z.string(),
  display_name: z.string().nullable(),
  model_type: z.enum(["native", "proxy"]),
  proxy_targets: z.array(ProxyTargetImportSchema),
  loadbalance_strategy_name: z.string().nullable(),
  is_enabled: z.boolean(),
  connections: z.array(ConnectionImportSchema),
});

const HeaderBlocklistRuleExportSchema = z.strictObject({
  name: z.string(),
  match_type: z.enum(["exact", "prefix"]),
  pattern: z.string(),
  enabled: z.boolean(),
});

const EndpointFxRateImportSchema = z.strictObject({
  model_id: z.string(),
  endpoint_name: z.string(),
  fx_rate: z.string(),
});

const UserSettingsImportSchema = z.strictObject({
  report_currency_code: z.string().optional(),
  report_currency_symbol: z.string().optional(),
  endpoint_fx_mappings: z.array(EndpointFxRateImportSchema),
  timezone_preference: z.string().nullable().optional(),
});

export const ConfigImportSchema = z
  .strictObject({
    version: z.literal(1),
    exported_at: z.string().optional(),
    vendors: z.array(VendorImportSchema),
    endpoints: z.array(EndpointImportSchema),
    pricing_templates: z.array(PricingTemplateImportSchema),
    loadbalance_strategies: z.array(LoadbalanceStrategyImportSchema),
    models: z.array(ModelImportSchema),
    user_settings: UserSettingsImportSchema.optional(),
    header_blocklist_rules: z.array(HeaderBlocklistRuleExportSchema).optional(),
  })
  .superRefine((data, ctx) => {
    const validationMessages = getStaticMessages().settingsBackupValidation;
    const vendorKeys = collectNamedReferences({
      items: data.vendors,
      ctx,
      collectionPath: "vendors",
      referenceLabel: "vendor",
      getName: (vendor) => vendor.key,
    });

    const endpointNames = collectNamedReferences({
      items: data.endpoints,
      ctx,
      collectionPath: "endpoints",
      referenceLabel: "endpoint",
    });

    const templateNames = collectNamedReferences({
      items: data.pricing_templates,
      ctx,
      collectionPath: "pricing_templates",
      referenceLabel: "pricing template",
    });

    const strategyNames = collectNamedReferences({
      items: data.loadbalance_strategies,
      ctx,
      collectionPath: "loadbalance_strategies",
      referenceLabel: "loadbalance strategy",
    });

    const connectionPairs = new Set<string>();
    data.models.forEach((model, modelIndex) => {
      resolveRequiredReferenceName({
        value: model.vendor_key,
        ctx,
        knownNames: vendorKeys,
        path: ["models", modelIndex, "vendor_key"],
        missingMessage: validationMessages.modelMustIncludeVendorKey(model.model_id),
        unknownMessage: (vendorKey) => validationMessages.unknownVendorKey(vendorKey),
      });

      const normalizedStrategyName = normalizeReferenceName(model.loadbalance_strategy_name);
      if (model.model_type === "native") {
        resolveRequiredReferenceName({
          value: model.loadbalance_strategy_name,
          ctx,
          knownNames: strategyNames,
          path: ["models", modelIndex, "loadbalance_strategy_name"],
          missingMessage: validationMessages.nativeModelMustIncludeStrategy(model.model_id),
          unknownMessage: (strategyName) => validationMessages.unknownLoadbalanceStrategy(strategyName),
        });
      }

      if (model.model_type === "proxy" && normalizedStrategyName !== null) {
        addCustomIssue(
          ctx,
          ["models", modelIndex, "loadbalance_strategy_name"],
          validationMessages.proxyModelMustNotIncludeStrategy(model.model_id),
        );
      }

      if (model.model_type === "native" && model.proxy_targets.length > 0) {
        addCustomIssue(
          ctx,
          ["models", modelIndex, "proxy_targets"],
          validationMessages.nativeModelMustNotIncludeProxyTargets(model.model_id),
        );
      }

      const seenProxyTargets = new Set<string>();
      model.proxy_targets.forEach((target, targetIndex) => {
        if (target.position !== targetIndex) {
          addCustomIssue(
            ctx,
            ["models", modelIndex, "proxy_targets", targetIndex, "position"],
            validationMessages.proxyTargetsContiguous(model.model_id),
          );
        }

        if (seenProxyTargets.has(target.target_model_id)) {
          addCustomIssue(
            ctx,
            ["models", modelIndex, "proxy_targets", targetIndex, "target_model_id"],
            validationMessages.duplicateProxyTarget(target.target_model_id, model.model_id),
          );
          return;
        }

        seenProxyTargets.add(target.target_model_id);
      });

      model.connections.forEach((connection, connectionIndex) => {
        const referencePath = ["models", modelIndex, "connections", connectionIndex];
        const endpointName = resolveRequiredReferenceName({
          value: connection.endpoint_name,
          ctx,
          knownNames: endpointNames,
          path: referencePath,
          missingMessage: validationMessages.missingEndpointName,
          unknownMessage: (endpointName) => validationMessages.unknownEndpointName(endpointName),
        });
        if (endpointName !== null) {
          connectionPairs.add(`${model.model_id}::${endpointName}`);
        }

        resolveOptionalReferenceName({
          value: connection.pricing_template_name,
          ctx,
          knownNames: templateNames,
          path: [...referencePath, "pricing_template_name"],
          unknownMessage: (templateName) => validationMessages.unknownPricingTemplateName(templateName),
        });
      });
    });

    const seenFxMappings = new Set<string>();
    data.user_settings?.endpoint_fx_mappings.forEach((mapping, mappingIndex) => {
      const referencePath = ["user_settings", "endpoint_fx_mappings", mappingIndex];
      const endpointName = resolveRequiredReferenceName({
        value: mapping.endpoint_name,
        ctx,
        knownNames: endpointNames,
        path: referencePath,
        missingMessage: validationMessages.missingEndpointName,
        unknownMessage: (endpointName) => validationMessages.unknownEndpointName(endpointName),
      });
      if (endpointName === null) {
        return;
      }

      const key = `${mapping.model_id}::${endpointName}`;
      if (seenFxMappings.has(key)) {
        addCustomIssue(
          ctx,
          referencePath,
          validationMessages.duplicateFxMapping(mapping.model_id, endpointName),
        );
        return;
      }
      seenFxMappings.add(key);

      if (!connectionPairs.has(key)) {
        addCustomIssue(
          ctx,
          referencePath,
          validationMessages.fxMappingMustReferenceImportedPair(mapping.model_id, endpointName),
        );
      }
    });
  });

export type ConfigImportSchemaType = z.infer<typeof ConfigImportSchema>;
