import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import type { LoadbalanceStrategy } from "@/lib/types";
import { LoadbalanceStrategiesTable } from "../LoadbalanceStrategiesTable";

function buildStrategy(overrides: Partial<LoadbalanceStrategy> = {}): LoadbalanceStrategy {
  return {
    id: 12,
    profile_id: 3,
    name: "legacy-round-robin",
    strategy_type: "round-robin",
    auto_recovery: {
      mode: "enabled",
      status_codes: [429, 503],
      cooldown: {
        base_seconds: 45,
        failure_threshold: 4,
        backoff_multiplier: 3.5,
        max_cooldown_seconds: 720,
        jitter_ratio: 0.35,
      },
      ban: {
        mode: "temporary",
        max_cooldown_strikes_before_ban: 3,
        ban_duration_seconds: 1800,
      },
    },
    attached_model_count: 4,
    created_at: "2026-03-25T08:00:00Z",
    updated_at: "2026-03-25T08:00:00Z",
    ...overrides,
  };
}

describe("LoadbalanceStrategiesTable", () => {
  it("renders row actions inside the shared pill group and wires edit/delete handlers", () => {
    const strategy = buildStrategy();
    const onEdit = vi.fn().mockResolvedValue(undefined);
    const onDelete = vi.fn();

    render(
      <LocaleProvider>
        <LoadbalanceStrategiesTable
          loadbalanceStrategies={[strategy]}
          loadbalanceStrategiesLoading={false}
          loadbalanceStrategyPreparingEditId={null}
          onCreate={vi.fn()}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      </LocaleProvider>,
    );

    const editButton = screen.getByRole("button", { name: "Edit" });
    const deleteButton = screen.getByRole("button", { name: "Delete" });
    const actionGroup = editButton.parentElement;

    expect(actionGroup).not.toBeNull();
    expect(actionGroup).toHaveClass("rounded-full", "border", "bg-muted/35", "p-0.5");
    expect(deleteButton).toHaveClass("text-destructive");

    fireEvent.click(editButton);
    fireEvent.click(deleteButton);

    expect(onEdit).toHaveBeenCalledWith(strategy);
    expect(onDelete).toHaveBeenCalledWith(strategy);
  });

  it("keeps the edit action disabled and spinning while an edit is being prepared", () => {
    const strategy = buildStrategy();

    render(
      <LocaleProvider>
        <LoadbalanceStrategiesTable
          loadbalanceStrategies={[strategy]}
          loadbalanceStrategiesLoading={false}
          loadbalanceStrategyPreparingEditId={strategy.id}
          onCreate={vi.fn()}
          onDelete={vi.fn()}
          onEdit={vi.fn().mockResolvedValue(undefined)}
        />
      </LocaleProvider>,
    );

    const editButton = screen.getByRole("button", { name: "Edit" });
    const editIcon = editButton.querySelector("svg");
    const deleteButton = screen.getByRole("button", { name: "Delete" });

    expect(editButton).toBeDisabled();
    expect(deleteButton).toBeEnabled();
    expect(editIcon).not.toBeNull();
    expect(editIcon).toHaveClass("animate-spin");
  });

  it("shows legacy strategy labels and failover summaries without adaptive wording", () => {
    const strategy = buildStrategy();

    render(
      <LocaleProvider>
        <LoadbalanceStrategiesTable
          loadbalanceStrategies={[strategy]}
          loadbalanceStrategiesLoading={false}
          loadbalanceStrategyPreparingEditId={null}
          onCreate={vi.fn()}
          onDelete={vi.fn()}
          onEdit={vi.fn().mockResolvedValue(undefined)}
        />
      </LocaleProvider>,
    );

    const table = screen.getByRole("table");

    expect(table).toHaveTextContent(/Round robin/i);
    expect(table).toHaveTextContent("Auto recovery enabled");
    expect(table).toHaveTextContent("Status codes 429, 503");
    expect(table).toHaveTextContent("Cooldown 45s base • 720s max");
    expect(table).toHaveTextContent("Temporary ban after 3 max-cooldown strikes • 1,800s");
    expect(table).not.toHaveTextContent("Adaptive routing");
    expect(table).not.toHaveTextContent("Maximize Availability");
  });

  it("renders localized table copy when the saved locale is Chinese", () => {
    localStorage.setItem("prism.locale", "zh-CN");

    render(
      <LocaleProvider>
        <LoadbalanceStrategiesTable
          loadbalanceStrategies={[]}
          loadbalanceStrategiesLoading={false}
          loadbalanceStrategyPreparingEditId={null}
          onCreate={vi.fn()}
          onDelete={vi.fn()}
          onEdit={vi.fn().mockResolvedValue(undefined)}
        />
      </LocaleProvider>,
    );

    expect(screen.getByText("负载均衡策略")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "新增策略" })).toBeInTheDocument();
    expect(screen.getByText("当前没有配置负载均衡策略。" )).toBeInTheDocument();
  });
});
