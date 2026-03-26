import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { StatisticsPage } from "@/pages/StatisticsPage";

const mockNavigate = vi.hoisted(() => vi.fn());
const mockUseStatisticsPageState = vi.hoisted(() => vi.fn());
const mockUseStatisticsPageData = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/context/ProfileContext", () => ({
  useProfileContext: () => ({ revision: 1 }),
}));

vi.mock("../useStatisticsPageState", () => ({
  useStatisticsPageState: () => mockUseStatisticsPageState(),
}));

vi.mock("../useStatisticsPageData", () => ({
  useStatisticsPageData: () => mockUseStatisticsPageData(),
}));

vi.mock("../OperationsTab", () => ({
  OperationsTab: () => <div>operations-tab</div>,
}));

vi.mock("../ThroughputTab", () => ({
  ThroughputTab: () => <div>throughput-tab</div>,
}));

vi.mock("../SpendingTab", () => ({
  SpendingTab: () => <div>spending-tab</div>,
}));

describe("StatisticsPage shell i18n", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("prism.locale", "zh-CN");
    mockNavigate.mockReset();
    mockUseStatisticsPageState.mockReset();
    mockUseStatisticsPageData.mockReset();

    mockUseStatisticsPageState.mockReturnValue({
      activeTab: "operations",
      setActiveTab: vi.fn(),
    });

    mockUseStatisticsPageData.mockReturnValue({
      showInitialLoading: false,
      operationsTabProps: {},
      throughput: null,
      throughputLoading: false,
      refreshThroughput: vi.fn(),
      spendingTabProps: {},
    });
  });

  it("renders localized page shell copy", () => {
    render(
      <LocaleProvider>
        <StatisticsPage />
      </LocaleProvider>,
    );

    expect(screen.getByRole("heading", { name: "统计" })).toBeInTheDocument();
    expect(screen.getByText("运营指标与支出分析")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "运营" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "吞吐量" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "支出" })).toBeInTheDocument();
  });
});
