import { z } from "zod";


const ProviderExportSchema = z.object({
  name: z.string(),
  provider_type: z.string(),
  description: z.string().nullable(),
  audit_enabled: z.boolean(),
  audit_capture_bodies: z.boolean(),
});

const EndpointExportSchema = z.object({
  endpoint_id: z.number().nullable().optional(),
  base_url: z.string(),
  api_key: z.string(),
  is_active: z.boolean(),
  priority: z.number(),
  description: z.string().nullable(),
  auth_type: z.string().nullable(),
  custom_headers: z.record(z.string(), z.string()).nullable(),
  pricing_enabled: z.boolean().optional().default(false),
  pricing_unit: z.enum(["PER_1K", "PER_1M"]).nullable().optional(),
  pricing_currency_code: z.string().nullable().optional(),
  input_price: z.string().nullable().optional(),
  output_price: z.string().nullable().optional(),
  cached_input_price: z.string().nullable().optional(),
  cache_creation_price: z.string().nullable().optional(),
  reasoning_price: z.string().nullable().optional(),
  missing_special_token_policy: z
    .enum(["MAP_TO_OUTPUT", "ZERO_COST"])
    .optional()
    .default("MAP_TO_OUTPUT"),
  pricing_config_version: z.number().optional().default(0),
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
  failover_recovery_cooldown_seconds: z.number(),
  endpoints: z.array(EndpointExportSchema),
});

const HeaderBlocklistRuleExportSchema = z.object({
  name: z.string(),
  match_type: z.enum(["exact", "prefix"]),
  pattern: z.string(),
  enabled: z.boolean(),
  is_system: z.boolean(),
});

const EndpointFxRateExportSchema = z.object({
  model_id: z.string(),
  endpoint_id: z.number(),
  fx_rate: z.string(),
});

const UserSettingsExportSchema = z.object({
  report_currency_code: z.string(),
  report_currency_symbol: z.string(),
  endpoint_fx_mappings: z.array(EndpointFxRateExportSchema).optional().default([]),
});


export const ConfigImportSchema = z.object({
  version: z.union([z.literal(2), z.literal(3)]),
  exported_at: z.string().optional(),
  providers: z.array(ProviderExportSchema),
  models: z.array(ModelExportSchema),
  user_settings: UserSettingsExportSchema.optional(),
  header_blocklist_rules: z.array(HeaderBlocklistRuleExportSchema).optional(),
});

export type ConfigImportSchemaType = z.infer<typeof ConfigImportSchema>;
