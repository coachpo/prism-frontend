import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Connection, ModelConfig } from "@/lib/types";
import { useModelDetailMetrics24h } from "../useModelDetailMetrics24h";

const api = vi.hoisted(() => ({
  stats: {
    requests: vi.fn(),
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
  lb_strategy: "single",
  is_enabled: true,
  failover_recovery_enabled: true,
  failover_recovery_cooldown_seconds: 60,
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
    api.stats.requests.mockResolvedValue({ items: [], total: 0, limit: 200, offset: 0 });
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

    expect(api.stats.requests).not.toHaveBeenCalled();
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
      expect(api.stats.summary).toHaveBeenCalledTimes(2);
      expect(api.stats.requests).toHaveBeenCalledTimes(1);
    });
  });

  it("does not refetch connection metrics when connection state changes but ids stay the same", async () => {
    const setConnectionMetricsLoading = vi.fn();
    const setMetrics24hLoading = vi.fn();
    const setConnectionMetrics24h = vi.fn();
    const setKpiSummary24h = vi.fn();
    const setKpiSpend24hMicros = vi.fn();

    const { rerender } = renderHook(
      ({ connections }) =>
        useModelDetailMetrics24h({
          connectionMetricsEnabled: true,
          model,
          connections,
          revision: 1,
          setConnectionMetricsLoading,
          setMetrics24hLoading,
          setConnectionMetrics24h,
          setKpiSummary24h,
          setKpiSpend24hMicros,
        }),
      {
        initialProps: {
          connections: [connection],
        },
      }
    );

    await waitFor(() => {
      expect(api.stats.summary).toHaveBeenCalledTimes(2);
      expect(api.stats.requests).toHaveBeenCalledTimes(1);
    });

    rerender({
      connections: [
        {
          ...connection,
          health_status: "healthy",
          last_health_check: "2026-03-15T10:00:00Z",
        },
      ],
    });

    await waitFor(() => {
      expect(api.stats.summary).toHaveBeenCalledTimes(2);
      expect(api.stats.requests).toHaveBeenCalledTimes(1);
    });
  });

  it("does not refetch connection metrics when the model object changes but the model id stays the same", async () => {
    const setConnectionMetricsLoading = vi.fn();
    const setMetrics24hLoading = vi.fn();
    const setConnectionMetrics24h = vi.fn();
    const setKpiSummary24h = vi.fn();
    const setKpiSpend24hMicros = vi.fn();

    const { rerender } = renderHook(
      ({ currentModel }) =>
        useModelDetailMetrics24h({
          connectionMetricsEnabled: true,
          model: currentModel,
          connections: [connection],
          revision: 1,
          setConnectionMetricsLoading,
          setMetrics24hLoading,
          setConnectionMetrics24h,
          setKpiSummary24h,
          setKpiSpend24hMicros,
        }),
      {
        initialProps: {
          currentModel: model,
        },
      }
    );

    await waitFor(() => {
      expect(api.stats.summary).toHaveBeenCalledTimes(2);
      expect(api.stats.requests).toHaveBeenCalledTimes(1);
    });

    rerender({
      currentModel: {
        ...model,
        connections: [connection],
      },
    });

    await waitFor(() => {
      expect(api.stats.summary).toHaveBeenCalledTimes(2);
      expect(api.stats.requests).toHaveBeenCalledTimes(1);
    });
  });
});
