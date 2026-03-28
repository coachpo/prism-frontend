import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
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
    failover_status_codes: [429, 503],
    failover_ban_mode: "temporary",
    failover_max_cooldown_strikes_before_ban: 3,
    failover_ban_duration_seconds: 1800,
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
      </LocaleProvider>
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
      </LocaleProvider>
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
      <LocaleProvider>
        <LoadbalanceStrategiesTable
          loadbalanceStrategies={[strategy]}
          loadbalanceStrategiesLoading={false}
          loadbalanceStrategyPreparingEditId={null}
          onCreate={vi.fn()}
          onDelete={vi.fn()}
          onEdit={vi.fn().mockResolvedValue(undefined)}
        />
      </LocaleProvider>
    );

    expect(screen.getByText("Threshold 4 • Base 45s • Max 720s")).toBeInTheDocument();
    expect(screen.getByText("Backoff ×3.5 • Jitter 0.35 • Status codes 429, 503")).toBeInTheDocument();
    expect(screen.getByText(/Ban temporary/)).toBeInTheDocument();
  });

  it("renders distinct priority spillover copy for fill-first strategies", () => {
    const strategy = buildStrategy({
      name: "Primary fill-first",
      strategy_type: "fill-first",
      failover_recovery_enabled: true,
    });

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
      </LocaleProvider>
    );

    expect(screen.getByText("Priority spillover")).toBeInTheDocument();
    expect(screen.getByText("Threshold 4 • Base 45s • Max 720s")).toBeInTheDocument();
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
      </LocaleProvider>
    );

    expect(screen.getByText("负载均衡策略")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "新增策略" })).toBeInTheDocument();
    expect(screen.getByText("当前没有配置负载均衡策略。")) .toBeInTheDocument();
  });

  it("renders localized row headings and status copy when the saved locale is Chinese", () => {
    localStorage.setItem("prism.locale", "zh-CN");
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
      </LocaleProvider>
    );

    expect(screen.getByText("名称")).toBeInTheDocument();
    expect(screen.getByText("类型")).toBeInTheDocument();
    expect(screen.getByText("恢复")).toBeInTheDocument();
    expect(screen.getByText("已绑定模型")).toBeInTheDocument();
    expect(screen.getByText("按健康感知故障转移")).toBeInTheDocument();
    expect(screen.getByText("已启用")).toBeInTheDocument();
    expect(screen.getByText(/阈值 4/)).toBeInTheDocument();
    expect(screen.getByText(/退避 ×3.5/)).toBeInTheDocument();
  });
});
