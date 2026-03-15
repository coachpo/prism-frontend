import { StrictMode, type ReactNode } from "react";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RequestLogEntry } from "@/lib/types";
import { useRequestLogsPageData } from "../useRequestLogsPageData";

const api = vi.hoisted(() => ({
  stats: {
    requests: vi.fn(),
  },
}));

vi.mock("@/lib/api", () => ({ api }));
vi.mock("../useRequestLogFilterOptions", () => ({
  useRequestLogFilterOptions: () => ({
    connections: [],
    endpoints: [],
    models: [],
    providers: [],
  }),
}));

function StrictWrapper({ children }: { children: ReactNode }) {
  return <StrictMode>{children}</StrictMode>;
}

function makeRequestLog(id: number): RequestLogEntry {
  return {
    id,
    model_id: "gpt-5.4",
    profile_id: 1,
    provider_type: "openai",
    endpoint_id: 2,
    connection_id: 3,
    endpoint_base_url: "https://api.openai.com/v1",
    endpoint_description: "Primary endpoint",
    status_code: 200,
    response_time_ms: 120,
    is_stream: false,
    input_tokens: 10,
    output_tokens: 20,
    total_tokens: 30,
    success_flag: true,
    billable_flag: true,
    priced_flag: true,
    unpriced_reason: null,
    cache_read_input_tokens: null,
    cache_creation_input_tokens: null,
    reasoning_tokens: null,
    input_cost_micros: 10,
    output_cost_micros: 20,
    cache_read_input_cost_micros: null,
    cache_creation_input_cost_micros: null,
    reasoning_cost_micros: null,
    total_cost_original_micros: 30,
    total_cost_user_currency_micros: 30,
    currency_code_original: "USD",
    report_currency_code: "USD",
    report_currency_symbol: "$",
    fx_rate_used: null,
    fx_rate_source: null,
    pricing_snapshot_unit: null,
    pricing_snapshot_input: null,
    pricing_snapshot_output: null,
    pricing_snapshot_cache_read_input: null,
    pricing_snapshot_cache_creation_input: null,
    pricing_snapshot_reasoning: null,
    pricing_snapshot_missing_special_token_price_policy: null,
    pricing_config_version_used: 1,
    request_path: "/v1/chat/completions",
    error_detail: null,
    created_at: "2026-03-14T10:00:00Z",
  };
}

describe("useRequestLogsPageData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.stats.requests.mockResolvedValue({
      items: [makeRequestLog(101)],
      total: 1,
      limit: 50,
      offset: 0,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("loads request logs with a single bootstrap requests call", async () => {
    const { result } = renderHook(
      () =>
        useRequestLogsPageData({
          connectionId: "__all__",
          endpointId: "__all__",
          latencyBucket: "all",
          limit: 50,
          modelId: "__all__",
          offset: 0,
          outcomeFilter: "all",
          providerType: "all",
          requestId: null,
          revision: 1,
          searchQuery: "",
          setDetailTab: vi.fn(),
          setOffset: vi.fn(),
          showBillableOnly: false,
          showPricedOnly: false,
          specialTokenFilter: "all",
          streamFilter: "all",
          timeRange: "24h",
          tokenMax: null,
          tokenMin: null,
          triage: "none",
          view: "default",
        }),
      { wrapper: StrictWrapper }
    );

    await waitFor(() => {
      expect(api.stats.requests).toHaveBeenCalledTimes(1);
      expect(result.current.displayedLoading).toBe(false);
    });

    expect(api.stats.requests).toHaveBeenCalledTimes(1);
    expect(result.current.displayedRows).toHaveLength(1);
    expect(result.current.displayedRows[0]?.id).toBe(101);
  });

  it("reuses the main requests query for exact request focus", async () => {
    const { result } = renderHook(
      () =>
        useRequestLogsPageData({
          connectionId: "99",
          endpointId: "42",
          latencyBucket: "all",
          limit: 50,
          modelId: "other-model",
          offset: 0,
          outcomeFilter: "all",
          providerType: "anthropic",
          requestId: 101,
          revision: 1,
          searchQuery: "",
          setDetailTab: vi.fn(),
          setOffset: vi.fn(),
          showBillableOnly: false,
          showPricedOnly: false,
          specialTokenFilter: "all",
          streamFilter: "all",
          timeRange: "24h",
          tokenMax: null,
          tokenMin: null,
          triage: "none",
          view: "default",
        }),
      { wrapper: StrictWrapper }
    );

    await waitFor(() => {
      expect(api.stats.requests).toHaveBeenCalledTimes(1);
      expect(result.current.displayedLoading).toBe(false);
    });

    await waitFor(() => {
      expect(result.current.selectedLog?.id).toBe(101);
    });

    expect(api.stats.requests).toHaveBeenCalledWith({
      request_id: 101,
      limit: 1,
      offset: 0,
    });
    expect(result.current.displayedRows).toHaveLength(1);
  });
});
