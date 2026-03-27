import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  UsageSnapshotResponse,
  UsageStatisticsPageState,
} from "@/lib/types";
import { useUsageStatisticsPageData } from "../useUsageStatisticsPageData";

const api = vi.hoisted(() => ({
  stats: {
    usageSnapshot: vi.fn(),
  },
}));

vi.mock("@/lib/api", () => ({ api }));

function createState(
  overrides: Partial<UsageStatisticsPageState> = {},
): UsageStatisticsPageState {
  return {
    chartGranularity: {
      costOverview: "hourly",
      requestTrends: "hourly",
      tokenTypeBreakdown: "hourly",
      tokenUsageTrends: "hourly",
    },
    selectedModelLines: [],
    selectedTimeRange: "24h",
    ...overrides,
  };
}

function createSnapshot(): UsageSnapshotResponse {
  return {
    cost_overview: {
      daily: [
        {
          bucket_start: "2026-03-27T00:00:00Z",
          total_cost_micros: 4200,
        },
      ],
      hourly: [
        {
          bucket_start: "2026-03-27T11:00:00Z",
          total_cost_micros: 4200,
        },
      ],
      priced_request_count: 1,
      total_cost_micros: 4200,
      unpriced_request_count: 1,
    },
    currency: {
      code: "USD",
      symbol: "$",
    },
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
            request_count: 1,
            success_count: 1,
            success_rate: 100,
            total_cost_micros: 4200,
            total_tokens: 185,
          },
        ],
        request_count: 1,
        success_count: 1,
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
        request_count: 1,
        success_count: 1,
        success_rate: 100,
        total_cost_micros: 4200,
        total_tokens: 185,
      },
      {
        api_family: "anthropic",
        failed_count: 1,
        model_id: "claude-sonnet-4-6",
        model_label: "Claude Sonnet 4.6",
        request_count: 1,
        success_count: 0,
        success_rate: 0,
        total_cost_micros: 0,
        total_tokens: 60,
      },
    ],
    overview: {
      average_rpm: 0.005,
      average_tpm: 0.583,
      failed_requests: 1,
      input_tokens: 140,
      output_tokens: 70,
      cached_tokens: 25,
      reasoning_tokens: 10,
      success_rate: 50,
      success_requests: 1,
      total_cost_micros: 4200,
      total_requests: 2,
      total_tokens: 245,
    },
    proxy_api_key_statistics: [
      {
        failed_count: 1,
        key_prefix: "prism_pk_primary_1234",
        proxy_api_key_id: 77,
        proxy_api_key_label: "Primary runtime key",
        request_count: 2,
        success_count: 1,
        success_rate: 50,
        total_cost_micros: 4200,
        total_tokens: 245,
      },
    ],
    request_events: {
      items: [
        {
          api_family: "openai",
          attempt_count: 3,
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
              failed_count: 1,
              request_count: 2,
              rpm: 0.0014,
              success_count: 1,
            },
          ],
          total_requests: 2,
        },
        {
          key: "gpt-5.4",
          label: "GPT-5.4",
          points: [
            {
              bucket_start: "2026-03-27T00:00:00Z",
              failed_count: 0,
              request_count: 1,
              rpm: 0.0007,
              success_count: 1,
            },
          ],
          total_requests: 1,
        },
      ],
      hourly: [
        {
          key: "all",
          label: "All requests",
          points: [
            {
              bucket_start: "2026-03-27T11:00:00Z",
              failed_count: 1,
              request_count: 2,
              rpm: 2,
              success_count: 1,
            },
          ],
          total_requests: 2,
        },
        {
          key: "gpt-5.4",
          label: "GPT-5.4",
          points: [
            {
              bucket_start: "2026-03-27T11:00:00Z",
              failed_count: 0,
              request_count: 1,
              rpm: 1,
              success_count: 1,
            },
          ],
          total_requests: 1,
        },
        {
          key: "claude-sonnet-4-6",
          label: "Claude Sonnet 4.6",
          points: [
            {
              bucket_start: "2026-03-27T11:00:00Z",
              failed_count: 1,
              request_count: 1,
              rpm: 1,
              success_count: 0,
            },
          ],
          total_requests: 1,
        },
      ],
    },
    service_health: {
      availability_percentage: 50,
      daily: [
        {
          availability_percentage: 50,
          bucket_start: "2026-03-27T00:00:00Z",
          failed_count: 1,
          request_count: 2,
          success_count: 1,
        },
      ],
      failed_count: 1,
      request_count: 2,
      success_count: 1,
    },
    time_range: {
      end_at: "2026-03-27T12:00:00Z",
      preset: "7h",
      start_at: "2026-03-27T05:00:00Z",
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
              input_tokens: 100,
              output_tokens: 50,
              reasoning_tokens: 10,
              total_tokens: 185,
              tpm: 185,
            },
          ],
          total_tokens: 185,
        },
      ],
    },
  };
}

describe("useUsageStatisticsPageData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.stats.usageSnapshot.mockResolvedValue(createSnapshot());
  });

  it("fetches only the usage snapshot API and filters visible model lines from local page state", async () => {
    const { result } = renderHook(() =>
      useUsageStatisticsPageData({
        revision: 3,
        selectedProfileId: 1,
        state: createState({
          chartGranularity: {
            costOverview: "daily",
            requestTrends: "hourly",
            tokenTypeBreakdown: "hourly",
            tokenUsageTrends: "hourly",
          },
          selectedModelLines: ["gpt-5.4"],
          selectedTimeRange: "7h",
        }),
      }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(api.stats.usageSnapshot).toHaveBeenCalledWith({ preset: "7h" });
    expect(result.current.snapshot?.overview.total_requests).toBe(2);
    expect(result.current.availableModelLineIds).toEqual(["claude-sonnet-4-6", "gpt-5.4"]);
    expect(result.current.requestTrendSeries.map((series) => series.key)).toEqual([
      "all",
      "gpt-5.4",
    ]);
    expect(result.current.tokenUsageTrendSeries.map((series) => series.key)).toEqual([
      "all",
      "gpt-5.4",
    ]);
    expect(result.current.requestEvents[0]).toMatchObject({
      ingress_request_id: "ingress-success-1",
      request_logs_href: "/request-logs?ingress_request_id=ingress-success-1",
    });
  });
});
