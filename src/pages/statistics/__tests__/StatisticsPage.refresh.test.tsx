import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
  settings: {
    timezone: {
      get: vi.fn(),
    },
  },
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

class ResizeObserverMock {
  disconnect() {}
  observe() {}
  unobserve() {}
}

function createSnapshot(
  totalRequests: number,
  endpointLabel: string,
  proxyLabel: string,
  statusCode: number,
): UsageSnapshotResponse {
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
        endpoint_label: endpointLabel,
        models: [
          {
            model_id: "gpt-5.4",
            model_label: "GPT-5.4",
            request_count: totalRequests,
            success_rate: statusCode >= 400 ? 50 : 100,
            total_cost_micros: totalRequests * 1000,
            total_tokens: totalRequests * 100,
          },
        ],
        request_count: totalRequests,
        success_rate: statusCode >= 400 ? 50 : 100,
        total_cost_micros: totalRequests * 1000,
        total_tokens: totalRequests * 100,
      },
    ],
    generated_at: "2026-03-27T12:00:00Z",
    model_statistics: [
      {
        model_id: "gpt-5.4",
        model_label: "GPT-5.4",
        request_count: totalRequests,
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
        proxy_api_key_id: 77,
        proxy_api_key_label: proxyLabel,
        request_count: totalRequests,
        success_rate: statusCode >= 400 ? 50 : 100,
        total_cost_micros: totalRequests * 1000,
        total_tokens: totalRequests * 100,
      },
    ],
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
      cells: [
        {
          availability_percentage: statusCode >= 400 ? 50 : 100,
          bucket_start: "2026-03-27T11:45:00Z",
          failed_count: statusCode >= 400 ? 1 : 0,
          request_count: totalRequests,
          status: statusCode >= 400 ? "degraded" : "ok",
          success_count: statusCode >= 400 ? Math.max(0, totalRequests - 1) : totalRequests,
        },
      ],
      failed_count: statusCode >= 400 ? 1 : 0,
      interval_minutes: 15,
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
    api.settings.timezone.get.mockResolvedValue({ timezone_preference: "UTC" });
    Object.defineProperty(globalThis, "ResizeObserver", {
      configurable: true,
      value: ResizeObserverMock,
      writable: true,
    });
  });

  it("re-fetches the usage snapshot and updates the surviving table surfaces when refreshed", async () => {
    api.stats.usageSnapshot
      .mockResolvedValueOnce(createSnapshot(2, "Primary Endpoint", "Primary runtime key", 200))
      .mockResolvedValueOnce(createSnapshot(9, "Fallback Endpoint", "Fallback runtime key", 503));

    render(
      <MemoryRouter>
        <LocaleProvider>
          <StatisticsPage />
        </LocaleProvider>
      </MemoryRouter>,
    );

    const endpointTable = await screen.findByTestId("statistics-endpoint-table");
    const proxyKeyTable = await screen.findByTestId("statistics-proxy-key-table");

    await waitFor(() => {
      expect(within(endpointTable).getByText("Primary Endpoint")).toBeInTheDocument();
      expect(within(proxyKeyTable).getByText("Primary runtime key")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Refresh usage statistics" }));

    await waitFor(() => {
      expect(api.stats.usageSnapshot).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(within(endpointTable).getByText("Fallback Endpoint")).toBeInTheDocument();
      expect(within(proxyKeyTable).getByText("Fallback runtime key")).toBeInTheDocument();
    });

    expect(within(endpointTable).queryByText("Primary Endpoint")).not.toBeInTheDocument();
    expect(within(proxyKeyTable).queryByText("Primary runtime key")).not.toBeInTheDocument();
  });
});
