import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { MonitoringModelPage } from "../../MonitoringModelPage";

const handleManualProbe = vi.fn();

vi.mock("@/context/ProfileContext", () => ({
  useProfileContext: () => ({ revision: 1, selectedProfileId: 7 }),
}));

vi.mock("../useMonitoringModelData", () => ({
  useMonitoringModelData: () => ({
    data: {
      generated_at: "2026-03-30T10:00:00Z",
      vendor_id: 1,
      vendor_key: "openai",
      vendor_name: "OpenAI",
      model_config_id: 11,
      model_id: "gpt-4.1",
      display_name: "GPT-4.1",
      connections: [
        {
          connection_id: 99,
          endpoint_id: 5,
          endpoint_name: "Primary endpoint",
          endpoint_ping_status: "healthy",
          endpoint_ping_ms: 120,
          conversation_status: "healthy",
          conversation_delay_ms: 280,
          fused_status: "healthy",
          recent_history: [
            {
              checked_at: "2026-03-30T09:55:00Z",
              endpoint_ping_status: "healthy",
              endpoint_ping_ms: 110,
              conversation_status: "healthy",
              conversation_delay_ms: 260,
              failure_kind: null,
            },
          ],
        },
      ],
    },
    error: null,
    handleManualProbe,
    loading: false,
    manualProbeResult: null,
    pollIntervalSeconds: 300,
    probingConnectionIds: new Set<number>(),
    refresh: vi.fn(),
  }),
}));

describe("MonitoringModelPage", () => {
  it("renders connections and triggers a manual probe", () => {
    render(
      <LocaleProvider>
        <MemoryRouter initialEntries={["/monitoring/models/11"]}>
          <Routes>
            <Route path="/monitoring/models/:modelConfigId" element={<MonitoringModelPage />} />
          </Routes>
        </MemoryRouter>
      </LocaleProvider>,
    );

    expect(screen.getByText("GPT-4.1")).toBeInTheDocument();
    expect(screen.getAllByText("Primary endpoint")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Run probe" }));

    expect(handleManualProbe).toHaveBeenCalledWith(99);
  });
});
