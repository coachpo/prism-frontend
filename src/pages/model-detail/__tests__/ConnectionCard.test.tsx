import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type {
  Connection,
  LoadbalanceCurrentStateItem,
  ModelConfig,
  Provider,
} from "@/lib/types";
import { ConnectionCard } from "../connections-list/ConnectionCard";
import { ConnectionCardActions } from "../connections-list/ConnectionCardActions";
import { ConnectionCardHeader } from "../connections-list/ConnectionCardHeader";
import { ConnectionCardMetrics } from "../connections-list/ConnectionCardMetrics";

function buildProvider(): Provider {
  return {
    id: 1,
    name: "OpenAI",
    provider_type: "openai",
    description: null,
    audit_enabled: false,
    audit_capture_bodies: false,
    created_at: "2026-03-23T10:00:00Z",
    updated_at: "2026-03-23T10:00:00Z",
  };
}

function buildModel(): ModelConfig {
  return {
    id: 5,
    provider_id: 1,
    provider: buildProvider(),
    model_id: "gpt-5.4",
    display_name: "GPT-5.4",
    model_type: "native",
    redirect_to: null,
    loadbalance_strategy_id: 101,
    loadbalance_strategy: {
      id: 101,
      name: "failover-primary",
      strategy_type: "failover",
      failover_recovery_enabled: true,
      failover_cooldown_seconds: 45,
      failover_failure_threshold: 4,
      failover_backoff_multiplier: 3.5,
      failover_max_cooldown_seconds: 720,
      failover_jitter_ratio: 0.35,
      failover_auth_error_cooldown_seconds: 2400,
    },
    is_enabled: true,
    connections: [],
    created_at: "2026-03-23T10:00:00Z",
    updated_at: "2026-03-23T10:00:00Z",
  };
}

function buildConnection(): Connection {
  return {
    id: 11,
    model_config_id: 5,
    endpoint_id: 7,
    endpoint: {
      id: 7,
      name: "Primary endpoint",
      base_url: "https://api.example.com/v1",
      has_api_key: true,
      masked_api_key: "sk-••••",
      position: 0,
      created_at: "2026-03-23T10:00:00Z",
      updated_at: "2026-03-23T10:00:00Z",
    },
    is_active: true,
    priority: 0,
    name: "Primary",
    auth_type: null,
    custom_headers: null,
    pricing_template_id: null,
    pricing_template: null,
    health_status: "healthy",
    health_detail: null,
    last_health_check: "2026-03-23T10:00:00Z",
    created_at: "2026-03-23T10:00:00Z",
    updated_at: "2026-03-23T10:00:00Z",
  };
}

function buildCurrentState(
  state: LoadbalanceCurrentStateItem["state"],
  overrides: Partial<LoadbalanceCurrentStateItem> = {}
): LoadbalanceCurrentStateItem {
  return {
    connection_id: 11,
    consecutive_failures: 3,
    last_failure_kind: "timeout",
    last_cooldown_seconds: 45,
    blocked_until_at: "2026-03-23T10:05:00Z",
    probe_eligible_logged: state === "probe_eligible",
    state,
    created_at: "2026-03-23T10:00:00Z",
    updated_at: "2026-03-23T10:01:00Z",
    ...overrides,
  };
}

