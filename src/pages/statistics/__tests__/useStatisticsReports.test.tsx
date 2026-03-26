import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useStatisticsReports } from "../useStatisticsReports";
import type { StatisticsPageState } from "../useStatisticsPageState";

const apiMocks = vi.hoisted(() => ({
  operationsRequests: vi.fn(),
  fullRequestLogs: vi.fn(),
  throughput: vi.fn(),
  spending: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  api: {
    stats: {
      operationsRequests: apiMocks.operationsRequests,
      requests: apiMocks.fullRequestLogs,
      spending: apiMocks.spending,
      throughput: apiMocks.throughput,
    },
  },
}));

function createState(): StatisticsPageState {
  return {
    activeTab: "operations",
    apiFamily: "openai",
    clearOperationsFilters: vi.fn(),
    clearSpendingFilters: vi.fn(),
    connectionId: "12",
    modelId: "gpt-5.4",
    operationsStatusFilter: "all",
    setActiveTab: vi.fn(),
    setApiFamily: vi.fn(),
    setConnectionId: vi.fn(),
    setModelId: vi.fn(),
    setOperationsStatusFilter: vi.fn(),
    setSpecialTokenFilter: vi.fn(),
    setSpendingApiFamily: vi.fn(),
    setSpendingConnectionId: vi.fn(),
    setSpendingFrom: vi.fn(),
    setSpendingGroupBy: vi.fn(),
    setSpendingLimit: vi.fn(),
    setSpendingModelId: vi.fn(),
    setSpendingOffset: vi.fn(),
    setSpendingPreset: vi.fn(),
    setSpendingTo: vi.fn(),
    setSpendingTopN: vi.fn(),
    setTimeRange: vi.fn(),
    specialTokenFilter: "all",
    spendingApiFamily: "all",
    spendingConnectionId: "",
    spendingFrom: "",
    spendingGroupBy: "model",
    spendingLimit: 25,
    spendingModelId: "",
    spendingOffset: 0,
    spendingPreset: "last_7_days",
    spendingTo: "",
    spendingTopN: 5,
    timeRange: "24h",
  };
}

describe("useStatisticsReports", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    apiMocks.operationsRequests.mockReset();
    apiMocks.fullRequestLogs.mockReset();
    apiMocks.throughput.mockReset();
    apiMocks.spending.mockReset();

    apiMocks.operationsRequests.mockResolvedValue({
      items: [
        {
          id: 42,
          model_id: "gpt-5.4",
          api_family: "openai",
          status_code: 200,
          response_time_ms: 1234,
          input_tokens: 10,
          output_tokens: 20,
          total_tokens: 30,
          cache_read_input_tokens: 0,
          cache_creation_input_tokens: 0,
          reasoning_tokens: 0,
          total_cost_user_currency_micros: 123000,
          error_detail: null,
          created_at: "2026-03-16T00:00:00Z",
        },
      ],
      total: 1,
      limit: 200,
      offset: 0,
    });

    apiMocks.throughput.mockResolvedValue({
      average_rpm: 0,
      peak_rpm: 0,
      current_rpm: 0,
      total_requests: 0,
      time_window_seconds: 3600,
      buckets: [],
    });

    apiMocks.spending.mockResolvedValue({
      summary: {
        total_cost_micros: 0,
        successful_request_count: 0,
        priced_request_count: 0,
        unpriced_request_count: 0,
        total_input_tokens: 0,
        total_output_tokens: 0,
        total_cache_read_input_tokens: 0,
        total_cache_creation_input_tokens: 0,
        total_reasoning_tokens: 0,
        total_tokens: 0,
        avg_cost_per_successful_request_micros: 0,
      },
      groups: [],
      groups_total: 0,
      top_spending_models: [],
      top_spending_endpoints: [],
      unpriced_breakdown: {},
      report_currency_code: "USD",
      report_currency_symbol: "$",
    });
  });

  it("loads the operations sample endpoint with a reduced default limit", async () => {
    const latestOperationsLogIdRef = { current: 0 };

    const { result } = renderHook(() =>
      useStatisticsReports({
        latestOperationsLogIdRef,
        revision: 1,
        state: createState(),
      })
    );

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(apiMocks.operationsRequests).toHaveBeenCalledWith({
      model_id: "gpt-5.4",
      api_family: "openai",
      connection_id: 12,
      from_time: expect.any(String),
      limit: 200,
    });
    expect(apiMocks.fullRequestLogs).not.toHaveBeenCalled();
    expect(result.current.logs).toHaveLength(1);
    expect(latestOperationsLogIdRef.current).toBe(42);
  });
});
