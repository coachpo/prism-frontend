import { z } from "zod";
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

const LoadbalanceStrategyImportSchema = z.strictObject({
  name: z.string(),
  strategy_type: z.enum(["single", "fill-first", "round-robin", "failover"]),
  failover_recovery_enabled: z.boolean(),
  failover_cooldown_seconds: z.number().int().min(0).optional(),
  failover_failure_threshold: z.number().int().min(1).max(10).optional(),
  failover_backoff_multiplier: z.number().min(1).max(10).optional(),
  failover_max_cooldown_seconds: z.number().int().min(1).max(86_400).optional(),
  failover_jitter_ratio: z.number().min(0).max(1).optional(),
  failover_auth_error_cooldown_seconds: z.number().int().min(1).max(86_400).optional(),
  failover_ban_mode: z.enum(["off", "temporary", "manual"]).optional(),
  failover_max_cooldown_strikes_before_ban: z.number().int().min(0).max(100).optional(),
  failover_ban_duration_seconds: z.number().int().min(0).max(86_400).optional(),
});

const VendorImportSchema = z.strictObject({
  key: z.string(),
  name: z.string(),
  description: z.string().nullable(),
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
    version: z.literal(6),
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

    data.loadbalance_strategies.forEach((strategy, index) => {
      if (strategy.strategy_type === "single" && strategy.failover_recovery_enabled) {
        addCustomIssue(
          ctx,
          ["loadbalance_strategies", index, "failover_recovery_enabled"],
          "Single strategies must not enable failover recovery",
        );
      }
    });

    const connectionPairs = new Set<string>();
    data.models.forEach((model, modelIndex) => {
      resolveRequiredReferenceName({
        value: model.vendor_key,
        ctx,
        knownNames: vendorKeys,
        path: ["models", modelIndex, "vendor_key"],
        missingMessage: `Model '${model.model_id}' must include vendor_key`,
        unknownMessage: (vendorKey) =>
          `Unknown vendor_key '${vendorKey}' in import payload`,
      });

      const normalizedStrategyName = normalizeReferenceName(model.loadbalance_strategy_name);
      if (model.model_type === "native") {
        resolveRequiredReferenceName({
          value: model.loadbalance_strategy_name,
          ctx,
          knownNames: strategyNames,
          path: ["models", modelIndex, "loadbalance_strategy_name"],
          missingMessage: `Native model '${model.model_id}' must include loadbalance_strategy_name`,
          unknownMessage: (strategyName) =>
            `Unknown loadbalance strategy '${strategyName}' in import payload`,
        });
      }

      if (model.model_type === "proxy" && normalizedStrategyName !== null) {
        addCustomIssue(
          ctx,
          ["models", modelIndex, "loadbalance_strategy_name"],
          `Proxy model '${model.model_id}' must not include loadbalance_strategy_name`,
        );
      }

      if (model.model_type === "proxy" && model.proxy_targets.length === 0) {
        addCustomIssue(
          ctx,
          ["models", modelIndex, "proxy_targets"],
          `Proxy model '${model.model_id}' must include at least one proxy target`,
        );
      }

      if (model.model_type === "native" && model.proxy_targets.length > 0) {
        addCustomIssue(
          ctx,
          ["models", modelIndex, "proxy_targets"],
          `Native model '${model.model_id}' must not include proxy_targets`,
        );
      }

      const seenProxyTargets = new Set<string>();
      model.proxy_targets.forEach((target, targetIndex) => {
        if (target.position !== targetIndex) {
          addCustomIssue(
            ctx,
            ["models", modelIndex, "proxy_targets", targetIndex, "position"],
            `Proxy targets for '${model.model_id}' must use contiguous positions starting at 0`,
          );
        }

        if (seenProxyTargets.has(target.target_model_id)) {
          addCustomIssue(
            ctx,
            ["models", modelIndex, "proxy_targets", targetIndex, "target_model_id"],
            `Duplicate proxy target '${target.target_model_id}' for model '${model.model_id}'`,
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
          missingMessage: "Must include endpoint_name",
          unknownMessage: (endpointName) =>
            `Unknown endpoint_name '${endpointName}' in import payload`,
        });
        if (endpointName !== null) {
          connectionPairs.add(`${model.model_id}::${endpointName}`);
        }

        resolveOptionalReferenceName({
          value: connection.pricing_template_name,
          ctx,
          knownNames: templateNames,
          path: [...referencePath, "pricing_template_name"],
          unknownMessage: (templateName) =>
            `Unknown pricing_template_name '${templateName}' in import payload`,
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
        missingMessage: "Must include endpoint_name",
        unknownMessage: (endpointName) =>
          `Unknown endpoint_name '${endpointName}' in import payload`,
      });
      if (endpointName === null) {
        return;
      }

      const key = `${mapping.model_id}::${endpointName}`;
      if (seenFxMappings.has(key)) {
        addCustomIssue(
          ctx,
          referencePath,
          `Duplicate FX mapping for model_id='${mapping.model_id}', endpoint_name='${endpointName}'`,
        );
        return;
      }
      seenFxMappings.add(key);

      if (!connectionPairs.has(key)) {
        addCustomIssue(
          ctx,
          referencePath,
          `FX mapping must reference an imported model/endpoint pair: model_id='${mapping.model_id}', endpoint_name='${endpointName}'`,
        );
      }
    });
  });

export type ConfigImportSchemaType = z.infer<typeof ConfigImportSchema>;
