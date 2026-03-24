import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { ModelConfigListItem, Provider } from "@/lib/types";
import { ModelsTable } from "../ModelsTable";

function buildProvider(overrides: Partial<Provider> = {}): Provider {
  return {
    id: 7,
    name: "OpenAI",
    provider_type: "openai",
    description: null,
    audit_enabled: false,
    audit_capture_bodies: false,
    created_at: "2026-03-20T10:00:00Z",
    updated_at: "2026-03-20T10:00:00Z",
    ...overrides,
  };
}

function buildModel(overrides: Partial<ModelConfigListItem> = {}): ModelConfigListItem {
  return {
    id: 11,
    provider_id: 7,
    provider: buildProvider(),
    model_id: "gpt-4o-mini",
    display_name: "GPT-4o Mini",
    model_type: "native",
    redirect_to: null,
    loadbalance_strategy_id: 100,
    loadbalance_strategy: {
      id: 100,
      name: "single-primary",
      strategy_type: "single",
      failover_recovery_enabled: false,
    },
    is_enabled: true,
    connection_count: 1,
    active_connection_count: 1,
    health_success_rate: 99,
    health_total_requests: 100,
    created_at: "2026-03-20T10:00:00Z",
    updated_at: "2026-03-20T10:00:00Z",
    ...overrides,
  };
}

function renderTable() {
  return render(
    <MemoryRouter initialEntries={["/models"]}>
      <Routes>
        <Route
          path="/models"
          element={
            <ModelsTable
              activeColumns={{
                provider: true,
                type: true,
                strategy: true,
                endpoints: true,
                success: true,
                p95: true,
                requests: true,
                spend: true,
                status: true,
              }}
              filtered={[buildModel()]}
              handleOpenDialog={vi.fn()}
              hasActiveFilters={false}
              metricsLoading={false}
              modelMetrics24h={{}}
              modelSpend30dMicros={{}}
              search=""
              setDeleteTarget={vi.fn()}
            />
          }
        />
        <Route path="/models/:id" element={<div>Model detail route</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ModelsTable", () => {
  it("navigates when the card itself receives keyboard activation", () => {
    renderTable();

    fireEvent.keyDown(screen.getByRole("link", { name: /gpt-4o mini/i }), {
      key: "Enter",
    });

    expect(screen.getByText("Model detail route")).toBeInTheDocument();
  });

  it("does not navigate when the actions button receives keyboard activation", () => {
    renderTable();

    fireEvent.keyDown(screen.getByRole("button", { name: "Open actions for GPT-4o Mini" }), {
      key: "Enter",
    });

    expect(screen.queryByText("Model detail route")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /gpt-4o mini/i })).toBeInTheDocument();
  });
});
