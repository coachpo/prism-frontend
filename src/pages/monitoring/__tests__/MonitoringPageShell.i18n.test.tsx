import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { MonitoringPage } from "../../MonitoringPage";

vi.mock("@/context/ProfileContext", () => ({
  useProfileContext: () => ({ revision: 1, selectedProfileId: 7 }),
}));

vi.mock("../useMonitoringOverviewData", () => ({
  useMonitoringOverviewData: () => ({
    data: {
      generated_at: "2026-03-30T10:00:00Z",
      vendors: [],
    },
    error: null,
    loading: false,
    pollIntervalSeconds: 300,
    refresh: vi.fn(),
  }),
}));

describe("MonitoringPage i18n shell", () => {
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
});
