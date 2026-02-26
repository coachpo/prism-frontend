export type ProviderType = "openai" | "anthropic" | "gemini";
export type MissingSpecialTokenPricePolicy = "MAP_TO_OUTPUT" | "ZERO_COST";

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: Record<string, unknown> | null;
}

export interface ErrorEnvelope {
  error: ApiErrorBody;
}

export interface Provider {
  id: number;
  name: string;
  provider_type: ProviderType;
  profile_count: number;
  created_at: string;
}

export interface ProviderProfile {
  id: string;
  provider_id: number;
  provider_type: ProviderType;
  name: string | null;
  description: string | null;
  endpoint_url: string;
  priority: number;
  is_dynamic: boolean;
  is_active: boolean;
  tags: string[];
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ProviderProfileCreateRequest {
  name?: string | null;
  description?: string | null;
  endpoint_url: string;
  api_key: string;
  auth_extra?: Record<string, unknown> | null;
  priority?: number;
  is_dynamic?: boolean;
  is_active?: boolean;
  tags?: string[];
  metadata?: Record<string, unknown> | null;
}

export interface ProviderProfileUpdateRequest {
  name?: string | null;
  description?: string | null;
  endpoint_url?: string;
  api_key?: string;
  auth_extra?: Record<string, unknown> | null;
  priority?: number;
  is_dynamic?: boolean;
  is_active?: boolean;
  tags?: string[];
  metadata?: Record<string, unknown> | null;
}

export interface ProfileModelPricing {
  id: string;
  profile_model_id: string;
  currency_code: string;
  price_input_micros: number | null;
  price_output_micros: number | null;
  price_cache_read_micros: number | null;
  price_cache_write_micros: number | null;
  price_reasoning_micros: number | null;
  missing_special_token_price_policy: MissingSpecialTokenPricePolicy;
  source_reference: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileModel {
  id: string;
  profile_id: string;
  model_id: string;
  is_active: boolean;
  pricing: ProfileModelPricing | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileModelsUpsertRequest {
  models: string[];
}

export interface ProfileModelPricingUpsertRequest {
  currency_code: string;
  price_input_micros?: number | null;
  price_output_micros?: number | null;
  price_cache_read_micros?: number | null;
  price_cache_write_micros?: number | null;
  price_reasoning_micros?: number | null;
  missing_special_token_price_policy?: MissingSpecialTokenPricePolicy;
  source_reference?: string | null;
}

export interface AuthStatusResponse {
  auth_enabled: boolean;
  has_passkey: boolean;
  api_key_count: number;
}

export interface OtpRequest {
  email: string;
}

export interface OtpChallengeResponse {
  otp_challenge_id: string;
  expires_at: string;
  debug_otp_code: string | null;
}

export interface EnableAuthRequest {
  email: string;
  username: string;
  password: string;
  otp_challenge_id: string;
  otp_code: string;
}

export interface LoginPasswordRequest {
  username_or_email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface TokenPairResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface PasswordResetConfirmRequest {
  otp_challenge_id: string;
  otp_code: string;
  new_password: string;
}

export interface DisableAuthConfirmRequest {
  otp_challenge_id: string;
  otp_code: string;
}

export interface AuthMessageResponse {
  message: string;
}

export interface ApiKeyResponse {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
}

export interface ApiKeyCreateRequest {
  name: string;
  expires_at?: string | null;
}

export interface ApiKeyCreateResponse extends ApiKeyResponse {
  plain_api_key: string;
}

export interface ApiKeyUpdateRequest {
  name?: string | null;
  expires_at?: string | null;
}

export interface PasskeyOtpRequest {
  email: string;
  action: "create" | "revoke";
}

export interface PasskeyRegisterBeginRequest {
  otp_challenge_id: string;
  otp_code: string;
  name?: string | null;
}

export interface PasskeyRegisterBeginResponse {
  challenge_id: string;
  challenge: string;
  rp_id: string;
  rp_name: string;
  user_id: string;
  user_name: string;
}

export interface PasskeyRegisterFinishRequest {
  challenge_id: string;
  credential_id: string;
  attestation_object: string;
  client_data_json: string;
  transports?: string[] | null;
  name?: string | null;
}

export interface PasskeyLoginBeginRequest {
  username_or_email: string;
}

export interface PasskeyLoginBeginResponse {
  challenge_id: string;
  challenge: string;
  rp_id: string;
}

export interface PasskeyLoginFinishRequest {
  challenge_id: string;
  credential_id: string;
  authenticator_data: string;
  client_data_json: string;
  signature: string;
  user_handle?: string | null;
}

export interface PasskeyRevokeRequest {
  otp_challenge_id: string;
  otp_code: string;
}

export interface PasskeyResponse {
  id: string;
  name: string | null;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

export interface RequestLogResponse {
  id: number;
  profile_id: string | null;
  profile_name_snapshot: string | null;
  provider_profile_priority_snapshot: number | null;
  model_id: string;
  provider_type: string;
  status_code: number;
  response_time_ms: number;
  is_stream: boolean;
  request_path: string;
  error_code: string | null;
  error_detail: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  cache_read_input_tokens: number | null;
  cache_write_input_tokens: number | null;
  reasoning_tokens: number | null;
  total_tokens: number | null;
  total_cost_micros: number | null;
  currency_code: string | null;
  created_at: string;
}

export interface RequestLogListResponse {
  items: RequestLogResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface StatsSummaryResponse {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  total_cost_micros: number | null;
}

export interface RequestLogQuery {
  profile_id?: string;
  model_id?: string;
  provider_type?: string;
  status_code?: number;
  limit?: number;
  offset?: number;
}

export interface DeleteRowsResponse {
  deleted_count: number;
}

export interface AuditLogResponse {
  id: number;
  request_log_id: number | null;
  profile_id: string | null;
  profile_name_snapshot: string | null;
  provider_id: number | null;
  model_id: string;
  request_method: string;
  request_url: string;
  request_headers: Record<string, unknown>;
  request_body: string | null;
  response_status: number;
  response_headers: Record<string, unknown> | null;
  response_body: string | null;
  is_stream: boolean;
  duration_ms: number;
  created_at: string;
}

export interface AuditLogListResponse {
  items: AuditLogResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface AuditLogQuery {
  profile_id?: string;
  model_id?: string;
  response_status?: number;
  limit?: number;
  offset?: number;
}

export interface ConfigExportProfileModelPricing {
  currency_code: string;
  price_input_micros: number | null;
  price_output_micros: number | null;
  price_cache_read_micros: number | null;
  price_cache_write_micros: number | null;
  price_reasoning_micros: number | null;
  missing_special_token_price_policy: MissingSpecialTokenPricePolicy;
  source_reference: string | null;
}

export interface ConfigExportProfileModel {
  model_id: string;
  is_active: boolean;
  pricing: ConfigExportProfileModelPricing | null;
}

export interface ConfigExportProfile {
  provider_type: ProviderType;
  name: string | null;
  description: string | null;
  endpoint_url: string;
  auth_extra: Record<string, unknown> | null;
  priority: number;
  is_dynamic: boolean;
  is_active: boolean;
  tags: string[];
  metadata: Record<string, unknown> | null;
  models: ConfigExportProfileModel[];
}

export interface ConfigExportResponse {
  exported_at: string;
  auth_enabled: boolean;
  profiles: ConfigExportProfile[];
}

export type ConfigImportProfileModelPricing = ConfigExportProfileModelPricing;

export interface ConfigImportProfileModel extends ConfigExportProfileModel {
  pricing: ConfigImportProfileModelPricing | null;
}

export interface ConfigImportProfile extends ConfigExportProfile {
  api_key: string;
  models: ConfigImportProfileModel[];
}

export interface ConfigImportRequest {
  profiles: ConfigImportProfile[];
}

export interface ConfigImportResponse {
  providers_imported: number;
  profiles_imported: number;
  models_imported: number;
}

export interface TelemetrySnapshot {
  queue_depth: number;
  metrics: Record<string, unknown>;
}
