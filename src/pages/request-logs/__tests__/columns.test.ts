import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ModelConfigListItem, RequestLogEntry } from "@/lib/types";
import { formatCost, getColumns } from "../columns";

function createResolveModelLabel(
  labels: Record<string, string>,
  modelTypes: Record<string, "native" | "proxy"> = {},
) {
  return Object.assign(
    (modelId: string) => labels[modelId] ?? modelId,
    {
      getModelMetadata: (modelId: string) =>
        modelTypes[modelId]
          ? ({
              model_id: modelId,
              model_type: modelTypes[modelId],
            } as ModelConfigListItem)
          : undefined,
    },
  );
}

function renderModelCell(
  row: RequestLogEntry,
  resolveModelLabel: ReturnType<typeof createResolveModelLabel>,
) {
  const modelColumn = getColumns("all").find((column) => column.key === "model_id");

  expect(modelColumn).toBeDefined();

  render(
    React.createElement(
      React.Fragment,
      null,
      modelColumn?.render(
        row,
        () => "formatted:2026-03-16T00:00:00.000Z",
        resolveModelLabel,
      ),
    ),
  );
}

describe("formatCost", () => {
  it("preserves up to six fractional digits for small costs", () => {
    expect(formatCost(23_412, "$" )).toBe("$0.023412");
  });

  it("returns an em dash for zero and missing costs", () => {
    expect(formatCost(null, "$" )).toBe("—");
    expect(formatCost(0, "$" )).toBe("—");
  });

  it("renders a proxy-origin sign for routed proxy rows", () => {
    renderModelCell(
      {
        id: 42,
        model_id: "claude-sonnet-4-5",
        resolved_target_model_id: "claude-sonnet-4-5-20250929",
        profile_id: 7,
        api_family: "anthropic",
        endpoint_id: null,
        connection_id: null,
        ingress_request_id: null,
        attempt_number: null,
        provider_correlation_id: null,
        endpoint_base_url: null,
        endpoint_description: null,
        status_code: 200,
        response_time_ms: 123,
        is_stream: false,
        input_tokens: null,
        output_tokens: null,
        total_tokens: null,
        success_flag: true,
        billable_flag: true,
        priced_flag: true,
        unpriced_reason: null,
        cache_read_input_tokens: null,
        cache_creation_input_tokens: null,
        reasoning_tokens: null,
        input_cost_micros: null,
        output_cost_micros: null,
        cache_read_input_cost_micros: null,
        cache_creation_input_cost_micros: null,
        reasoning_cost_micros: null,
        total_cost_original_micros: null,
        total_cost_user_currency_micros: null,
        currency_code_original: null,
        report_currency_code: null,
        report_currency_symbol: null,
        fx_rate_used: null,
        fx_rate_source: null,
        pricing_snapshot_unit: null,
        pricing_snapshot_input: null,
        pricing_snapshot_output: null,
        pricing_snapshot_cache_read_input: null,
        pricing_snapshot_cache_creation_input: null,
        pricing_snapshot_reasoning: null,
        pricing_snapshot_missing_special_token_price_policy: null,
        pricing_config_version_used: null,
        request_path: "/v1/messages",
        error_detail: null,
        created_at: "2026-03-16T00:00:00.000Z",
      } as RequestLogEntry,
      createResolveModelLabel(
        {
          "claude-sonnet-4-5": "Claude Sonnet 4.5 Proxy",
          "claude-sonnet-4-5-20250929": "Claude Sonnet 4.5 (20250929)",
        },
        { "claude-sonnet-4-5": "proxy" },
      ),
    );

    expect(screen.getByText("Claude Sonnet 4.5 Proxy")).toBeInTheDocument();
    expect(screen.getByText(/proxy origin/i)).toBeInTheDocument();
    expect(screen.getByText("Resolved target → Claude Sonnet 4.5 (20250929)")).toBeInTheDocument();
  });

  it("renders a proxy-origin sign for unroutable proxy rows from current model metadata", () => {
    renderModelCell(
      {
        id: 43,
        model_id: "claude-sonnet-4-5",
        resolved_target_model_id: null,
        profile_id: 7,
        api_family: "anthropic",
        endpoint_id: null,
        connection_id: null,
        ingress_request_id: null,
        attempt_number: null,
        provider_correlation_id: null,
        endpoint_base_url: null,
        endpoint_description: null,
        status_code: 503,
        response_time_ms: 45,
        is_stream: false,
        input_tokens: null,
        output_tokens: null,
        total_tokens: null,
        success_flag: false,
        billable_flag: false,
        priced_flag: false,
        unpriced_reason: null,
        cache_read_input_tokens: null,
        cache_creation_input_tokens: null,
        reasoning_tokens: null,
        input_cost_micros: null,
        output_cost_micros: null,
        cache_read_input_cost_micros: null,
        cache_creation_input_cost_micros: null,
        reasoning_cost_micros: null,
        total_cost_original_micros: null,
        total_cost_user_currency_micros: null,
        currency_code_original: null,
        report_currency_code: null,
        report_currency_symbol: null,
        fx_rate_used: null,
        fx_rate_source: null,
        pricing_snapshot_unit: null,
        pricing_snapshot_input: null,
        pricing_snapshot_output: null,
        pricing_snapshot_cache_read_input: null,
        pricing_snapshot_cache_creation_input: null,
        pricing_snapshot_reasoning: null,
        pricing_snapshot_missing_special_token_price_policy: null,
        pricing_config_version_used: null,
        request_path: "/v1/messages",
        error_detail: null,
        created_at: "2026-03-16T00:00:00.000Z",
      } as RequestLogEntry,
      createResolveModelLabel(
        { "claude-sonnet-4-5": "Gateway proxy" },
        { "claude-sonnet-4-5": "proxy" },
      ),
    );

    expect(screen.getByText("Gateway proxy")).toBeInTheDocument();
    expect(screen.getByText(/proxy origin/i)).toBeInTheDocument();
    expect(screen.queryByText(/Resolved target/i)).not.toBeInTheDocument();
  });
});
