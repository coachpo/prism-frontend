import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import type { MonitoringOverviewVendor } from "@/lib/types";
import { MonitoringOverviewGroups } from "../MonitoringOverviewGroups";

function buildVendorFixture(vendor: MonitoringOverviewVendor) {
  return vendor;
}

function buildVendors() {
  return [
    buildVendorFixture({
      vendor_id: 1,
      vendor_key: "openai",
      vendor_name: "OpenAI",
      icon_key: "openai",
      model_count: 1,
      connection_count: 1,
      healthy_connection_count: 0,
      degraded_connection_count: 1,
    }),
  ];
}

function renderMonitoringOverviewGroups(vendors: MonitoringOverviewVendor[]) {
  render(
    <MemoryRouter>
      <LocaleProvider>
        <MonitoringOverviewGroups vendors={vendors} />
      </LocaleProvider>
    </MemoryRouter>,
  );
}

describe("MonitoringOverviewGroups", () => {
  it("renders vendor summary links without inline expansion controls", () => {
    renderMonitoringOverviewGroups(buildVendors());

    const vendorLink = screen.getByRole("link", { name: /OpenAI/i });

    expect(vendorLink).toHaveAttribute("href", "/monitoring/vendors/1");
    expect(within(vendorLink).getByText("OpenAI")).toBeInTheDocument();
    expect(within(vendorLink).getByText("1 models · 1 connections")).toBeInTheDocument();

    const summaryTiles = within(vendorLink).getAllByTestId("monitoring-connection-summary-tile");
    expect(within(summaryTiles[2]).getByText("Healthy")).toBeInTheDocument();
    expect(within(summaryTiles[2]).getByText("0")).toBeInTheDocument();
    expect(within(summaryTiles[3]).getByText("Degraded")).toBeInTheDocument();
    expect(within(summaryTiles[3]).getByText("1")).toBeInTheDocument();

    const vendorIcon = within(vendorLink).getByRole("img", { name: "Vendor icon OpenAI" });
    expect(vendorIcon).toBeInTheDocument();
    expect(vendorIcon.querySelector("svg")).not.toBeNull();
    expect(screen.queryByRole("button", { name: /OpenAI/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Past 60 probes")).not.toBeInTheDocument();
    expect(screen.queryByText(/Latest probe/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId("monitoring-probe-strip")).not.toBeInTheDocument();
  });

  it("renders the vendor summary copy for drill-down navigation", () => {
    renderMonitoringOverviewGroups(buildVendors());

    expect(screen.getByText("Vendor groups")).toBeInTheDocument();
    expect(screen.getByText(/Select a vendor to inspect model summaries/i)).toBeInTheDocument();
    expect(screen.getByText("1 models · 1 connections")).toBeInTheDocument();
  });

  it("renders an empty state when no vendors are available", () => {
    renderMonitoringOverviewGroups([]);

    expect(screen.getByText("No vendor monitoring data is available yet.")).toBeInTheDocument();
  });
});
