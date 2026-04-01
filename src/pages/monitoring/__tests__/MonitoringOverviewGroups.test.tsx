import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import type { MonitoringConnectionHistoryPoint, MonitoringOverviewVendor } from "@/lib/types";
import { MonitoringOverviewGroups } from "../MonitoringOverviewGroups";

class ResizeObserverMock {
  observe() {}

  unobserve() {}

  disconnect() {}
}

function buildVendors(): MonitoringOverviewVendor[] {
  return [
    {
      vendor_id: 1,
      vendor_key: "openai",
      vendor_name: "OpenAI",
      model_count: 1,
      connection_count: 1,
      healthy_connection_count: 0,
      degraded_connection_count: 1,
      models: [
        {
          model_config_id: 11,
          model_id: "gpt-4.1",
          display_name: "GPT-4.1",
          fused_status: "degraded",
          connection_count: 1,
          connections: [
            {
              connection_id: 91,
              connection_name: "Primary",
              endpoint_id: 5,
              endpoint_name: "Primary endpoint",
              monitoring_probe_interval_seconds: 45,
              last_probe_status: "healthy",
              last_probe_at: "2026-03-30T09:59:00Z",
              circuit_state: "closed",
              live_p95_latency_ms: 480,
              last_live_failure_kind: "connect_error",
              last_live_failure_at: "2026-03-30T09:57:00Z",
              last_live_success_at: "2026-03-30T09:58:00Z",
              endpoint_ping_status: "healthy",
              endpoint_ping_ms: 82,
              conversation_status: "degraded",
              conversation_delay_ms: 310,
              fused_status: "degraded",
              recent_history: [
                {
                  checked_at: "2026-03-30T09:54:00Z",
                  endpoint_ping_status: "healthy",
                  endpoint_ping_ms: 88,
                  conversation_status: "healthy",
                  conversation_delay_ms: 250,
                  failure_kind: null,
                },
                {
                  checked_at: "2026-03-30T09:56:00Z",
                  endpoint_ping_status: "failed",
                  endpoint_ping_ms: null,
                  conversation_status: "failed",
                  conversation_delay_ms: null,
                  failure_kind: "connect_error",
                },
              ],
            },
          ],
        },
      ],
    },
  ];
}

function renderMonitoringOverviewGroups(vendors: MonitoringOverviewVendor[]) {
  render(
    <LocaleProvider>
      <MonitoringOverviewGroups vendors={vendors} />
    </LocaleProvider>,
  );
}

