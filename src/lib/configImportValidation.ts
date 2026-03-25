import { z } from "zod";

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
  strategy_type: z.enum(["single", "failover"]),
  failover_recovery_enabled: z.boolean(),
  failover_cooldown_seconds: z.number().int().min(0).optional(),
  failover_failure_threshold: z.number().int().min(1).max(10).optional(),
  failover_backoff_multiplier: z.number().min(1).max(10).optional(),
  failover_max_cooldown_seconds: z.number().int().min(1).max(86_400).optional(),
  failover_jitter_ratio: z.number().min(0).max(1).optional(),
  failover_auth_error_cooldown_seconds: z.number().int().min(1).max(86_400).optional(),
});

const ConnectionImportSchema = z.strictObject({
  endpoint_name: z.string(),
  pricing_template_name: z.string().nullable().optional(),
  is_active: z.boolean(),
  priority: z.number().int().min(0),
  name: z.string().nullable(),
  auth_type: z.string().nullable(),
  custom_headers: z.record(z.string(), z.string()).nullable(),
});

const ModelImportSchema = z.strictObject({
  provider_type: z.string(),
  model_id: z.string(),
  display_name: z.string().nullable(),
  model_type: z.enum(["native", "proxy"]),
  redirect_to: z.string().nullable(),
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

const normalizeReferenceName = (value: string | null | undefined): string | null => {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

export const ConfigImportSchema = z
  .strictObject({
    version: z.literal(3),
    exported_at: z.string().optional(),
    endpoints: z.array(EndpointImportSchema),
    pricing_templates: z.array(PricingTemplateImportSchema),
    loadbalance_strategies: z.array(LoadbalanceStrategyImportSchema),
    models: z.array(ModelImportSchema),
    user_settings: UserSettingsImportSchema.optional(),
    header_blocklist_rules: z.array(HeaderBlocklistRuleExportSchema).optional(),
  })
  .superRefine((data, ctx) => {
    const endpointNames = new Set<string>();
    data.endpoints.forEach((endpoint, index) => {
      const normalizedName = endpoint.name.trim();
      endpointNames.add(normalizedName);
      if (!normalizedName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endpoints", index, "name"],
          message: "Endpoint name must not be empty",
        });
      }
    });

    const templateNames = new Set<string>();
    data.pricing_templates.forEach((template, index) => {
      const normalizedName = template.name.trim();
      templateNames.add(normalizedName);
      if (!normalizedName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["pricing_templates", index, "name"],
          message: "Pricing template name must not be empty",
        });
      }
    });

    const strategyNames = new Set<string>();
    data.loadbalance_strategies.forEach((strategy, index) => {
      const normalizedName = strategy.name.trim();
      if (!normalizedName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["loadbalance_strategies", index, "name"],
          message: "Loadbalance strategy name must not be empty",
        });
        return;
      }
      if (strategyNames.has(normalizedName)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["loadbalance_strategies", index, "name"],
          message: `Duplicate loadbalance strategy name '${normalizedName}'`,
        });
      }
      if (strategy.strategy_type === "single" && strategy.failover_recovery_enabled) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["loadbalance_strategies", index, "failover_recovery_enabled"],
          message: "Single strategies must not enable failover recovery",
        });
      }
      strategyNames.add(normalizedName);
    });

    const resolveEndpointName = (
      endpointName: string | null | undefined,
      path: (string | number)[]
    ): string | null => {
      const normalizedEndpointName = normalizeReferenceName(endpointName);
      if (normalizedEndpointName === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path,
          message: "Must include endpoint_name",
        });
        return null;
      }

      if (!endpointNames.has(normalizedEndpointName)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path,
          message: `Unknown endpoint_name '${normalizedEndpointName}' in import payload`,
        });
        return null;
      }

      return normalizedEndpointName;
    };

    const resolveTemplateName = (
      pricingTemplateName: string | null | undefined,
      path: (string | number)[]
    ): string | null => {
      const normalizedTemplateName = normalizeReferenceName(pricingTemplateName);
      if (normalizedTemplateName === null) {
        return null;
      }

      if (!templateNames.has(normalizedTemplateName)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path,
          message: `Unknown pricing_template_name '${normalizedTemplateName}' in import payload`,
        });
        return null;
      }

      return normalizedTemplateName;
    };

    const connectionPairs = new Set<string>();
    data.models.forEach((model, modelIndex) => {
      const normalizedStrategyName = normalizeReferenceName(model.loadbalance_strategy_name);
      if (model.model_type === "native") {
        if (normalizedStrategyName === null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["models", modelIndex, "loadbalance_strategy_name"],
            message: `Native model '${model.model_id}' must include loadbalance_strategy_name`,
          });
        } else if (!strategyNames.has(normalizedStrategyName)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["models", modelIndex, "loadbalance_strategy_name"],
            message: `Unknown loadbalance strategy '${normalizedStrategyName}' in import payload`,
          });
        }
      }

      if (model.model_type === "proxy" && normalizedStrategyName !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["models", modelIndex, "loadbalance_strategy_name"],
          message: `Proxy model '${model.model_id}' must not include loadbalance_strategy_name`,
        });
      }

      model.connections.forEach((connection, connectionIndex) => {
        const referencePath = ["models", modelIndex, "connections", connectionIndex];
        const endpointName = resolveEndpointName(
          connection.endpoint_name,
          referencePath
        );
        if (endpointName !== null) {
          connectionPairs.add(`${model.model_id}::${endpointName}`);
        }

        resolveTemplateName(
          connection.pricing_template_name,
          [...referencePath, "pricing_template_name"]
        );
      });
    });

    const seenFxMappings = new Set<string>();
    data.user_settings?.endpoint_fx_mappings.forEach((mapping, mappingIndex) => {
      const referencePath = ["user_settings", "endpoint_fx_mappings", mappingIndex];
      const endpointName = resolveEndpointName(
        mapping.endpoint_name,
        referencePath
      );
      if (endpointName === null) {
        return;
      }

      const key = `${mapping.model_id}::${endpointName}`;
      if (seenFxMappings.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: referencePath,
          message: `Duplicate FX mapping for model_id='${mapping.model_id}', endpoint_name='${endpointName}'`,
        });
        return;
      }
      seenFxMappings.add(key);

      if (!connectionPairs.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: referencePath,
          message: `FX mapping must reference an imported model/endpoint pair: model_id='${mapping.model_id}', endpoint_name='${endpointName}'`,
        });
      }
    });
  });

export type ConfigImportSchemaType = z.infer<typeof ConfigImportSchema>;
