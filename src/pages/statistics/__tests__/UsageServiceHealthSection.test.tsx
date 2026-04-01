import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import type { UsageServiceHealth } from "@/lib/types";
import { UsageServiceHealthSection } from "@/pages/statistics/sections/UsageServiceHealthSection";
import { installLocalStorageMock } from "./storage";

const OriginalDateTimeFormat = Intl.DateTimeFormat;

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
        availability_percentage: 75,
        bucket_start: "2026-03-20T12:00:00Z",
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
        availability_percentage: 0,
        bucket_start: "2026-03-21T12:00:00Z",
        failed_count: 4,
        request_count: 4,
        status: "down",
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
    days: 2,
    failed_count: 7,
    interval_minutes: 720,
    request_count: 24,
    success_count: 17,
  };
}

describe("UsageServiceHealthSection", () => {
  beforeEach(() => {
    installLocalStorageMock();
    localStorage.clear();
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    vi.stubGlobal("innerHeight", 800);
    vi.stubGlobal("innerWidth", 1280);
    Object.defineProperty(globalThis, "ResizeObserver", {
      configurable: true,
      value: ResizeObserverMock,
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(Intl, "DateTimeFormat", {
      configurable: true,
      value: OriginalDateTimeFormat,
      writable: true,
    });
    vi.unstubAllGlobals();
  });

  it("renders a compact service-health card with an upstream-style row-per-day heatmap, legend, and a single active tooltip", async () => {
    const { container } = render(
      <LocaleProvider>
        <UsageServiceHealthSection serviceHealth={createServiceHealth()} />
      </LocaleProvider>,
    );

    const metricCards = container.querySelectorAll('[data-slot="metric-card"]');
    expect(metricCards).toHaveLength(0);

    expect(screen.getByRole("heading", { name: "Service Health" })).toBeInTheDocument();
    expect(screen.getByTestId("usage-service-health-card")).toBeInTheDocument();
    expect(screen.queryByTestId("usage-health-inline-legend")).not.toBeInTheDocument();
    expect(screen.queryByTestId("usage-health-summary-tiles")).not.toBeInTheDocument();
    expect(screen.queryByTestId("usage-health-scroll-window")).not.toBeInTheDocument();
    expect(screen.queryByTestId("usage-health-time-direction")).not.toBeInTheDocument();

    expect(screen.getByTestId("usage-health-header-meta")).toBeInTheDocument();
    expect(screen.getByTestId("usage-health-window-label")).toHaveTextContent("Last 2 days");
    expect(screen.getByTestId("usage-service-health-card").querySelector('[data-slot="card-header"]')).not.toHaveClass("border-b");

    const availabilityBadge = screen.getByTestId("usage-health-availability-badge");
    expect(within(availabilityBadge).getByText("91.7%")).toBeInTheDocument();
    expect(within(availabilityBadge).queryByText("Availability")).not.toBeInTheDocument();
    expect(screen.queryByTestId("usage-health-availability-value")).not.toBeInTheDocument();

    expect(screen.queryByTestId("usage-health-strip")).not.toBeInTheDocument();

    const gridScroll = screen.getByTestId("usage-health-grid-scroll");
    expect(gridScroll).toHaveAttribute("data-slot", "scroll-area");

    const calendar = screen.getByTestId("usage-health-heatmap-calendar");
    expect(calendar).toBeInTheDocument();

    const grid = screen.getByTestId("usage-health-grid");
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveAccessibleName("Service Health");
    expect(grid).not.toHaveAttribute("data-rows");
    expect(calendar).toContainElement(grid);

    const rows = within(grid).getAllByTestId("usage-health-row");
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => within(row).getAllByTestId("usage-health-cell").map((cell) => cell.dataset.status))).toEqual([
      ["empty", "degraded"],
      ["ok", "down"],
    ]);

    const legend = screen.getByTestId("usage-health-legend");
    expect(within(legend).getByTestId("usage-health-legend-less")).toHaveTextContent("Lower availability");
    expect(within(legend).getByTestId("usage-health-legend-more")).toHaveTextContent("Higher availability");
    expect(within(legend).queryByText("Oldest")).not.toBeInTheDocument();
    expect(within(legend).queryByText("Latest")).not.toBeInTheDocument();
    expect(within(legend).queryByText("OK")).not.toBeInTheDocument();
    expect(within(legend).queryByText("Degraded")).not.toBeInTheDocument();
    expect(within(legend).queryByText("Down")).not.toBeInTheDocument();
    expect(within(legend).queryByText("Idle")).not.toBeInTheDocument();
    expect(within(legend).getAllByTestId("usage-health-legend-swatch").map((item) => item.dataset.level)).toEqual([
      "0",
      "1",
      "2",
      "3",
      "4",
    ]);

    const cells = within(grid).getAllByTestId("usage-health-cell");
    expect(cells).toHaveLength(4);
    expect(cells[0]).toHaveStyle({ backgroundColor: "rgb(203, 213, 225)" });
    expect(cells[1]).toHaveStyle({ backgroundColor: "rgb(142, 201, 58)" });
    expect(cells[2]).toHaveStyle({ backgroundColor: "rgb(34, 197, 94)" });
    expect(cells[3]).toHaveStyle({ backgroundColor: "rgb(239, 68, 68)" });

    fireEvent.focus(cells[1]);

    const degradedTooltip = await screen.findByTestId("usage-health-tooltip");
    expect(screen.getAllByRole("tooltip")).toHaveLength(1);
    expect(degradedTooltip).toHaveTextContent("Degraded");
    expect(degradedTooltip).toHaveTextContent("Availability 75.0%");
    expect(degradedTooltip).toHaveTextContent("Requests 12");
    expect(degradedTooltip).toHaveTextContent("9 successful · 3 failed");
    expect(degradedTooltip).toHaveTextContent(/12 hours/);

    fireEvent.focus(cells[3]);

    const downTooltip = await screen.findByTestId("usage-health-tooltip");
    expect(downTooltip).toHaveTextContent("Down");
    expect(downTooltip).toHaveTextContent("Availability 0.0%");
    expect(screen.queryByText("Availability 75.0%")).not.toBeInTheDocument();
    expect(screen.getAllByRole("tooltip")).toHaveLength(1);
  });

  it("renders a full idle heatmap instead of an empty state when there is no traffic", () => {
    render(
      <LocaleProvider>
        <UsageServiceHealthSection
          serviceHealth={{
            ...createServiceHealth(),
            availability_percentage: null,
            cells: [],
            failed_count: 0,
            request_count: 0,
            success_count: 0,
          }}
        />
      </LocaleProvider>,
    );

    expect(screen.queryByText("No data available")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("usage-health-cell")).toHaveLength(4);
    expect(screen.getAllByTestId("usage-health-cell").every((cell) => cell.dataset.status === "empty")).toBe(true);
    expect(screen.getAllByTestId("usage-health-cell").every((cell) => cell.style.backgroundColor === "rgb(203, 213, 225)")).toBe(true);
  });

  it("keeps null availability distinct from zero request and error totals", async () => {
    const serviceHealth = createServiceHealth();

    render(
      <LocaleProvider>
        <UsageServiceHealthSection
          serviceHealth={{
            ...serviceHealth,
            availability_percentage: null,
            failed_count: 0,
            request_count: 0,
          }}
        />
      </LocaleProvider>,
    );

    expect(screen.getByTestId("usage-health-availability-badge")).toHaveTextContent("—");
    expect(within(screen.getByTestId("usage-health-availability-badge")).queryByText("Availability")).not.toBeInTheDocument();

    const idleCell = screen.getAllByTestId("usage-health-cell")[0];
    fireEvent.focus(idleCell);

    const tooltip = await screen.findByTestId("usage-health-tooltip");
    expect(tooltip).toHaveTextContent("Availability —");
    expect(tooltip).toHaveTextContent("Requests 0");
    expect(tooltip).toHaveTextContent("0 successful · 0 failed");
  });

  it("localizes service-health header copy and tooltip status labels in zh-CN", async () => {
    localStorage.setItem("prism.locale", "zh-CN");

    render(
      <LocaleProvider>
        <UsageServiceHealthSection serviceHealth={createServiceHealth()} />
      </LocaleProvider>,
    );

    expect(screen.getByRole("heading", { name: "服务健康" })).toBeInTheDocument();
    expect(screen.getByTestId("usage-health-window-label")).toHaveTextContent("最近 2 天");
    expect(screen.queryByText("最早")).not.toBeInTheDocument();
    expect(screen.queryByText("最新")).not.toBeInTheDocument();
    expect(screen.queryByText("正常")).not.toBeInTheDocument();
    expect(screen.queryByText("降级")).not.toBeInTheDocument();
    expect(screen.queryByText("故障")).not.toBeInTheDocument();
    expect(screen.queryByText("空闲")).not.toBeInTheDocument();
    expect(screen.getByTestId("usage-health-legend-less")).toHaveTextContent("较低可用率");
    expect(screen.getByTestId("usage-health-legend-more")).toHaveTextContent("较高可用率");

    const degradedCell = screen.getAllByTestId("usage-health-cell")[1];
    fireEvent.focus(degradedCell);

    const tooltip = await screen.findByTestId("usage-health-tooltip");
    expect(tooltip).toHaveTextContent("降级");
    expect(tooltip).toHaveTextContent(/12 小时/);
  });

  it("keeps bucket labels anchored to UTC buckets in a non-UTC browser", async () => {
    Object.defineProperty(Intl, "DateTimeFormat", {
      configurable: true,
      value: function mockDateTimeFormat(
        locale?: string | string[],
        options?: Intl.DateTimeFormatOptions,
      ) {
        return new OriginalDateTimeFormat(locale, {
          ...options,
          timeZone: options?.timeZone ?? "America/Los_Angeles",
        });
      },
      writable: true,
    });

    render(
      <LocaleProvider>
        <UsageServiceHealthSection
          serviceHealth={{
            availability_percentage: 100,
            cells: [
              {
                availability_percentage: 100,
                bucket_start: "2026-03-21T00:00:00Z",
                failed_count: 0,
                request_count: 1,
                status: "ok",
                success_count: 1,
              },
            ],
            daily: [
              {
                availability_percentage: 100,
                bucket_start: "2026-03-21T00:00:00Z",
                failed_count: 0,
                request_count: 1,
                success_count: 1,
              },
            ],
            days: 1,
            failed_count: 0,
            interval_minutes: 1440,
            request_count: 1,
            success_count: 1,
          }}
        />
      </LocaleProvider>,
    );

    expect(screen.getByTestId("usage-health-cell")).toHaveAccessibleName(
      "Mar 21, 12:00 AM OK Availability 100.0%",
    );

    fireEvent.focus(screen.getByTestId("usage-health-cell"));

    const tooltip = await screen.findByTestId("usage-health-tooltip");
    expect(tooltip).toHaveTextContent(/Mar 21, 12:00 AM/);
  });
});
