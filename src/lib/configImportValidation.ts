import { z } from "zod";


const ProviderExportSchema = z.object({
  name: z.string(),
  provider_type: z.string(),
  description: z.string().nullable(),
  audit_enabled: z.boolean(),
  audit_capture_bodies: z.boolean(),
});

const EndpointExportSchema = z.object({
  base_url: z.string(),
  api_key: z.string(),
  is_active: z.boolean(),
  priority: z.number(),
  description: z.string().nullable(),
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


export const ConfigImportSchema = z.object({
  version: z.literal(2),
  exported_at: z.string().optional(),
  providers: z.array(ProviderExportSchema),
  models: z.array(ModelExportSchema),
  header_blocklist_rules: z.array(HeaderBlocklistRuleExportSchema).optional(),
});

export type ConfigImportSchemaType = z.infer<typeof ConfigImportSchema>;
