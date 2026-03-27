import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import type { UsageSnapshotResponse } from "@/lib/types";
import { StatisticsPage } from "@/pages/StatisticsPage";
import { installLocalStorageMock } from "./storage";

vi.mock("recharts", async () => {
  const actual = await vi.importActual<typeof import("recharts")>("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

const api = vi.hoisted(() => ({
  stats: {
    usageSnapshot: vi.fn(),
  },
}));

vi.mock("@/lib/api", () => ({ api }));

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

class ResizeObserverMock {
  disconnect() {}
  observe() {}
  unobserve() {}
}

function createSnapshot(totalRequests: number, ingressRequestId: string, statusCode: number): UsageSnapshotResponse {
  return {
    cost_overview: {
      daily: [{ bucket_start: "2026-03-27T00:00:00Z", total_cost_micros: totalRequests * 1000 }],
      hourly: [{ bucket_start: "2026-03-27T11:00:00Z", total_cost_micros: totalRequests * 1000 }],
      priced_request_count: totalRequests,
      total_cost_micros: totalRequests * 1000,
      unpriced_request_count: 0,
    },
    currency: { code: "USD", symbol: "$" },
    endpoint_statistics: [
      {
        endpoint_id: 10,
        endpoint_label: "Primary Endpoint",
        failed_count: statusCode >= 400 ? 1 : 0,
        models: [
          {
            failed_count: statusCode >= 400 ? 1 : 0,
            model_id: "gpt-5.4",
            model_label: "GPT-5.4",
            request_count: totalRequests,
            success_count: statusCode >= 400 ? Math.max(0, totalRequests - 1) : totalRequests,
            success_rate: statusCode >= 400 ? 50 : 100,
            total_cost_micros: totalRequests * 1000,
            total_tokens: totalRequests * 100,
          },
        ],
        request_count: totalRequests,
        success_count: statusCode >= 400 ? Math.max(0, totalRequests - 1) : totalRequests,
        success_rate: statusCode >= 400 ? 50 : 100,
        total_cost_micros: totalRequests * 1000,
        total_tokens: totalRequests * 100,
      },
    ],
    generated_at: "2026-03-27T12:00:00Z",
    model_statistics: [
      {
        api_family: "openai",
        failed_count: statusCode >= 400 ? 1 : 0,
        model_id: "gpt-5.4",
        model_label: "GPT-5.4",
        request_count: totalRequests,
        success_count: statusCode >= 400 ? Math.max(0, totalRequests - 1) : totalRequests,
        success_rate: statusCode >= 400 ? 50 : 100,
        total_cost_micros: totalRequests * 1000,
        total_tokens: totalRequests * 100,
      },
    ],
    overview: {
      average_rpm: totalRequests,
      average_tpm: totalRequests * 100,
      cached_tokens: 0,
      failed_requests: statusCode >= 400 ? 1 : 0,
      input_tokens: totalRequests * 60,
      output_tokens: totalRequests * 40,
      reasoning_tokens: 0,
      success_rate: statusCode >= 400 ? 50 : 100,
      success_requests: statusCode >= 400 ? Math.max(0, totalRequests - 1) : totalRequests,
      total_cost_micros: totalRequests * 1000,
      total_requests: totalRequests,
      total_tokens: totalRequests * 100,
    },
    proxy_api_key_statistics: [
      {
        failed_count: statusCode >= 400 ? 1 : 0,
        key_prefix: "prism_pk_primary_1234",
        proxy_api_key_id: 77,
        proxy_api_key_label: "Primary runtime key",
        request_count: totalRequests,
        success_count: statusCode >= 400 ? Math.max(0, totalRequests - 1) : totalRequests,
        success_rate: statusCode >= 400 ? 50 : 100,
        total_cost_micros: totalRequests * 1000,
        total_tokens: totalRequests * 100,
      },
    ],
    request_events: {
      items: [
        {
          api_family: "openai",
          attempt_count: statusCode >= 400 ? 2 : 1,
          cached_tokens: 0,
          connection_id: 12,
          created_at: "2026-03-27T11:00:00Z",
          endpoint_id: 10,
          endpoint_label: "Primary Endpoint",
          ingress_request_id: ingressRequestId,
          input_tokens: totalRequests * 60,
          model_id: "gpt-5.4",
          model_label: "GPT-5.4",
          output_tokens: totalRequests * 40,
          proxy_api_key: {
            key_prefix: "prism_pk_primary_1234",
            label: "Primary runtime key",
          },
          reasoning_tokens: 0,
          request_path: "/v1/chat/completions",
          resolved_target_model_id: "gpt-5.4",
          status_code: statusCode,
          success_flag: statusCode < 400,
          total_cost_micros: totalRequests * 1000,
          total_tokens: totalRequests * 100,
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
              failed_count: statusCode >= 400 ? 1 : 0,
              request_count: totalRequests,
              rpm: totalRequests / 24,
              success_count: statusCode >= 400 ? Math.max(0, totalRequests - 1) : totalRequests,
            },
          ],
          total_requests: totalRequests,
        },
      ],
      hourly: [
        {
          key: "all",
          label: "All requests",
          points: [
            {
              bucket_start: "2026-03-27T11:00:00Z",
              failed_count: statusCode >= 400 ? 1 : 0,
              request_count: totalRequests,
              rpm: totalRequests,
              success_count: statusCode >= 400 ? Math.max(0, totalRequests - 1) : totalRequests,
            },
          ],
          total_requests: totalRequests,
        },
      ],
    },
    service_health: {
      availability_percentage: statusCode >= 400 ? 50 : 100,
      daily: [
        {
          availability_percentage: statusCode >= 400 ? 50 : 100,
          bucket_start: "2026-03-27T00:00:00Z",
          failed_count: statusCode >= 400 ? 1 : 0,
          request_count: totalRequests,
          success_count: statusCode >= 400 ? Math.max(0, totalRequests - 1) : totalRequests,
        },
      ],
      failed_count: statusCode >= 400 ? 1 : 0,
      request_count: totalRequests,
      success_count: statusCode >= 400 ? Math.max(0, totalRequests - 1) : totalRequests,
    },
    time_range: {
      end_at: "2026-03-27T12:00:00Z",
      preset: "24h",
      start_at: "2026-03-26T12:00:00Z",
    },
    token_type_breakdown: {
      daily: [{ bucket_start: "2026-03-27T00:00:00Z", cached_tokens: 0, input_tokens: totalRequests * 60, output_tokens: totalRequests * 40, reasoning_tokens: 0 }],
      hourly: [{ bucket_start: "2026-03-27T11:00:00Z", cached_tokens: 0, input_tokens: totalRequests * 60, output_tokens: totalRequests * 40, reasoning_tokens: 0 }],
    },
    token_usage_trends: {
      daily: [
        {
          key: "all",
          label: "All requests",
          points: [
            {
              bucket_start: "2026-03-27T00:00:00Z",
              cached_tokens: 0,
              input_tokens: totalRequests * 60,
              output_tokens: totalRequests * 40,
              reasoning_tokens: 0,
              total_tokens: totalRequests * 100,
              tpm: totalRequests * 100,
            },
          ],
          total_tokens: totalRequests * 100,
        },
      ],
      hourly: [
        {
          key: "all",
          label: "All requests",
          points: [
            {
              bucket_start: "2026-03-27T11:00:00Z",
              cached_tokens: 0,
              input_tokens: totalRequests * 60,
              output_tokens: totalRequests * 40,
              reasoning_tokens: 0,
              total_tokens: totalRequests * 100,
              tpm: totalRequests * 100,
            },
          ],
          total_tokens: totalRequests * 100,
        },
      ],
    },
  };
}

describe("StatisticsPage refresh flow", () => {
  beforeEach(() => {
    installLocalStorageMock();
    localStorage.clear();
    vi.clearAllMocks();
    Object.defineProperty(globalThis, "ResizeObserver", {
      configurable: true,
      value: ResizeObserverMock,
      writable: true,
    });
  });

  it("re-fetches the usage snapshot and updates the visible request-event data when refreshed", async () => {
    api.stats.usageSnapshot
      .mockResolvedValueOnce(createSnapshot(2, "ingress-success-1", 200))
      .mockResolvedValueOnce(createSnapshot(9, "ingress-success-2", 503));

    render(
      <MemoryRouter>
        <LocaleProvider>
          <StatisticsPage />
        </LocaleProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("ingress-success-1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Refresh usage statistics" }));

    await waitFor(() => {
      expect(api.stats.usageSnapshot).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(screen.getByText("ingress-success-2")).toBeInTheDocument();
      expect(screen.getByText("503")).toBeInTheDocument();
    });

    expect(screen.queryByText("ingress-success-1")).not.toBeInTheDocument();
  });
});
