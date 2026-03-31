import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import type { MonitoringOverviewVendor } from "@/lib/types";
import { MonitoringOverviewGroups } from "../MonitoringOverviewGroups";

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

describe("MonitoringOverviewGroups", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders grouped operational panels for connection metrics and evidence items", () => {
    render(
      <LocaleProvider>
        <MonitoringOverviewGroups vendors={buildVendors()} />
      </LocaleProvider>,
    );

    const trigger = screen.getByRole("button", { name: /OpenAI/i });
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    const operationsGrid = screen.getByTestId("monitoring-operations-grid");
    const evidenceGrid = screen.getByTestId("monitoring-evidence-grid");

    expect(within(operationsGrid).getAllByTestId("monitoring-operational-panel")).toHaveLength(4);
    expect(within(evidenceGrid).getAllByTestId("monitoring-evidence-panel")).toHaveLength(4);
    expect(screen.getByText("82 ms")).toBeInTheDocument();
    expect(screen.getByText("310 ms")).toBeInTheDocument();
    expect(screen.getByText("480 ms")).toBeInTheDocument();
    expect(screen.getByText("Past 60 probes")).toBeInTheDocument();
    expect(screen.getByTestId("monitoring-probe-strip")).toBeInTheDocument();

    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("monitoring-operations-grid")).not.toBeInTheDocument();
  });
});
