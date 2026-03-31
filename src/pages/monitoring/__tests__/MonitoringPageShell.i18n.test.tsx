import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import type { MonitoringOverviewVendor } from "@/lib/types";
import { MonitoringOverviewGroups } from "../MonitoringOverviewGroups";
import { MonitoringPage } from "../../MonitoringPage";

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
          model_count: 1,
          connection_count: 2,
          healthy_connection_count: 1,
          degraded_connection_count: 1,
          models: [
            {
              model_config_id: 11,
              model_id: "gpt-4.1",
              display_name: "GPT-4.1",
              fused_status: "degraded",
              connection_count: 2,
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
                  last_live_failure_kind: null,
                  last_live_failure_at: null,
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
                      checked_at: "2026-03-30T09:55:00Z",
                      endpoint_ping_status: "degraded",
                      endpoint_ping_ms: 150,
                      conversation_status: "degraded",
                      conversation_delay_ms: 390,
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
                    {
                      checked_at: "2026-03-30T09:57:00Z",
                      endpoint_ping_status: "healthy",
                      endpoint_ping_ms: 95,
                      conversation_status: "healthy",
                      conversation_delay_ms: 240,
                      failure_kind: null,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    error: null,
    loading: false,
    refresh: vi.fn(),
  }),
}));

describe("MonitoringPage", () => {
  it("renders localized monitoring route copy", () => {
    localStorage.setItem("prism.locale", "zh-CN");

    render(
      <LocaleProvider>
        <MonitoringPage />
      </LocaleProvider>,
    );

    expect(screen.getByText("监控")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "刷新监控" })).toBeInTheDocument();
  });

  it("renders the vendor, model, and connection hierarchy on the single monitoring page", () => {
    render(
      <LocaleProvider>
        <MonitoringPage />
      </LocaleProvider>,
    );

    expect(screen.getByText("OpenAI")).toBeInTheDocument();
    expect(screen.getByText("GPT-4.1")).toBeInTheDocument();
    expect(screen.getByText("Primary")).toBeInTheDocument();
    expect(screen.getByText("Primary endpoint")).toBeInTheDocument();
    expect(screen.getByText("82 ms")).toBeInTheDocument();
    expect(screen.getByText("310 ms")).toBeInTheDocument();
    expect(screen.getByText("45s cadence")).toBeInTheDocument();
    expect(screen.getByText("Past 60 probes")).toBeInTheDocument();
    expect(screen.getByTestId("monitoring-probe-strip")).toBeInTheDocument();
    expect(screen.getAllByTestId("monitoring-probe-cell")).toHaveLength(4);
    expect(screen.getAllByTestId("monitoring-probe-cell-ok")).toHaveLength(2);
    expect(screen.getByTestId("monitoring-probe-cell-degraded")).toBeInTheDocument();
    expect(screen.getByTestId("monitoring-probe-cell-down")).toBeInTheDocument();
    expect(screen.queryByTestId("monitoring-probe-cell-empty")).not.toBeInTheDocument();
    expect(screen.queryByText("24h availability")).not.toBeInTheDocument();
    expect(screen.queryByText("Recent history")).not.toBeInTheDocument();
    expect(screen.queryByText("Recent windows")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "OpenAI" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "GPT-4.1" })).not.toBeInTheDocument();
  });

  it("keeps vendor collapse state stable after rerendered monitoring data", async () => {
    const vendors: MonitoringOverviewVendor[] = [
      {
        vendor_id: 1,
        vendor_key: "openai",
        vendor_name: "OpenAI",
        model_count: 1,
        connection_count: 1,
        healthy_connection_count: 1,
        degraded_connection_count: 0,
        models: [
          {
            model_config_id: 11,
            model_id: "gpt-4.1",
            display_name: "GPT-4.1",
            fused_status: "healthy",
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
                live_p95_latency_ms: 320,
                last_live_failure_kind: null,
                last_live_failure_at: null,
                last_live_success_at: "2026-03-30T09:58:00Z",
                endpoint_ping_status: "healthy",
                endpoint_ping_ms: 82,
                conversation_status: "healthy",
                conversation_delay_ms: 210,
                fused_status: "healthy",
                recent_history: [
                  {
                    checked_at: "2026-03-30T00:00:00Z",
                    endpoint_ping_status: "healthy",
                    endpoint_ping_ms: 80,
                    conversation_status: "healthy",
                    conversation_delay_ms: 180,
                    failure_kind: null,
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    const { rerender } = render(
      <LocaleProvider>
        <MonitoringOverviewGroups vendors={vendors} />
      </LocaleProvider>,
    );

    const trigger = screen.getByRole("button", { name: /OpenAI/i });
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /OpenAI/i })).toHaveAttribute("aria-expanded", "false");
    });

    rerender(
      <LocaleProvider>
        <MonitoringOverviewGroups
          vendors={vendors.map((vendor) => ({
            ...vendor,
            healthy_connection_count: 0,
            degraded_connection_count: 1,
          }))}
        />
      </LocaleProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /OpenAI/i })).toHaveAttribute("aria-expanded", "false");
    });
  });
});
