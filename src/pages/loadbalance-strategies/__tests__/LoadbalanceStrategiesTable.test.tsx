import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import type { LoadbalanceStrategy } from "@/lib/types";
import { LoadbalanceStrategiesTable } from "../LoadbalanceStrategiesTable";

function buildStrategy(overrides: Partial<LoadbalanceStrategy> = {}): LoadbalanceStrategy {
  return {
    id: 12,
    profile_id: 3,
    name: "adaptive-primary",
    routing_policy: {
      kind: "adaptive",
      routing_objective: "maximize_availability",
      deadline_budget_ms: 30000,
      hedge: {
        enabled: false,
        delay_ms: 1500,
        max_additional_attempts: 1,
      },
      circuit_breaker: {
        failure_status_codes: [429, 503],
        base_open_seconds: 45,
        failure_threshold: 4,
        backoff_multiplier: 3.5,
        max_open_seconds: 720,
        jitter_ratio: 0.35,
        ban_mode: "temporary",
        max_open_strikes_before_ban: 3,
        ban_duration_seconds: 1800,
      },
      admission: {
        respect_qps_limit: true,
        respect_in_flight_limits: true,
      },
      monitoring: {
        enabled: true,
        stale_after_seconds: 300,
        endpoint_ping_weight: 1,
        conversation_delay_weight: 1,
        failure_penalty_weight: 2,
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

  it("shows adaptive routing copy and compact circuit-breaker summaries", () => {
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

    expect(table).toHaveTextContent("Adaptive routing");
    expect(table).toHaveTextContent("Maximize Availability");
    expect(table).toHaveTextContent("Threshold 4 • Base 45s • Max 720s");
    expect(table).toHaveTextContent("Backoff ×3.5 • Jitter 0.35 • Failure status codes 429, 503");
    expect(table).toHaveTextContent("Ban temporary");
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
    expect(screen.getByText("当前没有配置负载均衡策略。")).toBeInTheDocument();
  });
});
