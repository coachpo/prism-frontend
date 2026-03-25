import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
      failover_cooldown_seconds: 60,
      failover_failure_threshold: 2,
      failover_backoff_multiplier: 2,
      failover_max_cooldown_seconds: 900,
      failover_jitter_ratio: 0.2,
      failover_auth_error_cooldown_seconds: 1800,
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

function renderTable({
  filtered = [buildModel()],
  handleOpenDialog = vi.fn(),
  search = "",
  setDeleteTarget = vi.fn(),
}: {
  filtered?: ModelConfigListItem[];
  handleOpenDialog?: (model?: ModelConfigListItem) => void;
  search?: string;
  setDeleteTarget?: (model: ModelConfigListItem) => void;
} = {}) {
  return render(
    <MemoryRouter initialEntries={["/models"]}>
      <Routes>
        <Route
          path="/models"
          element={
            <ModelsTable
              filtered={filtered}
              handleOpenDialog={handleOpenDialog}
              metricsLoading={false}
              modelMetrics24h={{}}
              modelSpend30dMicros={{}}
              search={search}
              setDeleteTarget={setDeleteTarget}
            />
          }
        />
        <Route path="/models/:id" element={<div>Model detail route</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ModelsTable", () => {
  it("copies the model ID from the explicit copy button without navigating", async () => {
    const writeTextMock = vi.fn<Clipboard["writeText"]>().mockResolvedValue(undefined);
    const originalClipboard = navigator.clipboard;
    const originalExecCommand = document.execCommand;

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: writeTextMock },
    });

    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: vi.fn(() => true),
    });

    try {
      renderTable();

      fireEvent.click(screen.getByRole("button", { name: "Copy model ID gpt-4o-mini" }));

      await waitFor(() => {
        expect(writeTextMock).toHaveBeenCalledWith("gpt-4o-mini");
      });

      expect(screen.queryByText("Model detail route")).not.toBeInTheDocument();
    } finally {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: originalClipboard,
      });

      Object.defineProperty(document, "execCommand", {
        configurable: true,
        value: originalExecCommand,
      });
    }
  });

  it("navigates when the primary model title link is clicked", () => {
    renderTable();

    fireEvent.click(screen.getByRole("link", { name: "GPT-4o Mini" }));

    expect(screen.getByText("Model detail route")).toBeInTheDocument();
  });

  it("navigates when the detail button is clicked", () => {
    renderTable();

    fireEvent.click(screen.getByRole("button", { name: "View model details for GPT-4o Mini" }));

    expect(screen.getByText("Model detail route")).toBeInTheDocument();
  });

  it("opens delete for the row without navigating to the detail route", () => {
    const model = buildModel();
    const setDeleteTarget = vi.fn();

    renderTable({ filtered: [model], setDeleteTarget });

    fireEvent.click(screen.getByRole("button", { name: "Delete model GPT-4o Mini" }));

    expect(screen.queryByText("Model detail route")).not.toBeInTheDocument();
    expect(screen.getByText("GPT-4o Mini")).toBeInTheDocument();
    expect(setDeleteTarget).toHaveBeenCalledWith(model);
  });

  it("does not copy the model ID when the detail button is clicked", async () => {
    const writeTextMock = vi.fn<Clipboard["writeText"]>().mockResolvedValue(undefined);
    const originalClipboard = navigator.clipboard;
    const originalExecCommand = document.execCommand;

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: writeTextMock },
    });

    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: vi.fn(() => true),
    });

    try {
      renderTable();

      fireEvent.click(screen.getByRole("button", { name: "View model details for GPT-4o Mini" }));

      expect(screen.getByText("Model detail route")).toBeInTheDocument();
      expect(writeTextMock).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: originalClipboard,
      });

      Object.defineProperty(document, "execCommand", {
        configurable: true,
        value: originalExecCommand,
      });
    }
  });

  it("renders provider-grouped sections with visible model counts", () => {
    renderTable({
      filtered: [
        buildModel(),
        buildModel({
          id: 12,
          model_id: "gpt-4.1-mini",
          display_name: "GPT-4.1 Mini",
        }),
        buildModel({
          id: 13,
          model_id: "claude-sonnet-4-6",
          display_name: "Claude Sonnet 4.6",
          provider_id: 20,
          provider: buildProvider({ id: 20, name: "Anthropic", provider_type: "anthropic" }),
          model_type: "proxy",
          redirect_to: "gpt-4o-mini",
          loadbalance_strategy_id: null,
          loadbalance_strategy: null,
        }),
      ],
    });

    expect(screen.getByRole("button", { name: /openai/i })).toHaveTextContent("2 models");
    expect(screen.getByRole("button", { name: /anthropic/i })).toHaveTextContent("1 model");
    expect(screen.getByText("GPT-4o Mini")).toBeInTheDocument();
    expect(screen.getByText("GPT-4.1 Mini")).toBeInTheDocument();
    expect(screen.getByText("Claude Sonnet 4.6")).toBeInTheDocument();
  });

  it("collapses and re-expands a provider group without affecting other groups", () => {
    renderTable({
      filtered: [
        buildModel(),
        buildModel({
          id: 12,
          model_id: "gpt-4.1-mini",
          display_name: "GPT-4.1 Mini",
        }),
        buildModel({
          id: 13,
          model_id: "claude-sonnet-4-6",
          display_name: "Claude Sonnet 4.6",
          provider_id: 20,
          provider: buildProvider({ id: 20, name: "Anthropic", provider_type: "anthropic" }),
        }),
      ],
    });

    const openAiToggle = screen.getByRole("button", { name: /openai/i });

    fireEvent.click(openAiToggle);

    expect(screen.queryByText("GPT-4o Mini")).not.toBeInTheDocument();
    expect(screen.queryByText("GPT-4.1 Mini")).not.toBeInTheDocument();
    expect(screen.getByText("Claude Sonnet 4.6")).toBeInTheDocument();

    fireEvent.click(openAiToggle);

    expect(screen.getByText("GPT-4o Mini")).toBeInTheDocument();
    expect(screen.getByText("GPT-4.1 Mini")).toBeInTheDocument();
  });

  it("keeps matching provider rows visible while search is active even after the group was collapsed", () => {
    const allModels = [
      buildModel(),
      buildModel({
        id: 12,
        model_id: "gpt-4.1-mini",
        display_name: "GPT-4.1 Mini",
      }),
      buildModel({
        id: 13,
        model_id: "claude-sonnet-4-6",
        display_name: "Claude Sonnet 4.6",
        provider_id: 20,
        provider: buildProvider({ id: 20, name: "Anthropic", provider_type: "anthropic" }),
      }),
    ];
    const { rerender } = renderTable({ filtered: allModels });

    fireEvent.click(screen.getByRole("button", { name: /openai/i }));
    expect(screen.queryByText("GPT-4o Mini")).not.toBeInTheDocument();

    rerender(
      <MemoryRouter initialEntries={["/models"]}>
        <Routes>
          <Route
            path="/models"
            element={
              <ModelsTable
                filtered={allModels.filter((model) => model.provider.provider_type === "openai")}
                handleOpenDialog={vi.fn()}
                metricsLoading={false}
                modelMetrics24h={{}}
                modelSpend30dMicros={{}}
                search="gpt"
                setDeleteTarget={vi.fn()}
              />
            }
          />
          <Route path="/models/:id" element={<div>Model detail route</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("GPT-4o Mini")).toBeInTheDocument();
    expect(screen.getByText("GPT-4.1 Mini")).toBeInTheDocument();
  });

  it("renders the compact metrics inline with metadata separators", () => {
    renderTable();

    const metricsCluster = screen.getByText("1/1 active").parentElement;

    expect(metricsCluster).not.toBeNull();
    expect(metricsCluster).toContainElement(screen.getByText("single-primary · Single"));
    expect(screen.getAllByText("|")).toHaveLength(5);
  });

  it("renders a smaller copy button next to the model id", () => {
    renderTable();

    const copyButton = screen.getByRole("button", { name: "Copy model ID gpt-4o-mini" });

    expect(copyButton).toHaveAttribute("data-size", "icon-xs");
    expect(copyButton).toHaveClass("h-5", "w-5");
  });
});
