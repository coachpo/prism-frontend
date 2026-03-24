import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearSharedReferenceData } from "@/lib/referenceData";
import type { SpendingSummary } from "@/lib/types";
import { useModelDetailBootstrap } from "../useModelDetailBootstrap";

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  return { promise, resolve };
}

const api = vi.hoisted(() => ({
  endpoints: {
    list: vi.fn(),
  },
  loadbalanceStrategies: {
    list: vi.fn(),
  },
  models: {
    get: vi.fn(),
    list: vi.fn(),
  },
  pricingTemplates: {
    list: vi.fn(),
  },
  stats: {
    spending: vi.fn(),
  },
}));

vi.mock("@/lib/api", () => ({ api }));
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

function buildLoadbalanceStrategySummary(overrides: Record<string, unknown> = {}) {
  return {
    id: 100,
    name: "single-primary",
    strategy_type: "single",
    failover_recovery_enabled: false,
    ...overrides,
  };
}

function buildLoadbalanceStrategy(overrides: Record<string, unknown> = {}) {
  return {
    ...buildLoadbalanceStrategySummary(overrides),
    profile_id: 1,
    attached_model_count: 1,
    created_at: "",
    updated_at: "",
  };
}

describe("useModelDetailBootstrap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSharedReferenceData();
    api.endpoints.list.mockResolvedValue([]);
    api.loadbalanceStrategies.list.mockResolvedValue([buildLoadbalanceStrategy()]);
    api.models.list.mockResolvedValue([]);
    api.pricingTemplates.list.mockResolvedValue([]);
  });

  afterEach(() => {
    clearSharedReferenceData();
  });

  it("ignores stale spending responses after switching models", async () => {
    const firstSpending = createDeferred<{
      summary: SpendingSummary;
      report_currency_symbol: string;
      report_currency_code: string;
    }>();

    api.models.get
      .mockResolvedValueOnce({
        id: 1,
        provider_id: 10,
        provider: { id: 10, provider_type: "openai", audit_enabled: false, created_at: "", updated_at: "" },
        model_id: "gpt-5.4",
        display_name: "GPT-5.4",
        model_type: "native",
        redirect_to: null,
        loadbalance_strategy_id: 100,
        loadbalance_strategy: buildLoadbalanceStrategySummary(),
        is_enabled: true,
        connections: [],
        created_at: "",
        updated_at: "",
      })
      .mockResolvedValueOnce({
        id: 2,
        provider_id: 20,
        provider: { id: 20, provider_type: "anthropic", audit_enabled: false, created_at: "", updated_at: "" },
        model_id: "claude-sonnet-4-6",
        display_name: "Claude Sonnet 4.6",
        model_type: "native",
        redirect_to: null,
        loadbalance_strategy_id: 101,
        loadbalance_strategy: buildLoadbalanceStrategySummary({
          id: 101,
          name: "single-secondary",
        }),
        is_enabled: true,
        connections: [],
        created_at: "",
        updated_at: "",
      });

    api.stats.spending
      .mockImplementationOnce(() => firstSpending.promise)
      .mockResolvedValueOnce({
        summary: {
          total_cost_micros: 222,
          successful_request_count: 2,
          priced_request_count: 2,
          unpriced_request_count: 0,
          total_input_tokens: 20,
          total_output_tokens: 30,
          total_cache_read_input_tokens: 0,
          total_cache_creation_input_tokens: 0,
          total_reasoning_tokens: 0,
          total_tokens: 50,
          avg_cost_per_successful_request_micros: 111,
        },
        groups: [],
        groups_total: 0,
        top_spending_models: [],
        top_spending_endpoints: [],
        unpriced_breakdown: {},
        report_currency_symbol: "$",
        report_currency_code: "USD",
      });

    const setSpending = vi.fn();
    const setConnectionMetricsEnabled = vi.fn();
    const setConnectionMetricsLoading = vi.fn();
    const setConnectionMetrics24h = vi.fn();

    const { rerender } = renderHook(
      ({ id, revision }) =>
        useModelDetailBootstrap({
          id,
          revision,
          navigate: vi.fn(),
          setModel: vi.fn(),
          setConnections: vi.fn(),
          setGlobalEndpoints: vi.fn(),
          setLoadbalanceStrategies: vi.fn(),
          setAllModels: vi.fn(),
          setPricingTemplates: vi.fn(),
          setLoading: vi.fn(),
          setSpending,
          setSpendingLoading: vi.fn(),
          setSpendingCurrencySymbol: vi.fn(),
          setSpendingCurrencyCode: vi.fn(),
          setConnectionMetricsEnabled,
          setConnectionMetricsLoading,
          setConnectionMetrics24h,
        }),
      {
        initialProps: {
          id: "1",
          revision: 1,
        },
      }
    );

    await waitFor(() => {
      expect(api.stats.spending).toHaveBeenCalledTimes(1);
    });

    rerender({ id: "2", revision: 2 });

    await waitFor(() => {
      expect(api.stats.spending).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(setSpending).toHaveBeenLastCalledWith({
        total_cost_micros: 222,
        successful_request_count: 2,
        priced_request_count: 2,
        unpriced_request_count: 0,
        total_input_tokens: 20,
        total_output_tokens: 30,
        total_cache_read_input_tokens: 0,
        total_cache_creation_input_tokens: 0,
        total_reasoning_tokens: 0,
        total_tokens: 50,
        avg_cost_per_successful_request_micros: 111,
      });
    });

    firstSpending.resolve({
      summary: {
        total_cost_micros: 111,
        successful_request_count: 1,
        priced_request_count: 1,
        unpriced_request_count: 0,
        total_input_tokens: 10,
        total_output_tokens: 15,
        total_cache_read_input_tokens: 0,
        total_cache_creation_input_tokens: 0,
        total_reasoning_tokens: 0,
        total_tokens: 25,
        avg_cost_per_successful_request_micros: 111,
      },
      report_currency_symbol: "$",
      report_currency_code: "USD",
    });

    await waitFor(() => {
      expect(setSpending).toHaveBeenLastCalledWith({
        total_cost_micros: 222,
        successful_request_count: 2,
        priced_request_count: 2,
        unpriced_request_count: 0,
        total_input_tokens: 20,
        total_output_tokens: 30,
        total_cache_read_input_tokens: 0,
        total_cache_creation_input_tokens: 0,
        total_reasoning_tokens: 0,
        total_tokens: 50,
        avg_cost_per_successful_request_micros: 111,
      });
    });

    expect(setConnectionMetricsEnabled).toHaveBeenCalledWith(false);
    expect(setConnectionMetricsLoading).toHaveBeenCalledWith(false);
    expect(setConnectionMetrics24h).toHaveBeenCalledWith(expect.any(Map));
  });

  it("resets connection metric opt-in state when switching models", async () => {
    api.models.get.mockResolvedValue({
      id: 1,
      provider_id: 10,
      provider: { id: 10, provider_type: "openai", audit_enabled: false, created_at: "", updated_at: "" },
      model_id: "gpt-5.4",
      display_name: "GPT-5.4",
      model_type: "native",
      redirect_to: null,
      loadbalance_strategy_id: 100,
      loadbalance_strategy: buildLoadbalanceStrategySummary(),
      is_enabled: true,
      connections: [],
      created_at: "",
      updated_at: "",
    });
    api.stats.spending.mockResolvedValue({
      summary: {
        total_cost_micros: 111,
        successful_request_count: 1,
        priced_request_count: 1,
        unpriced_request_count: 0,
        total_input_tokens: 10,
        total_output_tokens: 15,
        total_cache_read_input_tokens: 0,
        total_cache_creation_input_tokens: 0,
        total_reasoning_tokens: 0,
        total_tokens: 25,
        avg_cost_per_successful_request_micros: 111,
      },
      groups: [],
      groups_total: 0,
      top_spending_models: [],
      top_spending_endpoints: [],
      unpriced_breakdown: {},
      report_currency_symbol: "$",
      report_currency_code: "USD",
    });

    const setConnectionMetricsEnabled = vi.fn();

    const { rerender } = renderHook(
      ({ id, revision }) =>
        useModelDetailBootstrap({
          id,
          revision,
          navigate: vi.fn(),
           setModel: vi.fn(),
           setConnections: vi.fn(),
           setGlobalEndpoints: vi.fn(),
           setLoadbalanceStrategies: vi.fn(),
           setAllModels: vi.fn(),
           setPricingTemplates: vi.fn(),
           setLoading: vi.fn(),
          setSpending: vi.fn(),
          setSpendingLoading: vi.fn(),
          setSpendingCurrencySymbol: vi.fn(),
          setSpendingCurrencyCode: vi.fn(),
          setConnectionMetricsEnabled,
          setConnectionMetricsLoading: vi.fn(),
          setConnectionMetrics24h: vi.fn(),
        }),
      {
        initialProps: { id: "1", revision: 1 },
      }
    );

    await waitFor(() => {
      expect(api.models.get).toHaveBeenCalledTimes(1);
    });

    rerender({ id: "2", revision: 2 });

    await waitFor(() => {
      expect(setConnectionMetricsEnabled).toHaveBeenCalledTimes(2);
    });
  });

  it("keeps manual connection metric opt-in state during same-model refreshes", async () => {
    api.models.get.mockResolvedValue({
      id: 1,
      provider_id: 10,
      provider: { id: 10, provider_type: "openai", audit_enabled: false, created_at: "", updated_at: "" },
      model_id: "gpt-5.4",
      display_name: "GPT-5.4",
      model_type: "native",
      redirect_to: null,
      loadbalance_strategy_id: 100,
      loadbalance_strategy: buildLoadbalanceStrategySummary(),
      is_enabled: true,
      connections: [],
      created_at: "",
      updated_at: "",
    });
    api.stats.spending.mockResolvedValue({
      summary: {
        total_cost_micros: 111,
        successful_request_count: 1,
        priced_request_count: 1,
        unpriced_request_count: 0,
        total_input_tokens: 10,
        total_output_tokens: 15,
        total_cache_read_input_tokens: 0,
        total_cache_creation_input_tokens: 0,
        total_reasoning_tokens: 0,
        total_tokens: 25,
        avg_cost_per_successful_request_micros: 111,
      },
      groups: [],
      groups_total: 0,
      top_spending_models: [],
      top_spending_endpoints: [],
      unpriced_breakdown: {},
      report_currency_symbol: "$",
      report_currency_code: "USD",
    });

    const setConnectionMetricsEnabled = vi.fn();
    const setConnectionMetricsLoading = vi.fn();
    const setConnectionMetrics24h = vi.fn();

    const { result } = renderHook(() =>
      useModelDetailBootstrap({
        id: "1",
        revision: 1,
        navigate: vi.fn(),
        setModel: vi.fn(),
        setConnections: vi.fn(),
        setGlobalEndpoints: vi.fn(),
        setLoadbalanceStrategies: vi.fn(),
        setAllModels: vi.fn(),
        setPricingTemplates: vi.fn(),
        setLoading: vi.fn(),
        setSpending: vi.fn(),
        setSpendingLoading: vi.fn(),
        setSpendingCurrencySymbol: vi.fn(),
        setSpendingCurrencyCode: vi.fn(),
        setConnectionMetricsEnabled,
        setConnectionMetricsLoading,
        setConnectionMetrics24h,
      })
    );

    await waitFor(() => {
      expect(api.models.get).toHaveBeenCalledTimes(1);
    });

    setConnectionMetricsEnabled.mockClear();
    setConnectionMetricsLoading.mockClear();
    setConnectionMetrics24h.mockClear();

    await act(async () => {
      await result.current.fetchModel();
    });

    expect(api.models.get).toHaveBeenCalledTimes(2);
    expect(setConnectionMetricsEnabled).not.toHaveBeenCalled();
    expect(setConnectionMetricsLoading).not.toHaveBeenCalled();
    expect(setConnectionMetrics24h).not.toHaveBeenCalled();
  });
});
