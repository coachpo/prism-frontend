import { describe, expect, it } from "vitest";
import type { RequestLogEntry } from "@/lib/types";
import { applyClientFilters } from "../clientFilters";

function createRequest(overrides: Partial<RequestLogEntry> = {}): RequestLogEntry {
  const request: RequestLogEntry = {
    id: 1,
    model_id: "gpt-5.4",
    resolved_target_model_id: null,
    profile_id: 7,
    api_family: "openai",
    endpoint_id: 10,
    connection_id: 22,
    ingress_request_id: null,
    attempt_number: null,
    provider_correlation_id: null,
    endpoint_base_url: "https://api.example.com/v1",
    endpoint_description: "Primary",
    status_code: 200,
    response_time_ms: 450,
    is_stream: false,
    input_tokens: 100,
    output_tokens: 40,
    total_tokens: 140,
    success_flag: true,
    billable_flag: true,
    priced_flag: true,
    unpriced_reason: null,
    cache_read_input_tokens: null,
    cache_creation_input_tokens: null,
    reasoning_tokens: null,
    input_cost_micros: 1000,
    output_cost_micros: 1000,
    cache_read_input_cost_micros: null,
    cache_creation_input_cost_micros: null,
    reasoning_cost_micros: null,
    total_cost_original_micros: 2000,
    total_cost_user_currency_micros: 2000,
    currency_code_original: "USD",
    report_currency_code: "USD",
    report_currency_symbol: "$",
    fx_rate_used: "1.0",
    fx_rate_source: "test",
    pricing_snapshot_unit: "token",
    pricing_snapshot_input: "1",
    pricing_snapshot_output: "1",
    pricing_snapshot_cache_read_input: null,
    pricing_snapshot_cache_creation_input: null,
    pricing_snapshot_reasoning: null,
    pricing_snapshot_missing_special_token_price_policy: null,
    pricing_config_version_used: 1,
    request_path: "/v1/chat/completions",
    error_detail: null,
    created_at: "2026-03-15T00:00:00.000Z",
    ...overrides,
  };

  return {
    ...request,
    resolved_target_model_id: request.resolved_target_model_id ?? null,
    ingress_request_id: request.ingress_request_id ?? null,
    attempt_number: request.attempt_number ?? null,
    provider_correlation_id: request.provider_correlation_id ?? null,
  };
}

describe("applyClientFilters", () => {
  it("matches special-token filters and billing toggles", () => {
    const items = [
      createRequest({ id: 1, cache_read_input_tokens: 20 }),
      createRequest({ id: 2, reasoning_tokens: 15 }),
      createRequest({ id: 3, priced_flag: false, billable_flag: false }),
    ];

    expect(
      applyClientFilters(items, {
        search: "",
        outcome_filter: "all",
        stream_filter: "all",
        latency_bucket: "all",
        token_min: "",
        token_max: "",
        priced_only: false,
        billable_only: false,
        special_token_filter: "cache_read",
        triage: false,
      }).map((item) => item.id)
    ).toEqual([1]);

    expect(
      applyClientFilters(items, {
        search: "",
        outcome_filter: "all",
        stream_filter: "all",
        latency_bucket: "all",
        token_min: "",
        token_max: "",
        priced_only: false,
        billable_only: false,
        special_token_filter: "reasoning",
        triage: false,
      }).map((item) => item.id)
    ).toEqual([2]);

    expect(
      applyClientFilters(items, {
        search: "",
        outcome_filter: "all",
        stream_filter: "all",
        latency_bucket: "all",
        token_min: "",
        token_max: "",
        priced_only: true,
        billable_only: true,
        special_token_filter: "",
        triage: false,
      }).map((item) => item.id)
    ).toEqual([1, 2]);
  });

  it("keeps triage focused on slow or failed requests", () => {
    const items = [
      createRequest({ id: 1, response_time_ms: 450, status_code: 200, success_flag: true }),
      createRequest({ id: 2, response_time_ms: 3200, status_code: 200, success_flag: true }),
      createRequest({ id: 3, response_time_ms: 700, status_code: 500, success_flag: false }),
    ];

    const filtered = applyClientFilters(items, {
      search: "",
      outcome_filter: "all",
      stream_filter: "all",
      latency_bucket: "all",
      token_min: "",
      token_max: "",
      priced_only: false,
      billable_only: false,
      special_token_filter: "",
      triage: true,
    });

    expect(filtered.map((item) => item.id)).toEqual([2, 3]);
  });

  it("searches api_family text directly", () => {
    const items = [
      createRequest({ id: 1, api_family: "openai" }),
      createRequest({ id: 2, api_family: "anthropic" }),
    ];

    const filtered = applyClientFilters(items, {
      search: "anthropic",
      outcome_filter: "all",
      stream_filter: "all",
      latency_bucket: "all",
      token_min: "",
      token_max: "",
      priced_only: false,
      billable_only: false,
      special_token_filter: "",
      triage: false,
    });

    expect(filtered.map((item) => item.id)).toEqual([2]);
  });
});
