import { z } from "zod";

const PricingSchema = z.strictObject({
  currency_code: z.string().length(3),
  price_input_micros: z.number().int().nonnegative().nullable(),
  price_output_micros: z.number().int().nonnegative().nullable(),
  price_cache_read_micros: z.number().int().nonnegative().nullable(),
  price_cache_write_micros: z.number().int().nonnegative().nullable(),
  price_reasoning_micros: z.number().int().nonnegative().nullable(),
  missing_special_token_price_policy: z.enum(["MAP_TO_OUTPUT", "ZERO_COST"]),
  source_reference: z.string().nullable(),
});

const ModelSchema = z.strictObject({
  model_id: z.string().min(1),
  is_active: z.boolean(),
  pricing: PricingSchema.nullable(),
});

const ProfileSchema = z.strictObject({
  provider_type: z.enum(["openai", "anthropic", "gemini"]),
  name: z.string().nullable(),
  description: z.string().nullable(),
  endpoint_url: z.string().url(),
  api_key: z.string().min(1),
  auth_extra: z.record(z.string(), z.unknown()).nullable(),
  priority: z.number().int(),
  is_dynamic: z.boolean(),
  is_active: z.boolean(),
  tags: z.array(z.string()),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  models: z.array(ModelSchema),
});

export const ConfigImportSchema = z.strictObject({
  profiles: z.array(ProfileSchema),
});

export type ConfigImportSchemaType = z.infer<typeof ConfigImportSchema>;
