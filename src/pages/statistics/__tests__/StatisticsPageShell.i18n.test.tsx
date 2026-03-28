import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import type {
  UsageCostOverviewPoint,
  UsageRequestTrendSeries,
  UsageSnapshotResponse,
  UsageTokenTrendSeries,
  UsageTokenTypeBreakdownPoint,
} from "@/lib/types";
import type { UsageStatisticsRequestEventRow } from "../useUsageStatisticsPageData";
import { StatisticsPage } from "@/pages/StatisticsPage";
import { installLocalStorageMock } from "./storage";

vi.mock("recharts", async () => {
  const actual = await vi.importActual<typeof import("recharts")>("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

const mockUsageState = {
  setChartGranularity: vi.fn(),
  setSelectedModelLines: vi.fn(),
  setSelectedTimeRange: vi.fn(),
  state: {
    chartGranularity: {
      costOverview: "hourly",
      requestTrends: "hourly",
      tokenTypeBreakdown: "hourly",
      tokenUsageTrends: "hourly",
    },
    selectedModelLines: ["gpt-5.4"],
    selectedTimeRange: "24h",
  },
  toggleSelectedModelLine: vi.fn(),
};

let mockUsageData: {
  availableModelLineIds: string[];
  costOverviewSeries: UsageCostOverviewPoint[];
  error: string | null;
  loading: boolean;
  refresh: ReturnType<typeof vi.fn>;
  requestEvents: UsageStatisticsRequestEventRow[];
  requestTrendSeries: UsageRequestTrendSeries[];
  selectedModelLineIds: string[];
  snapshot: UsageSnapshotResponse | null;
  tokenTypeBreakdown: UsageTokenTypeBreakdownPoint[];
  tokenUsageTrendSeries: UsageTokenTrendSeries[];
} = {
  availableModelLineIds: ["gpt-5.4", "claude-sonnet-4-6"],
  costOverviewSeries: [],
  error: null,
  loading: true,
  refresh: vi.fn(),
  requestEvents: [],
  requestTrendSeries: [],
  selectedModelLineIds: ["gpt-5.4"],
  snapshot: null,
  tokenTypeBreakdown: [],
  tokenUsageTrendSeries: [],
};

vi.mock("@/context/ProfileContext", () => ({
  useProfileContext: () => ({
    revision: 1,
    selectedProfile: { id: 1 },
  }),
}));

vi.mock("@/context/useAuth", () => ({
  useAuth: () => ({
    authEnabled: true,
  }),
}));

vi.mock("@/pages/statistics/useUsageStatisticsPageState", () => ({
  useUsageStatisticsPageState: () => mockUsageState,
}));

vi.mock("@/pages/statistics/useUsageStatisticsPageData", () => ({
  useUsageStatisticsPageData: () => mockUsageData,
}));

class ResizeObserverMock {
  disconnect() {}
  observe() {}
  unobserve() {}
}

function createSnapshot(): UsageSnapshotResponse {
  return {
    cost_overview: {
      daily: [{ bucket_start: "2026-03-27T00:00:00Z", total_cost_micros: 4200 }],
      hourly: [{ bucket_start: "2026-03-27T11:00:00Z", total_cost_micros: 4200 }],
      priced_request_count: 1,
      total_cost_micros: 4200,
      unpriced_request_count: 0,
    },
    currency: { code: "USD", symbol: "$" },
    endpoint_statistics: [
      {
        endpoint_id: 10,
        endpoint_label: "Primary Endpoint",
        failed_count: 0,
        models: [
          {
            failed_count: 0,
            model_id: "gpt-5.4",
            model_label: "GPT-5.4",
            request_count: 4,
            success_count: 4,
            success_rate: 100,
            total_cost_micros: 4200,
            total_tokens: 185,
          },
        ],
        request_count: 4,
        success_count: 4,
        success_rate: 100,
        total_cost_micros: 4200,
        total_tokens: 185,
      },
    ],
    generated_at: "2026-03-27T12:00:00Z",
    model_statistics: [
      {
        api_family: "openai",
        failed_count: 0,
        model_id: "gpt-5.4",
        model_label: "GPT-5.4",
        request_count: 4,
        success_count: 4,
        success_rate: 100,
        total_cost_micros: 4200,
        total_tokens: 185,
      },
    ],
    overview: {
      average_rpm: 0.016,
      average_tpm: 2.6,
      cached_tokens: 25,
      failed_requests: 0,
      input_tokens: 140,
      output_tokens: 70,
      reasoning_tokens: 10,
      rolling_request_count: 4,
      rolling_rpm: 4,
      rolling_token_count: 245,
      rolling_tpm: 245,
      rolling_window_minutes: 60,
      success_rate: 100,
      success_requests: 4,
      total_cost_micros: 4200,
      total_requests: 4,
      total_tokens: 245,
    },
    proxy_api_key_statistics: [
      {
        failed_count: 0,
        key_prefix: "prism_pk_primary_1234",
        proxy_api_key_id: 77,
        proxy_api_key_label: "Primary runtime key",
        request_count: 4,
        success_count: 4,
        success_rate: 100,
        total_cost_micros: 4200,
        total_tokens: 245,
      },
    ],
    request_events: {
      items: [
        {
          api_family: "openai",
          attempt_count: 1,
          cached_tokens: 25,
          connection_id: 12,
          created_at: "2026-03-27T11:00:00Z",
          endpoint_id: 10,
          endpoint_label: "Primary Endpoint",
          ingress_request_id: "ingress-success-1",
          input_tokens: 100,
          model_id: "gpt-5.4",
          model_label: "GPT-5.4",
          output_tokens: 50,
          proxy_api_key: {
            key_prefix: "prism_pk_primary_1234",
            label: "Primary runtime key",
          },
          reasoning_tokens: 10,
          request_path: "/v1/chat/completions",
          resolved_target_model_id: "gpt-5.4",
          status_code: 200,
          success_flag: true,
          total_cost_micros: 4200,
          total_tokens: 185,
        },
      ],
      total: 1,
    },
    request_trends: {
      daily: [
        {
          key: "all",
          label: "All requests",
          points: [
            {
              bucket_start: "2026-03-27T00:00:00Z",
              failed_count: 0,
              request_count: 4,
              rpm: 0.0028,
              success_count: 4,
            },
          ],
          total_requests: 4,
        },
        {
          key: "gpt-5.4",
          label: "GPT-5.4",
          points: [
            {
              bucket_start: "2026-03-27T00:00:00Z",
              failed_count: 0,
              request_count: 4,
              rpm: 0.0028,
              success_count: 4,
            },
          ],
          total_requests: 4,
        },
      ],
      hourly: [
        {
          key: "all",
          label: "All requests",
          points: [
            {
              bucket_start: "2026-03-27T11:00:00Z",
              failed_count: 0,
              request_count: 4,
              rpm: 4,
              success_count: 4,
            },
          ],
          total_requests: 4,
        },
        {
          key: "gpt-5.4",
          label: "GPT-5.4",
          points: [
            {
              bucket_start: "2026-03-27T11:00:00Z",
              failed_count: 0,
              request_count: 4,
              rpm: 4,
              success_count: 4,
            },
          ],
          total_requests: 4,
        },
      ],
    },
    service_health: {
      availability_percentage: 100,
      cells: [
        {
          availability_percentage: 100,
          bucket_start: "2026-03-27T00:00:00Z",
          failed_count: 0,
          request_count: 2,
          status: "ok",
          success_count: 2,
        },
        {
          availability_percentage: 50,
          bucket_start: "2026-03-27T00:15:00Z",
          failed_count: 1,
          request_count: 2,
          status: "degraded",
          success_count: 1,
        },
        {
          availability_percentage: 0,
          bucket_start: "2026-03-27T00:30:00Z",
          failed_count: 1,
          request_count: 1,
          status: "down",
          success_count: 0,
        },
        {
          availability_percentage: null,
          bucket_start: "2026-03-27T00:45:00Z",
          failed_count: 0,
          request_count: 0,
          status: "empty",
          success_count: 0,
        },
      ],
      daily: [
        {
          availability_percentage: 100,
          bucket_start: "2026-03-27T00:00:00Z",
          failed_count: 0,
          request_count: 4,
          success_count: 4,
        },
      ],
      days: 7,
      failed_count: 0,
      interval_minutes: 15,
      request_count: 4,
      success_count: 4,
    },
    time_range: {
      end_at: "2026-03-27T12:00:00Z",
      preset: "24h",
      start_at: "2026-03-26T12:00:00Z",
    },
    token_type_breakdown: {
      daily: [
        {
          bucket_start: "2026-03-27T00:00:00Z",
          cached_tokens: 25,
          input_tokens: 140,
          output_tokens: 70,
          reasoning_tokens: 10,
        },
      ],
      hourly: [
        {
          bucket_start: "2026-03-27T11:00:00Z",
          cached_tokens: 25,
          input_tokens: 140,
          output_tokens: 70,
          reasoning_tokens: 10,
        },
      ],
    },
    token_usage_trends: {
      daily: [
        {
          key: "all",
          label: "All requests",
          points: [
            {
              bucket_start: "2026-03-27T00:00:00Z",
              cached_tokens: 25,
              input_tokens: 140,
              output_tokens: 70,
              reasoning_tokens: 10,
              total_tokens: 245,
              tpm: 0.17,
            },
          ],
          total_tokens: 245,
        },
        {
          key: "gpt-5.4",
          label: "GPT-5.4",
          points: [
            {
              bucket_start: "2026-03-27T00:00:00Z",
              cached_tokens: 25,
              input_tokens: 140,
              output_tokens: 70,
              reasoning_tokens: 10,
              total_tokens: 245,
              tpm: 0.17,
            },
          ],
          total_tokens: 245,
        },
      ],
      hourly: [
        {
          key: "all",
          label: "All requests",
          points: [
            {
              bucket_start: "2026-03-27T11:00:00Z",
              cached_tokens: 25,
              input_tokens: 140,
              output_tokens: 70,
              reasoning_tokens: 10,
              total_tokens: 245,
              tpm: 245,
            },
          ],
          total_tokens: 245,
        },
        {
          key: "gpt-5.4",
          label: "GPT-5.4",
          points: [
            {
              bucket_start: "2026-03-27T11:00:00Z",
              cached_tokens: 25,
              input_tokens: 140,
              output_tokens: 70,
              reasoning_tokens: 10,
              total_tokens: 245,
              tpm: 245,
            },
          ],
          total_tokens: 245,
        },
      ],
    },
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <LocaleProvider>
        <StatisticsPage />
      </LocaleProvider>
    </MemoryRouter>,
  );
}

describe("StatisticsPage shell i18n", () => {
  beforeEach(() => {
    installLocalStorageMock();
    localStorage.clear();
    localStorage.setItem("prism.locale", "zh-CN");
    Object.defineProperty(globalThis, "ResizeObserver", {
      configurable: true,
      value: ResizeObserverMock,
      writable: true,
    });
    mockUsageData = {
      availableModelLineIds: ["gpt-5.4", "claude-sonnet-4-6"],
      costOverviewSeries: [],
      error: null,
      loading: true,
      refresh: vi.fn(),
      requestEvents: [],
      requestTrendSeries: [],
      selectedModelLineIds: ["gpt-5.4"],
      snapshot: null,
      tokenTypeBreakdown: [],
      tokenUsageTrendSeries: [],
    };
  });

  it("renders the single-page shell with loading, compact toolbar, and the Task 3 statistics hierarchy", () => {
    const { rerender } = renderPage();

    expect(screen.getByRole("heading", { name: "用量统计" })).toBeInTheDocument();
    expect(screen.getByText("基于最终请求的一体化用量快照，覆盖请求、令牌、成本、端点、模型和代理 API 密钥。"))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: "刷新用量统计" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /json/i })).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "usage-statistics-page-skeleton" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "运营" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "吞吐量" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "支出" })).not.toBeInTheDocument();

    mockUsageData = {
      ...mockUsageData,
      costOverviewSeries: createSnapshot().cost_overview.hourly,
      loading: false,
      requestEvents: [
        {
          ...createSnapshot().request_events.items[0],
          request_logs_href: "/request-logs?ingress_request_id=ingress-success-1",
        },
      ],
      requestTrendSeries: createSnapshot().request_trends.hourly,
      selectedModelLineIds: ["gpt-5.4"],
      snapshot: createSnapshot(),
      tokenTypeBreakdown: createSnapshot().token_type_breakdown.hourly,
      tokenUsageTrendSeries: createSnapshot().token_usage_trends.hourly,
    };

    rerender(
      <MemoryRouter>
        <LocaleProvider>
          <StatisticsPage />
        </LocaleProvider>
      </MemoryRouter>,
    );

    const overviewHeading = screen.getByRole("heading", { level: 2, name: "总览" });
    const modelLinesHeading = screen.getByRole("heading", { level: 2, name: "显示线路" });
    const serviceHealthHeading = screen.getByRole("heading", { level: 2, name: "服务健康" });
    const requestTrendsHeading = screen.getByRole("heading", { level: 2, name: "请求趋势" });
    const tokenBreakdownHeading = screen.getByRole("heading", { level: 2, name: "令牌类型拆分" });

    expect(screen.getAllByTestId("usage-kpi-card")).toHaveLength(5);
    expect(screen.getByTestId("usage-controls-toolbar")).toBeInTheDocument();
    const toolbar = screen.getByTestId("usage-controls-toolbar");
    expect(within(toolbar).getByRole("button", { name: /导出快照 json/i })).toBeInTheDocument();
    expect(within(toolbar).getByRole("button", { name: "刷新用量统计" })).toBeInTheDocument();
    expect(within(toolbar).getByTestId("usage-controls-updated").textContent).toContain("更新时间");
    expect(screen.getByTestId("usage-kpi-grid")).toBeInTheDocument();
    expect(screen.getAllByTestId("usage-kpi-dominant-card")).toHaveLength(2);
    expect(screen.getAllByTestId("usage-kpi-supporting-card")).toHaveLength(3);
    expect(screen.getByTestId("usage-model-line-section")).toBeInTheDocument();
    expect(screen.getByTestId("usage-trends-grid")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "显示线路" })).toHaveLength(1);
    expect(screen.getAllByText("1 / 9").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId("usage-health-heatmap")).toBeInTheDocument();
    expect(screen.getByTestId("usage-health-strip")).toBeInTheDocument();
    expect(screen.getByText("令牌用量趋势")).toBeInTheDocument();
    const tpmCard = screen
      .getAllByTestId("usage-kpi-card")
      .find((card) => within(card).queryByText("TPM"));
    expect(tpmCard).toBeDefined();
    expect(within(tpmCard as HTMLElement).getByText("令牌吞吐量: 245 · 60m")).toBeInTheDocument();
    expect(within(tpmCard as HTMLElement).queryByText("Current TPM: 245 · 60m")).not.toBeInTheDocument();
    expect(screen.getAllByText("成本概览")[0]).toBeInTheDocument();
    expect(screen.getByText("端点统计")).toBeInTheDocument();
    expect(screen.getByText("模型统计")).toBeInTheDocument();
    expect(screen.getByText("请求事件")).toBeInTheDocument();
    expect(screen.getByText("代理 API 密钥统计")).toBeInTheDocument();

    expect(overviewHeading.compareDocumentPosition(modelLinesHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(modelLinesHeading.compareDocumentPosition(serviceHealthHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(serviceHealthHeading.compareDocumentPosition(requestTrendsHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(requestTrendsHeading.compareDocumentPosition(tokenBreakdownHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
