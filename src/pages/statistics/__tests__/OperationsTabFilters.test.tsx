import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { OperationsTabFilters } from "../OperationsTabFilters";

function renderWithLocale(ui: React.ReactElement) {
  return render(<LocaleProvider>{ui}</LocaleProvider>);
}

describe("OperationsTabFilters", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders localized operations filter copy when the saved locale is Chinese", () => {
    localStorage.setItem("prism.locale", "zh-CN");

    renderWithLocale(
      <OperationsTabFilters
        timeRange="24h"
        setTimeRange={vi.fn()}
        modelId="__all__"
        setModelId={vi.fn()}
        providerType="all"
        setProviderType={vi.fn()}
        connectionId="__all__"
        setConnectionId={vi.fn()}
        specialTokenFilter="all"
        setSpecialTokenFilter={vi.fn()}
        operationsStatusFilter="all"
        setOperationsStatusFilter={vi.fn()}
        clearFilters={vi.fn()}
        refresh={vi.fn()}
        models={[]}
        providers={[]}
        connections={[]}
      />,
    );

    expect(screen.getByText("筛选条件")).toBeInTheDocument();
    expect(screen.getByText("时间范围")).toBeInTheDocument();
    expect(screen.getByText("特殊令牌")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "清除筛选条件" })).toBeInTheDocument();
  });
});