describe("MonitoringOverviewGroups", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.doUnmock("@/components/MonitoringProbeHistoryStrip");
    vi.resetModules();
  });

  it("renders a compact connection summary grid above the shared probe strip", () => {
    renderMonitoringOverviewGroups(buildVendors());

    expect(screen.queryByText("Vendor groups")).not.toBeInTheDocument();
    expect(screen.queryByText(/Start at the vendor rollup/i)).not.toBeInTheDocument();

    const trigger = screen.getByRole("button", { name: /OpenAI/i });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(within(trigger).getByText("OpenAI")).toBeInTheDocument();
    expect(within(trigger).getByRole("img", { name: "Vendor icon OpenAI" })).toBeInTheDocument();
    expect(within(trigger).queryByText(/^Vendor:/i)).not.toBeInTheDocument();
    expect(within(trigger).queryByText("1 models")).not.toBeInTheDocument();
    expect(within(trigger).queryByText("1 connections")).not.toBeInTheDocument();
    expect(within(trigger).queryByText("0 healthy")).not.toBeInTheDocument();
    expect(within(trigger).queryByText("1 degraded")).not.toBeInTheDocument();

    const summaryGrid = screen.getByTestId("monitoring-connection-summary-grid");

    expect(within(summaryGrid).getAllByTestId("monitoring-connection-summary-tile")).toHaveLength(6);
    expect(screen.getByText("82 ms")).toBeInTheDocument();
    expect(screen.getByText("310 ms")).toBeInTheDocument();
    expect(screen.getByText("480 ms")).toBeInTheDocument();
    expect(screen.getByText("#91")).toBeInTheDocument();
    expect(screen.queryByText("Fused Degraded")).not.toBeInTheDocument();
    expect(screen.queryByText("Closed")).not.toBeInTheDocument();
    expect(screen.queryByText("45s cadence")).not.toBeInTheDocument();
    expect(screen.getByText("Past 60 probes")).toBeInTheDocument();
    expect(screen.getByTestId("monitoring-probe-strip")).toBeInTheDocument();
    expect(screen.queryByTestId("monitoring-operations-grid")).not.toBeInTheDocument();
    expect(screen.queryByTestId("monitoring-evidence-grid")).not.toBeInTheDocument();

    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("monitoring-connection-summary-grid")).not.toBeInTheDocument();
  });

  it("renders the probe strip title, legend, tooltip details, and status-specific cell test ids", async () => {
    renderMonitoringOverviewGroups(buildVendors());

    expect(screen.getByText("Past 60 probes")).toBeInTheDocument();
    expect(screen.getAllByText("Healthy").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Degraded").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Failed").length).toBeGreaterThan(0);

    expect(screen.getAllByTestId(/monitoring-probe-cell-/)).toHaveLength(60);
    expect(screen.getAllByTestId("monitoring-probe-cell-no-data")).toHaveLength(58);

    const healthyProbeCell = screen.getByTestId("monitoring-probe-cell-ok");
    const failedProbeCell = screen.getByTestId("monitoring-probe-cell-down");
    const noDataProbeCell = screen.getAllByTestId("monitoring-probe-cell-no-data")[0];

    expect(noDataProbeCell).toHaveAccessibleName(/No data/i);

    fireEvent.focus(healthyProbeCell);

    const healthyTooltip = await screen.findByRole("tooltip", { name: /Healthy/ });
    expect(healthyTooltip).toBeInTheDocument();
    expect(within(healthyTooltip).getByText("Ping status: Healthy")).toBeInTheDocument();
    expect(within(healthyTooltip).getByText("Ping time: 88 ms")).toBeInTheDocument();
    expect(within(healthyTooltip).getByText("Conversation status: Healthy")).toBeInTheDocument();
    expect(within(healthyTooltip).getByText("Conversation latency: 250 ms")).toBeInTheDocument();

    fireEvent.blur(healthyProbeCell);
    fireEvent.focus(failedProbeCell);

    const failedTooltip = await screen.findByRole("tooltip", { name: /Failed/ });
    expect(failedTooltip).toBeInTheDocument();
    expect(within(failedTooltip).getByText("Ping status: Failed")).toBeInTheDocument();
    expect(within(failedTooltip).getByText("Conversation status: Failed")).toBeInTheDocument();
    expect(within(failedTooltip).getByText("Failure kind: connect_error")).toBeInTheDocument();
  });

  it("pads empty monitoring history to a full no-data strip", () => {
    const vendors = buildVendors();
    vendors[0].models[0].connections[0].recent_history = [];

    renderMonitoringOverviewGroups(vendors);

    expect(screen.getByTestId("monitoring-probe-strip")).toBeInTheDocument();
    expect(screen.getAllByTestId(/monitoring-probe-cell-/)).toHaveLength(60);
    expect(screen.getAllByTestId("monitoring-probe-cell-no-data")).toHaveLength(60);
    expect(screen.queryByText("No probe history is available yet.")).not.toBeInTheDocument();
  });

  it("renders connection history via the shared MonitoringProbeHistoryStrip component", async () => {
    const probeHistoryStripSpy = vi.fn(({ history }: { history: MonitoringConnectionHistoryPoint[] }) => (
      <div data-testid="shared-monitoring-probe-history-strip">{history.length}</div>
    ));

    vi.resetModules();
    vi.doMock("@/components/MonitoringProbeHistoryStrip", () => ({
      MonitoringProbeHistoryStrip: probeHistoryStripSpy,
    }));

    const { LocaleProvider: IsolatedLocaleProvider } = await import("@/i18n/LocaleProvider");
    const { MonitoringOverviewGroups } = await import("../MonitoringOverviewGroups");

    render(
      <IsolatedLocaleProvider>
        <MonitoringOverviewGroups vendors={buildVendors()} />
      </IsolatedLocaleProvider>,
    );

    expect(screen.getByTestId("shared-monitoring-probe-history-strip")).toBeInTheDocument();
    expect(probeHistoryStripSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        history: expect.arrayContaining([
          expect.objectContaining({ checked_at: "2026-03-30T09:54:00Z" }),
          expect.objectContaining({ checked_at: "2026-03-30T09:56:00Z" }),
        ]),
      }),
      undefined,
    );
  });
});
