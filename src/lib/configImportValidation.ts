import { z } from "zod";

const EndpointExportSchema = z.object({
  endpoint_id: z.number(),
  name: z.string(),
  base_url: z.string(),
  api_key: z.string(),
});

const ConnectionExportSchema = z.object({
  connection_id: z.number(),
  endpoint_id: z.number(),
  is_active: z.boolean(),
  priority: z.number(),
  name: z.string().nullable(),
  auth_type: z.string().nullable(),
  custom_headers: z.record(z.string(), z.string()).nullable(),
  pricing_enabled: z.boolean(),
  pricing_currency_code: z.string().nullable(),
  input_price: z.string().nullable(),
  output_price: z.string().nullable(),
  cached_input_price: z.string().nullable(),
  cache_creation_price: z.string().nullable(),
  reasoning_price: z.string().nullable(),
  missing_special_token_price_policy: z.enum(["MAP_TO_OUTPUT", "ZERO_COST"]),
  pricing_config_version: z.number(),
});
const ModelExportSchema = z.object({
  provider_type: z.string(),
  model_id: z.string(),
  display_name: z.string().nullable(),
  model_type: z.enum(["native"]),
  lb_strategy: z.enum(["single", "failover"]),
  is_enabled: z.boolean(),
  failover_recovery_enabled: z.boolean(),
  failover_recovery_cooldown_seconds: z.number(),
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
  endpoint_id: z.number(),
  fx_rate: z.string(),
});

const UserSettingsExportSchema = z.object({
  report_currency_code: z.string(),
  report_currency_symbol: z.string(),
  endpoint_fx_mappings: z.array(EndpointFxRateExportSchema),
});

export const ConfigImportSchema = z.object({
  exported_at: z.string().optional(),
  endpoints: z.array(EndpointExportSchema),
  models: z.array(ModelExportSchema),
  user_settings: UserSettingsExportSchema.optional(),
  header_blocklist_rules: z.array(HeaderBlocklistRuleExportSchema).optional(),
});

export type ConfigImportSchemaType = z.infer<typeof ConfigImportSchema>;
