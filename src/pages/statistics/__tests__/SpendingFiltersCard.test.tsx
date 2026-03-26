import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { SpendingFilterGroups } from "../spending/SpendingFilterGroups";

function renderWithLocale(ui: React.ReactElement) {
  return render(<LocaleProvider>{ui}</LocaleProvider>);
}

describe("spending filter split component", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows custom range inputs when the custom preset is active", () => {
    renderWithLocale(
      <SpendingFilterGroups
        apiFamilies={[]}
        connections={[]}
        formatTime={() => "12:00:00"}
        models={[]}
        onReset={vi.fn()}
        reportCode="USD"
        setSpendingApiFamily={vi.fn()}
        setSpendingConnectionId={vi.fn()}
        setSpendingFrom={vi.fn()}
        setSpendingGroupBy={vi.fn()}
        setSpendingLimit={vi.fn()}
        setSpendingModelId={vi.fn()}
        setSpendingOffset={vi.fn()}
        setSpendingPreset={vi.fn()}
        setSpendingTo={vi.fn()}
        setSpendingTopN={vi.fn()}
        spendingApiFamily="all"
        spendingConnectionId=""
        spendingFrom="2026-03-01"
        spendingGroupBy="model"
        spendingLimit={20}
        spendingModelId=""
        spendingPreset="custom"
        spendingTo="2026-03-31"
        spendingTopN={10}
        spendingUpdatedAt="2026-03-25T12:00:00Z"
      />,
    );

    expect(screen.getByText("From")).toBeInTheDocument();
    expect(screen.getByText("To")).toBeInTheDocument();
  });

  it("calls reset when the reset action is pressed", () => {
    const onReset = vi.fn();

    renderWithLocale(
      <SpendingFilterGroups
        apiFamilies={[]}
        connections={[]}
        formatTime={() => "12:00:00"}
        models={[]}
        onReset={onReset}
        reportCode="USD"
        setSpendingApiFamily={vi.fn()}
        setSpendingConnectionId={vi.fn()}
        setSpendingFrom={vi.fn()}
        setSpendingGroupBy={vi.fn()}
        setSpendingLimit={vi.fn()}
        setSpendingModelId={vi.fn()}
        setSpendingOffset={vi.fn()}
        setSpendingPreset={vi.fn()}
        setSpendingTo={vi.fn()}
        setSpendingTopN={vi.fn()}
        spendingApiFamily="all"
        spendingConnectionId=""
        spendingFrom=""
        spendingGroupBy="model"
        spendingLimit={20}
        spendingModelId=""
        spendingPreset="last_7_days"
        spendingTo=""
        spendingTopN={10}
        spendingUpdatedAt="2026-03-25T12:00:00Z"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("renders localized spending filter copy when the saved locale is Chinese", () => {
    localStorage.setItem("prism.locale", "zh-CN");

    renderWithLocale(
      <SpendingFilterGroups
        apiFamilies={[]}
        connections={[]}
        formatTime={() => "12:00:00"}
        models={[]}
        onReset={vi.fn()}
        reportCode="USD"
        setSpendingApiFamily={vi.fn()}
        setSpendingConnectionId={vi.fn()}
        setSpendingFrom={vi.fn()}
        setSpendingGroupBy={vi.fn()}
        setSpendingLimit={vi.fn()}
        setSpendingModelId={vi.fn()}
        setSpendingOffset={vi.fn()}
        setSpendingPreset={vi.fn()}
        setSpendingTo={vi.fn()}
        setSpendingTopN={vi.fn()}
        spendingApiFamily="all"
        spendingConnectionId=""
        spendingFrom=""
        spendingGroupBy="model"
        spendingLimit={20}
        spendingModelId=""
        spendingPreset="last_7_days"
        spendingTo=""
        spendingTopN={10}
        spendingUpdatedAt="2026-03-25T12:00:00Z"
      />,
    );

    expect(screen.getByText("时间范围")).toBeInTheDocument();
    expect(screen.getByText("API 家族")).toBeInTheDocument();
    expect(screen.getByText("分组方式")).toBeInTheDocument();
    expect(screen.getByText(/更新时间/)).toBeInTheDocument();
  });
});
