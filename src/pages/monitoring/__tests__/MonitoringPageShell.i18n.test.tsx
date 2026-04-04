import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import type { MonitoringOverviewVendor } from "@/lib/types";
import { MonitoringOverviewGroups } from "../MonitoringOverviewGroups";
import { MonitoringPage } from "../../MonitoringPage";

const { overviewRefreshSpy } = vi.hoisted(() => ({
  overviewRefreshSpy: vi.fn(),
}));

vi.mock("@/context/ProfileContext", () => ({
  useProfileContext: () => ({ revision: 1, selectedProfileId: 7 }),
}));

vi.mock("../useMonitoringOverviewData", () => ({
  useMonitoringOverviewData: () => ({
    data: {
      generated_at: "2026-03-30T10:00:00Z",
      vendors: [
        {
          vendor_id: 1,
          vendor_key: "openai",
          vendor_name: "OpenAI",
          icon_key: "openai",
          model_count: 1,
          connection_count: 2,
          healthy_connection_count: 1,
          degraded_connection_count: 1,
        },
      ],
    },
    error: null,
    loading: false,
    refresh: overviewRefreshSpy,
  }),
}));

describe("MonitoringPage", () => {
  beforeEach(() => {
    overviewRefreshSpy.mockClear();
  });

  it("renders localized monitoring route copy with an icon-only refresh button and no generated-at text", () => {
    localStorage.setItem("prism.locale", "zh-CN");

    render(
      <MemoryRouter>
        <LocaleProvider>
          <MonitoringPage />
        </LocaleProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText("监控")).toBeInTheDocument();
    const refreshButton = screen.getByRole("button", { name: "刷新监控" });

    expect(refreshButton).toBeInTheDocument();
    expect(refreshButton).not.toHaveTextContent("刷新");
    expect(screen.queryByText(/更新于/)).not.toBeInTheDocument();
  });

  it("reloads the monitoring overview when the refresh icon button is clicked", () => {
    render(
      <MemoryRouter>
        <LocaleProvider>
          <MonitoringPage />
        </LocaleProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Refresh monitoring" }));

    expect(overviewRefreshSpy).toHaveBeenCalledTimes(1);
  });

  it("renders summary-first vendor drill-down links with no inline detail", () => {
    render(
      <MemoryRouter>
        <LocaleProvider>
          <MonitoringPage />
        </LocaleProvider>
      </MemoryRouter>,
    );

    const vendorLink = screen.getByRole("link", { name: /OpenAI/i });
    const summaryTiles = within(vendorLink).getAllByTestId("monitoring-connection-summary-tile");

    expect(screen.getByText("OpenAI")).toBeInTheDocument();
    expect(vendorLink).toHaveAttribute("href", "/monitoring/vendors/1");
    expect(screen.getByText("Vendor groups")).toBeInTheDocument();
    expect(screen.getByText(/Select a vendor to inspect model summaries/i)).toBeInTheDocument();
    expect(screen.getByText("1 models · 2 connections")).toBeInTheDocument();
    expect(within(summaryTiles[2]).getByText("Healthy")).toBeInTheDocument();
    expect(within(summaryTiles[2]).getByText("1")).toBeInTheDocument();
    expect(within(summaryTiles[3]).getByText("Degraded")).toBeInTheDocument();
    expect(within(summaryTiles[3]).getByText("1")).toBeInTheDocument();
    expect(screen.queryByText("GPT-4.1")).not.toBeInTheDocument();
    expect(screen.queryByText("Primary")).not.toBeInTheDocument();
    expect(screen.queryByText("Past 60 probes")).not.toBeInTheDocument();
    const vendorIcon = screen.getByRole("img", { name: "Vendor icon OpenAI" });

    expect(vendorIcon.querySelector("svg")).not.toBeNull();
    expect(vendorIcon).not.toHaveTextContent("O");
    expect(screen.queryByRole("button", { name: /OpenAI/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Latest probe/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Recent history")).not.toBeInTheDocument();
  });

  it("rerenders updated vendor summaries without preserving removed expansion state", async () => {
    const vendors: MonitoringOverviewVendor[] = [
      {
        vendor_id: 1,
        vendor_key: "openai",
        vendor_name: "OpenAI",
        icon_key: "openai",
        model_count: 1,
        connection_count: 1,
        healthy_connection_count: 1,
        degraded_connection_count: 0,
      },
    ];

    const { rerender } = render(
      <MemoryRouter>
        <LocaleProvider>
          <MonitoringOverviewGroups vendors={[]} />
        </LocaleProvider>
      </MemoryRouter>,
    );

    rerender(
      <MemoryRouter>
        <LocaleProvider>
          <MonitoringOverviewGroups vendors={vendors} />
        </LocaleProvider>
      </MemoryRouter>,
    );

    const vendorLink = screen.getByRole("link", { name: /OpenAI/i });
    expect(vendorLink).toHaveAttribute("href", "/monitoring/vendors/1");
    let summaryTiles = within(vendorLink).getAllByTestId("monitoring-connection-summary-tile");
    expect(within(summaryTiles[2]).getByText("Healthy")).toBeInTheDocument();
    expect(within(summaryTiles[2]).getByText("1")).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <LocaleProvider>
          <MonitoringOverviewGroups
            vendors={vendors.map((vendor) => ({
              ...vendor,
              healthy_connection_count: 0,
              degraded_connection_count: 1,
            }))}
          />
        </LocaleProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      summaryTiles = within(screen.getByRole("link", { name: /OpenAI/i })).getAllByTestId("monitoring-connection-summary-tile");
      expect(within(summaryTiles[2]).getByText("Healthy")).toBeInTheDocument();
      expect(within(summaryTiles[2]).getByText("0")).toBeInTheDocument();
    });

    expect(within(summaryTiles[3]).getByText("Degraded")).toBeInTheDocument();
    expect(within(summaryTiles[3]).getByText("1")).toBeInTheDocument();
  });
});
