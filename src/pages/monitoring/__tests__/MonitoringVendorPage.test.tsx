import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { MonitoringVendorPage } from "../../MonitoringVendorPage";

vi.mock("@/context/ProfileContext", () => ({
  useProfileContext: () => ({ revision: 1, selectedProfileId: 7 }),
}));

vi.mock("../useMonitoringVendorData", () => ({
  useMonitoringVendorData: () => ({
    data: {
      generated_at: "2026-03-30T10:00:00Z",
      vendor_id: 1,
      vendor_key: "openai",
      vendor_name: "OpenAI",
      models: [
        {
          model_config_id: 11,
          model_id: "gpt-4.1",
          display_name: "GPT-4.1",
          fused_status: "healthy",
          connection_count: 2,
        },
      ],
    },
    error: null,
    loading: false,
    pollIntervalSeconds: 300,
    refresh: vi.fn(),
  }),
}));

describe("MonitoringVendorPage", () => {
  it("renders the vendor model table", () => {
    render(
      <LocaleProvider>
        <MemoryRouter initialEntries={["/monitoring/vendors/1"]}>
          <Routes>
            <Route path="/monitoring/vendors/:vendorId" element={<MonitoringVendorPage />} />
          </Routes>
        </MemoryRouter>
      </LocaleProvider>,
    );

    expect(screen.getByText("OpenAI")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "GPT-4.1" })).toBeInTheDocument();
  });
});
