import { z } from "zod";

const EndpointExportSchema = z.object({
  endpoint_id: z.number().int(),
  name: z.string(),
  base_url: z.string(),
  api_key: z.string(),
  position: z.number().int().min(0).nullable().optional(),
});

const PricingTemplateExportSchema = z.object({
  pricing_template_id: z.number().int(),
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

const ConnectionExportSchema = z.object({
  connection_id: z.number().int(),
  endpoint_id: z.number().int(),
  pricing_template_id: z.number().int().nullable(),
  is_active: z.boolean(),
  priority: z.number().int().min(0),
  name: z.string().nullable(),
  auth_type: z.string().nullable(),
  custom_headers: z.record(z.string(), z.string()).nullable(),
});

const ModelExportSchema = z.object({
  provider_type: z.string(),
  model_id: z.string(),
  display_name: z.string().nullable(),
  model_type: z.enum(["native", "proxy"]),
  redirect_to: z.string().nullable(),
  lb_strategy: z.enum(["single", "failover"]),
  is_enabled: z.boolean(),
  failover_recovery_enabled: z.boolean(),
  failover_recovery_cooldown_seconds: z.number().int(),
  connections: z.array(ConnectionExportSchema),
});

const HeaderBlocklistRuleExportSchema = z.object({
  name: z.string(),
  match_type: z.enum(["exact", "prefix"]),
  pattern: z.string(),
  enabled: z.boolean(),
});

const EndpointFxRateExportSchema = z.object({
  model_id: z.string(),
  endpoint_id: z.number().int(),
  fx_rate: z.string(),
});

const UserSettingsExportSchema = z.object({
  report_currency_code: z.string(),
  report_currency_symbol: z.string(),
  endpoint_fx_mappings: z.array(EndpointFxRateExportSchema),
  timezone_preference: z.string().nullable().optional(),
});

export const ConfigImportSchema = z.object({
    version: z.literal(2),
    exported_at: z.string().optional(),
    endpoints: z.array(EndpointExportSchema),
    pricing_templates: z.array(PricingTemplateExportSchema),
    models: z.array(ModelExportSchema),
    user_settings: UserSettingsExportSchema.optional(),
    header_blocklist_rules: z.array(HeaderBlocklistRuleExportSchema).optional(),
  })
  .superRefine((data, ctx) => {
    const templateIds = new Set<number>();
    for (const template of data.pricing_templates) {
      templateIds.add(template.pricing_template_id);
    }

    data.models.forEach((model, modelIndex) => {
      model.connections.forEach((connection, connectionIndex) => {
        const pricingTemplateId = connection.pricing_template_id;
        if (pricingTemplateId === null) {
          return;
        }
        if (!templateIds.has(pricingTemplateId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [
              "models",
              modelIndex,
              "connections",
              connectionIndex,
              "pricing_template_id",
            ],
            message: `Unknown pricing_template_id '${pricingTemplateId}' in import payload`,
          });
        }
      });
    });
  });

export type ConfigImportSchemaType = z.infer<typeof ConfigImportSchema>;
