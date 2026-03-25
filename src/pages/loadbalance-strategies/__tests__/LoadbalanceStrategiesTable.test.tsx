import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { LoadbalanceStrategy } from "@/lib/types";
import { LoadbalanceStrategiesTable } from "../LoadbalanceStrategiesTable";

function buildStrategy(overrides: Partial<LoadbalanceStrategy> = {}): LoadbalanceStrategy {
  return {
    id: 12,
    profile_id: 3,
    name: "Primary failover",
    strategy_type: "failover",
    failover_recovery_enabled: true,
    failover_cooldown_seconds: 45,
    failover_failure_threshold: 4,
    failover_backoff_multiplier: 3.5,
    failover_max_cooldown_seconds: 720,
    failover_jitter_ratio: 0.35,
    failover_auth_error_cooldown_seconds: 2400,
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
      <LoadbalanceStrategiesTable
        loadbalanceStrategies={[strategy]}
        loadbalanceStrategiesLoading={false}
        loadbalanceStrategyPreparingEditId={null}
        onCreate={vi.fn()}
        onDelete={onDelete}
        onEdit={onEdit}
      />
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
      <LoadbalanceStrategiesTable
        loadbalanceStrategies={[strategy]}
        loadbalanceStrategiesLoading={false}
        loadbalanceStrategyPreparingEditId={strategy.id}
        onCreate={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn().mockResolvedValue(undefined)}
      />
    );

    const editButton = screen.getByRole("button", { name: "Edit" });
    const editIcon = editButton.querySelector("svg");
    const deleteButton = screen.getByRole("button", { name: "Delete" });

    expect(editButton).toBeDisabled();
    expect(deleteButton).toBeEnabled();
    expect(editIcon).not.toBeNull();
    expect(editIcon).toHaveClass("animate-spin");
  });

  it("shows a compact failover policy summary for failover strategies", () => {
    const strategy = buildStrategy();

    render(
      <LoadbalanceStrategiesTable
        loadbalanceStrategies={[strategy]}
        loadbalanceStrategiesLoading={false}
        loadbalanceStrategyPreparingEditId={null}
        onCreate={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn().mockResolvedValue(undefined)}
      />
    );

    expect(screen.getByText("Threshold 4 • Base 45s • Max 720s")).toBeInTheDocument();
    expect(screen.getByText("Backoff ×3.5 • Jitter 0.35 • Auth 2400s")).toBeInTheDocument();
  });
});
