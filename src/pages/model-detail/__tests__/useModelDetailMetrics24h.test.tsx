import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Connection, ModelConfig } from "@/lib/types";
import { useModelDetailMetrics24h } from "../useModelDetailMetrics24h";

const api = vi.hoisted(() => ({
  stats: {
    connectionMetrics: vi.fn(),
    spending: vi.fn(),
    summary: vi.fn(),
  },
}));

vi.mock("@/lib/api", () => ({ api }));

const model: ModelConfig = {
  id: 1,
  provider_id: 10,
  provider: {
    id: 10,
    name: "OpenAI",
    provider_type: "openai",
    description: null,
    audit_enabled: false,
    audit_capture_bodies: false,
    created_at: "",
    updated_at: "",
  },
  model_id: "gpt-5.4",
  display_name: "GPT-5.4",
  model_type: "native",
  redirect_to: null,
  loadbalance_strategy_id: 100,
  loadbalance_strategy: {
    id: 100,
    name: "single-primary",
    strategy_type: "single",
    failover_recovery_enabled: false,
  },
  is_enabled: true,
  connections: [],
  created_at: "",
  updated_at: "",
};

const connection: Connection = {
  id: 11,
  endpoint_id: 21,
  endpoint: undefined,
  model_config_id: 1,
  name: "Primary",
  auth_type: null,
  custom_headers: null,
  is_active: true,
  priority: 0,
  health_status: "unknown",
  health_detail: null,
  last_health_check: null,
  pricing_template_id: null,
  pricing_template: null,
  created_at: "",
  updated_at: "",
};

describe("useModelDetailMetrics24h", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.stats.summary.mockResolvedValue({
      total_requests: 12,
      success_count: 11,
      error_count: 1,
      success_rate: 91.7,
      avg_response_time_ms: 250,
      p95_response_time_ms: 500,
      total_input_tokens: 10,
      total_output_tokens: 20,
      total_tokens: 30,
      groups: [],
    });
    api.stats.spending.mockResolvedValue({
      summary: { total_cost_micros: 1234 },
      groups: [],
      groups_total: 0,
      top_spending_models: [],
      top_spending_endpoints: [],
      unpriced_breakdown: {},
      report_currency_symbol: "$",
      report_currency_code: "USD",
    });
    api.stats.connectionMetrics.mockResolvedValue({
      items: [
        {
          connection_id: 11,
          success_rate_24h: 91.7,
          request_count_24h: 12,
          p95_latency_ms: 500,
          five_xx_rate: 8.3,
          heuristic_failover_events: 1,
          last_failover_like_at: "2026-03-15T10:00:00Z",
        },
      ],
    });
  });

  it("skips per-connection requests until connection metrics are enabled", async () => {
    renderHook(() =>
      useModelDetailMetrics24h({
        connectionMetricsEnabled: false,
        model,
        connections: [connection],
        revision: 1,
        setConnectionMetricsLoading: vi.fn(),
        setMetrics24hLoading: vi.fn(),
        setConnectionMetrics24h: vi.fn(),
        setKpiSummary24h: vi.fn(),
        setKpiSpend24hMicros: vi.fn(),
      })
    );

    await waitFor(() => {
      expect(api.stats.summary).toHaveBeenCalledTimes(1);
      expect(api.stats.spending).toHaveBeenCalledTimes(1);
    });

    expect(api.stats.connectionMetrics).not.toHaveBeenCalled();
  });

  it("loads per-connection metrics when explicitly enabled", async () => {
    renderHook(() =>
      useModelDetailMetrics24h({
        connectionMetricsEnabled: true,
        model,
        connections: [connection],
        revision: 1,
        setConnectionMetricsLoading: vi.fn(),
        setMetrics24hLoading: vi.fn(),
        setConnectionMetrics24h: vi.fn(),
        setKpiSummary24h: vi.fn(),
        setKpiSpend24hMicros: vi.fn(),
      })
    );

    await waitFor(() => {
      expect(api.stats.summary).toHaveBeenCalledTimes(1);
      expect(api.stats.connectionMetrics).toHaveBeenCalledTimes(1);
    });
  });

});
