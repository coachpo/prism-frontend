import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import type { UsageServiceHealth } from "@/lib/types";
import { UsageServiceHealthSection } from "@/pages/statistics/sections/UsageServiceHealthSection";
import { installLocalStorageMock } from "./storage";

class ResizeObserverMock {
  disconnect() {}
  observe() {}
  unobserve() {}
}

function createServiceHealth(): UsageServiceHealth {
  return {
    availability_percentage: 91.7,
    cells: [
      {
        availability_percentage: 0,
        bucket_start: "2026-03-21T00:30:00Z",
        failed_count: 4,
        request_count: 4,
        status: "down",
        success_count: 0,
      },
      {
        availability_percentage: 75,
        bucket_start: "2026-03-20T00:15:00Z",
        failed_count: 3,
        request_count: 12,
        status: "degraded",
        success_count: 9,
      },
      {
        availability_percentage: 100,
        bucket_start: "2026-03-21T00:00:00Z",
        failed_count: 0,
        request_count: 8,
        status: "ok",
        success_count: 8,
      },
      {
        availability_percentage: null,
        bucket_start: "2026-03-20T00:45:00Z",
        failed_count: 0,
        request_count: 0,
        status: "empty",
        success_count: 0,
      },
    ],
    daily: [
      {
        availability_percentage: 91.7,
        bucket_start: "2026-03-21T00:00:00Z",
        failed_count: 7,
        request_count: 24,
        success_count: 17,
      },
    ],
    days: 7,
    failed_count: 7,
    interval_minutes: 15,
    request_count: 24,
    success_count: 17,
  };
}

describe("UsageServiceHealthSection", () => {
  beforeEach(() => {
    installLocalStorageMock();
    localStorage.clear();
    Object.defineProperty(globalThis, "ResizeObserver", {
      configurable: true,
      value: ResizeObserverMock,
      writable: true,
    });
  });

  it("renders a DOM heatmap strip with tooltip details for each service-health bucket", () => {
    render(
      <LocaleProvider>
        <UsageServiceHealthSection serviceHealth={createServiceHealth()} />
      </LocaleProvider>,
    );

    expect(screen.getByRole("heading", { name: "Service Health" })).toBeInTheDocument();
    expect(screen.getByTestId("usage-health-heatmap")).toBeInTheDocument();
    expect(screen.getByTestId("usage-health-strip")).toBeInTheDocument();
    expect(screen.getByTestId("usage-health-legend")).toBeInTheDocument();
    expect(screen.getByText("OK")).toBeInTheDocument();
    expect(screen.getByText("Degraded")).toBeInTheDocument();
    expect(screen.getByText("Down")).toBeInTheDocument();
    expect(screen.getByText("Idle")).toBeInTheDocument();

    const cells = screen.getAllByTestId("usage-health-cell");
    expect(cells).toHaveLength(4);
    const dayRows = screen.getAllByTestId("usage-health-day-row");
    expect(dayRows).toHaveLength(2);
    expect(within(dayRows[0]).getAllByTestId("usage-health-cell").map((cell) => cell.dataset.status)).toEqual([
      "degraded",
      "empty",
    ]);
    expect(within(dayRows[1]).getAllByTestId("usage-health-cell").map((cell) => cell.dataset.status)).toEqual([
      "ok",
      "down",
    ]);
    expect(cells[0].tagName).toBe("BUTTON");
    expect(screen.getByText("24")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();

    fireEvent.focus(within(dayRows[0]).getAllByTestId("usage-health-cell")[0]);

    expect(screen.getAllByText("Availability 75.0%")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Requests 12")[0]).toBeInTheDocument();
    expect(screen.getAllByText("9 successful · 3 failed")[0]).toBeInTheDocument();
    expect(screen.getAllByText(/15m/)[0]).toBeInTheDocument();
  });

  it("localizes service-health status labels in zh-CN", () => {
    localStorage.setItem("prism.locale", "zh-CN");

    render(
      <LocaleProvider>
        <UsageServiceHealthSection serviceHealth={createServiceHealth()} />
      </LocaleProvider>,
    );

    expect(screen.getByRole("heading", { name: "服务健康" })).toBeInTheDocument();
    expect(screen.getByText("正常")).toBeInTheDocument();
    expect(screen.getByText("降级")).toBeInTheDocument();
    expect(screen.getByText("故障")).toBeInTheDocument();
    expect(screen.getByText("空闲")).toBeInTheDocument();
  });
});
