import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MonitoringProbeHistoryStrip } from "@/components/MonitoringProbeHistoryStrip";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import type { MonitoringConnectionHistoryPoint } from "@/lib/types";

class ResizeObserverMock {
  observe() {}

  unobserve() {}

  disconnect() {}
}

function renderProbeHistoryStrip(history: MonitoringConnectionHistoryPoint[]) {
  render(
    <LocaleProvider>
      <MonitoringProbeHistoryStrip history={history} />
    </LocaleProvider>,
  );
}

describe("MonitoringProbeHistoryStrip", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("switches tooltip content when hovering across adjacent probe cells", async () => {
    renderProbeHistoryStrip([
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
    ]);

    const strip = screen.getByTestId("monitoring-probe-strip");
    const healthyProbeCell = screen.getByRole("listitem", { name: /Healthy/i });
    const failedProbeCell = screen.getByRole("listitem", { name: /Failed/i });

    expect(within(strip).queryAllByRole("button")).toHaveLength(0);

    fireEvent.pointerMove(healthyProbeCell, { pointerType: "mouse" });

    const healthyTooltip = await screen.findByRole("tooltip", { name: /Healthy/i });
    expect(within(healthyTooltip).getByText("Ping time: 88 ms")).toBeInTheDocument();

    fireEvent.pointerMove(failedProbeCell, { pointerType: "mouse" });

    await waitFor(() => {
      const failedTooltip = screen.getByRole("tooltip", { name: /Failed/i });

      expect(within(failedTooltip).getByText("Failure kind: connect_error")).toBeInTheDocument();
      expect(screen.queryByText("Ping time: 88 ms")).not.toBeInTheDocument();
    });
  });
});