describe("ConnectionCard cooldown state", () => {
  it.each([
    ["blocked", "Cooling Down"],
    ["probe_eligible", "Probe Eligible"],
    ["counting", "Failure Counting"],
  ] as const)("renders the %s cooldown signal", (state, badgeLabel) => {
    render(
      <ConnectionCard
        connection={buildConnection()}
        model={buildModel()}
        metrics24h={undefined}
        loadbalanceCurrentState={buildCurrentState(state)}
        isChecking={false}
        isResettingCooldown={false}
        isFocused={false}
        formatTime={(value) => `formatted:${value}`}
        reorderDisabled={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onHealthCheck={vi.fn()}
        onResetCooldown={vi.fn()}
        onToggleActive={vi.fn()}
      />
    );

    expect(screen.getByText(badgeLabel)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset Cooldown" })).toBeEnabled();
  });

  it("calls reset and shows loading state without affecting the rest of the card", () => {
    const handleResetCooldown = vi.fn();

    const { rerender } = render(
      <ConnectionCard
        connection={buildConnection()}
        model={buildModel()}
        metrics24h={undefined}
        loadbalanceCurrentState={buildCurrentState("blocked")}
        isChecking={false}
        isResettingCooldown={false}
        isFocused={false}
        formatTime={(value) => `formatted:${value}`}
        reorderDisabled={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onHealthCheck={vi.fn()}
        onResetCooldown={handleResetCooldown}
        onToggleActive={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Reset Cooldown" }));

    expect(handleResetCooldown).toHaveBeenCalledWith(11);
    expect(screen.getByRole("switch")).toBeEnabled();

    rerender(
      <ConnectionCard
        connection={buildConnection()}
        model={buildModel()}
        metrics24h={undefined}
        loadbalanceCurrentState={buildCurrentState("blocked")}
        isChecking={false}
        isResettingCooldown
        isFocused={false}
        formatTime={(value) => `formatted:${value}`}
        reorderDisabled={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onHealthCheck={vi.fn()}
        onResetCooldown={handleResetCooldown}
        onToggleActive={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Reset Cooldown" })).toBeDisabled();
    expect(screen.getByRole("switch")).toBeEnabled();
  });

  it("shows no cooldown panel when there is no current state row", () => {
    render(
      <ConnectionCard
        connection={buildConnection()}
        model={buildModel()}
        metrics24h={undefined}
        loadbalanceCurrentState={undefined}
        isChecking={false}
        isResettingCooldown={false}
        isFocused={false}
        formatTime={(value) => `formatted:${value}`}
        reorderDisabled={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onHealthCheck={vi.fn()}
        onResetCooldown={vi.fn()}
        onToggleActive={vi.fn()}
      />
    );

    expect(screen.queryByRole("button", { name: "Reset Cooldown" })).not.toBeInTheDocument();
    expect(screen.queryByText("Cooling Down")).not.toBeInTheDocument();
  });

  it("renders header pricing and inactive badges from the extracted header component", () => {
    render(
      <ConnectionCardHeader
        connection={{ ...buildConnection(), is_active: false }}
        connectionName="Primary"
        isChecking={false}
      />,
    );

    expect(screen.getByText("Pricing Off")).toBeInTheDocument();
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("applies muted shell styling to inactive cards while keeping actions available", () => {
    const { container } = render(
      <ConnectionCard
        connection={{ ...buildConnection(), is_active: false }}
        model={buildModel()}
        metrics24h={undefined}
        loadbalanceCurrentState={undefined}
        isChecking={false}
        isResettingCooldown={false}
        isFocused={false}
        formatTime={(value) => `formatted:${value}`}
        reorderDisabled={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onHealthCheck={vi.fn()}
        onResetCooldown={vi.fn()}
        onToggleActive={vi.fn()}
      />,
    );

    const card = container.firstElementChild;
    const detailsRow = screen.getByText("Primary endpoint").closest("div");
    const contentColumn = detailsRow?.parentElement;

    expect(card).toHaveClass("border-border/60", "bg-muted/20");
    expect(contentColumn).toHaveClass("opacity-75");
    expect(screen.getByRole("switch")).toBeEnabled();
  });

  it("renders metrics text from the extracted metrics component", () => {
    render(
      <ConnectionCardMetrics
        formatTime={(value) => `formatted:${value}`}
        metrics24h={{
          request_count_24h: 24,
          success_rate_24h: 98.5,
          p95_latency_ms: 450,
          five_xx_rate: 1.2,
          heuristic_failover_events: 2,
          last_failover_like_at: "2026-03-23T10:05:00Z",
        }}
      />,
    );

    expect(screen.getByText("Success rate (24h)")).toBeInTheDocument();
    expect(screen.getByText("98.5%")).toBeInTheDocument();
  });

  it("wires action callbacks through the extracted actions component", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onHealthCheck = vi.fn();
    const onToggleActive = vi.fn();

    render(
      <ConnectionCardActions
        connection={buildConnection()}
        isChecking={false}
        onEdit={onEdit}
        onDelete={onDelete}
        onHealthCheck={onHealthCheck}
        onToggleActive={onToggleActive}
      />,
    );

    fireEvent.click(screen.getByRole("switch"));

    expect(screen.getByRole("button", { name: "Connection actions" })).toBeInTheDocument();
    expect(onEdit).not.toHaveBeenCalled();
    expect(onHealthCheck).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
    expect(onToggleActive).toHaveBeenCalledWith(expect.objectContaining({ id: 11 }));
  });
});
