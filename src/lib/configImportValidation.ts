import { z } from "zod";

const EndpointImportSchema = z.object({
  endpoint_id: z.number().int().nullable().optional(),
  name: z.string(),
  base_url: z.string(),
  api_key: z.string(),
  position: z.number().int().min(0).nullable().optional(),
});

const PricingTemplateImportSchema = z.object({
  pricing_template_id: z.number().int().nullable().optional(),
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

const ConnectionImportSchema = z.object({
  connection_id: z.number().int().nullable().optional(),
  endpoint_id: z.number().int().nullable().optional(),
  endpoint_name: z.string().nullable().optional(),
  pricing_template_id: z.number().int().nullable().optional(),
  pricing_template_name: z.string().nullable().optional(),
  is_active: z.boolean(),
  priority: z.number().int().min(0),
  name: z.string().nullable(),
  auth_type: z.string().nullable(),
  custom_headers: z.record(z.string(), z.string()).nullable(),
});

const ModelImportSchema = z.object({
  provider_type: z.string(),
  model_id: z.string(),
  display_name: z.string().nullable(),
  model_type: z.enum(["native", "proxy"]),
  redirect_to: z.string().nullable(),
  lb_strategy: z.enum(["single", "failover"]),
  is_enabled: z.boolean(),
  failover_recovery_enabled: z.boolean(),
  failover_recovery_cooldown_seconds: z.number().int(),
  connections: z.array(ConnectionImportSchema),
});

const HeaderBlocklistRuleExportSchema = z.object({
  name: z.string(),
  match_type: z.enum(["exact", "prefix"]),
  pattern: z.string(),
  enabled: z.boolean(),
});

const EndpointFxRateImportSchema = z.object({
  model_id: z.string(),
  endpoint_id: z.number().int().nullable().optional(),
  endpoint_name: z.string().nullable().optional(),
  fx_rate: z.string(),
});

const UserSettingsImportSchema = z.object({
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
  .object({
    version: z.literal(2),
    exported_at: z.string().optional(),
    endpoints: z.array(EndpointImportSchema),
    pricing_templates: z.array(PricingTemplateImportSchema),
    models: z.array(ModelImportSchema),
    user_settings: UserSettingsImportSchema.optional(),
    header_blocklist_rules: z.array(HeaderBlocklistRuleExportSchema).optional(),
  })
  .superRefine((data, ctx) => {
    const endpointNames = new Set<string>();
    const endpointIdToName = new Map<number, string>();
    data.endpoints.forEach((endpoint, index) => {
      const normalizedName = endpoint.name.trim();
      endpointNames.add(normalizedName);
      if (typeof endpoint.endpoint_id === "number") {
        endpointIdToName.set(endpoint.endpoint_id, normalizedName);
      }
      if (!normalizedName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endpoints", index, "name"],
          message: "Endpoint name must not be empty",
        });
      }
    });

    const templateNames = new Set<string>();
    const templateIdToName = new Map<number, string>();
    data.pricing_templates.forEach((template, index) => {
      const normalizedName = template.name.trim();
      templateNames.add(normalizedName);
      if (typeof template.pricing_template_id === "number") {
        templateIdToName.set(template.pricing_template_id, normalizedName);
      }
      if (!normalizedName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["pricing_templates", index, "name"],
          message: "Pricing template name must not be empty",
        });
      }
    });

    const resolveEndpointName = (
      endpointId: number | null | undefined,
      endpointName: string | null | undefined,
      path: (string | number)[]
    ): string | null => {
      const normalizedEndpointName = normalizeReferenceName(endpointName);
      if (typeof endpointId !== "number" && normalizedEndpointName === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path,
          message: "Must include endpoint_name or endpoint_id",
        });
        return null;
      }

      let resolvedEndpointName = normalizedEndpointName;
      if (typeof endpointId === "number") {
        const mappedEndpointName = endpointIdToName.get(endpointId);
        if (!mappedEndpointName) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path,
            message: `Unknown endpoint_id '${endpointId}' in import payload`,
          });
          return null;
        }
        if (resolvedEndpointName === null) {
          resolvedEndpointName = mappedEndpointName;
        } else if (resolvedEndpointName !== mappedEndpointName) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path,
            message: `endpoint_name '${resolvedEndpointName}' does not match endpoint_id '${endpointId}'`,
          });
          return null;
        }
      }

      if (resolvedEndpointName === null || !endpointNames.has(resolvedEndpointName)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path,
          message: `Unknown endpoint_name '${resolvedEndpointName ?? ""}' in import payload`,
        });
        return null;
      }

      return resolvedEndpointName;
    };

    const resolveTemplateName = (
      pricingTemplateId: number | null | undefined,
      pricingTemplateName: string | null | undefined,
      path: (string | number)[]
    ): string | null => {
      const normalizedTemplateName = normalizeReferenceName(pricingTemplateName);
      if (typeof pricingTemplateId !== "number" && normalizedTemplateName === null) {
        return null;
      }

      let resolvedTemplateName = normalizedTemplateName;
      if (typeof pricingTemplateId === "number") {
        const mappedTemplateName = templateIdToName.get(pricingTemplateId);
        if (!mappedTemplateName) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path,
            message: `Unknown pricing_template_id '${pricingTemplateId}' in import payload`,
          });
          return null;
        }
        if (resolvedTemplateName === null) {
          resolvedTemplateName = mappedTemplateName;
        } else if (resolvedTemplateName !== mappedTemplateName) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path,
            message: `pricing_template_name '${resolvedTemplateName}' does not match pricing_template_id '${pricingTemplateId}'`,
          });
          return null;
        }
      }

      if (resolvedTemplateName !== null && !templateNames.has(resolvedTemplateName)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path,
          message: `Unknown pricing_template_name '${resolvedTemplateName}' in import payload`,
        });
        return null;
      }

      return resolvedTemplateName;
    };

    const connectionPairs = new Set<string>();
    data.models.forEach((model, modelIndex) => {
      model.connections.forEach((connection, connectionIndex) => {
        const referencePath = ["models", modelIndex, "connections", connectionIndex];
        const endpointName = resolveEndpointName(
          connection.endpoint_id,
          connection.endpoint_name,
          referencePath
        );
        if (endpointName !== null) {
          connectionPairs.add(`${model.model_id}::${endpointName}`);
        }

        resolveTemplateName(
          connection.pricing_template_id,
          connection.pricing_template_name,
          [...referencePath, "pricing_template_name"]
        );
      });
    });

    const seenFxMappings = new Set<string>();
    data.user_settings?.endpoint_fx_mappings.forEach((mapping, mappingIndex) => {
      const referencePath = ["user_settings", "endpoint_fx_mappings", mappingIndex];
      const endpointName = resolveEndpointName(
        mapping.endpoint_id,
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
