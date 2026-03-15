import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useStatisticsPageData } from "../useStatisticsPageData";
import type { StatisticsPageState } from "../useStatisticsPageState";

const fetchOperationsLogs = vi.fn(async () => undefined);
const fetchThroughputData = vi.fn(async () => undefined);
const fetchSpendingData = vi.fn(async () => undefined);

let latestPoll: (() => Promise<void>) | undefined;

const statisticsReportsState = {
  fetchOperationsLogs,
  fetchSpendingData,
  fetchThroughputData,
  logs: [],
  operationsLoading: false,
  spending: null,
  spendingError: null,
  spendingLoading: false,
  spendingUpdatedAt: null,
  throughput: null,
  throughputLoading: false,
};

vi.mock("../useStatisticsFilterOptions", () => ({
  useStatisticsFilterOptions: () => ({
    connections: [],
    models: [],
    providers: [],
  }),
}));

vi.mock("../useStatisticsReports", () => ({
  useStatisticsReports: () => statisticsReportsState,
}));

vi.mock("@/hooks/usePolling", () => ({
  usePolling: ({ onPoll }: { onPoll: () => Promise<void> }) => {
    latestPoll = onPoll;
    return { isPolling: false };
  },
}));

function createState(activeTab: StatisticsPageState["activeTab"]): StatisticsPageState {
  return {
    activeTab,
    clearOperationsFilters: vi.fn(),
    clearSpendingFilters: vi.fn(),
    connectionId: "__all__",
    modelId: "__all__",
    operationsStatusFilter: "all",
    providerType: "all",
    setActiveTab: vi.fn(),
    setConnectionId: vi.fn(),
    setModelId: vi.fn(),
    setOperationsStatusFilter: vi.fn(),
    setProviderType: vi.fn(),
    setSpecialTokenFilter: vi.fn(),
    setSpendingConnectionId: vi.fn(),
    setSpendingFrom: vi.fn(),
    setSpendingGroupBy: vi.fn(),
    setSpendingLimit: vi.fn(),
    setSpendingModelId: vi.fn(),
    setSpendingOffset: vi.fn(),
    setSpendingPreset: vi.fn(),
    setSpendingProviderType: vi.fn(),
    setSpendingTo: vi.fn(),
    setSpendingTopN: vi.fn(),
    setTimeRange: vi.fn(),
    specialTokenFilter: "all",
    spendingConnectionId: "",
    spendingFrom: "",
    spendingGroupBy: "model",
    spendingLimit: 25,
    spendingModelId: "",
    spendingOffset: 0,
    spendingPreset: "last_7_days",
    spendingProviderType: "all",
    spendingTo: "",
    spendingTopN: 5,
    timeRange: "24h",
  };
}

describe("useStatisticsPageData", () => {
  beforeEach(() => {
    latestPoll = undefined;
    fetchOperationsLogs.mockClear();
    fetchThroughputData.mockClear();
    fetchSpendingData.mockClear();
    statisticsReportsState.logs = [];
    statisticsReportsState.operationsLoading = false;
    statisticsReportsState.spending = null;
    statisticsReportsState.spendingError = null;
    statisticsReportsState.spendingLoading = false;
    statisticsReportsState.spendingUpdatedAt = null;
    statisticsReportsState.throughput = null;
    statisticsReportsState.throughputLoading = false;
  });

  it("polls and refreshes only the active tab while exposing refresh-all separately", async () => {
    const { result, rerender } = renderHook(
      ({ state }) =>
        useStatisticsPageData({
          revision: 1,
          state,
        }),
      {
        initialProps: {
          state: createState("operations"),
        },
      }
    );

    await act(async () => {
      await latestPoll?.();
    });

    expect(fetchOperationsLogs).toHaveBeenCalledWith({ silent: true });
    expect(fetchThroughputData).not.toHaveBeenCalled();
    expect(fetchSpendingData).not.toHaveBeenCalled();

    rerender({
      state: createState("throughput"),
    });

    await act(async () => {
      await latestPoll?.();
    });

    expect(fetchThroughputData).toHaveBeenCalledWith({ silent: true });
    expect(fetchSpendingData).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.refreshAll();
    });

    expect(fetchOperationsLogs).toHaveBeenCalledTimes(2);
    expect(fetchThroughputData).toHaveBeenCalledTimes(2);
    expect(fetchSpendingData).toHaveBeenCalledTimes(1);
  });

  it("exposes tab-scoped manual refresh handlers", async () => {
    const { result } = renderHook(() =>
      useStatisticsPageData({
        revision: 1,
        state: createState("spending"),
      })
    );

    await act(async () => {
      await result.current.operationsTabProps.manualRefresh();
      await result.current.refreshThroughput();
      await result.current.spendingTabProps.manualRefresh();
    });

    expect(fetchOperationsLogs).toHaveBeenCalledWith({ silent: true });
    expect(fetchThroughputData).toHaveBeenCalledWith({ silent: true });
    expect(fetchSpendingData).toHaveBeenCalledWith({ silent: true });
  });

  it("shows initial loading for the active throughput tab before data arrives", () => {
    statisticsReportsState.throughputLoading = true;

    const { result } = renderHook(() =>
      useStatisticsPageData({
        revision: 1,
        state: createState("throughput"),
      })
    );

    expect(result.current.showInitialLoading).toBe(true);
  });
});
