import { describe, expect, it } from "vitest";
import type { RequestLogListItem } from "@/lib/types";
import { applyClientFilters } from "../clientFilters";

function createRequest(overrides: Partial<RequestLogListItem> = {}): RequestLogListItem {
  return {
    id: 1,
    created_at: "2026-03-15T00:00:00.000Z",
    model_id: "gpt-5.4",
    resolved_target_model_id: null,
    api_family: "openai",
    vendor_id: 1,
    vendor_key: "openai",
    vendor_name: "OpenAI",
    endpoint_id: 10,
    connection_id: 22,
    status_code: 200,
    response_time_ms: 450,
    is_stream: false,
    total_tokens: 140,
    total_cost_user_currency_micros: 2000,
    report_currency_symbol: "$",
    ...overrides,
  };
}

describe("applyClientFilters", () => {
  it("keeps triage focused on slow or failed list rows", () => {
    const items = [
      createRequest({ id: 1, response_time_ms: 450, status_code: 200 }),
      createRequest({ id: 2, response_time_ms: 3200, status_code: 200 }),
      createRequest({ id: 3, response_time_ms: 700, status_code: 500 }),
    ];

    const filtered = applyClientFilters(items, {
      search: "",
      outcome_filter: "all",
      stream_filter: "all",
      latency_bucket: "all",
      token_min: "",
      token_max: "",
      triage: true,
    });

    expect(filtered.map((item) => item.id)).toEqual([2, 3]);
  });

  it("searches api_family and vendor text directly", () => {
    const items = [
      createRequest({ id: 1, api_family: "openai", vendor_name: "OpenAI" }),
      createRequest({ id: 2, api_family: "anthropic", vendor_name: "Anthropic" }),
    ];

    expect(
      applyClientFilters(items, {
        search: "anthropic",
        outcome_filter: "all",
        stream_filter: "all",
        latency_bucket: "all",
        token_min: "",
        token_max: "",
        triage: false,
      }).map((item) => item.id),
    ).toEqual([2]);
  });
});
