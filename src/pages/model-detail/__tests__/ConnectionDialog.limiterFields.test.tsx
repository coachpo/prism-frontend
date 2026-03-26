import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import type { Connection, Endpoint, ModelConfig, ModelConfigListItem } from "@/lib/types";
import { ConnectionDialog } from "../ConnectionDialog";
import { createDefaultConnectionForm } from "../useModelDetailDataSupport";
import { useModelDetailConnectionMutations } from "../useModelDetailConnectionMutations";
import { useModelDetailDialogState } from "../useModelDetailDialogState";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock);

const api = vi.hoisted(() => ({
  connections: {
    create: vi.fn(),
    update: vi.fn(),
  },
}));

const toast = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}));

const clearSharedReferenceData = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({ api }));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/lib/referenceData", () => ({ clearSharedReferenceData }));

function buildEndpoint(overrides: Partial<Endpoint> = {}): Endpoint {
  return {
    id: 7,
    name: "Primary endpoint",
    base_url: "https://api.example.com/v1",
    has_api_key: true,
    masked_api_key: "sk-••••",
    position: 0,
    created_at: "2026-03-25T10:00:00Z",
    updated_at: "2026-03-25T10:00:00Z",
    ...overrides,
  };
}

function buildConnection(overrides: Partial<Connection> = {}): Connection {
  return {
    id: 11,
    model_config_id: 5,
    endpoint_id: 7,
    endpoint: buildEndpoint(),
    is_active: true,
    priority: 0,
    name: "Primary",
    auth_type: null,
    custom_headers: null,
    pricing_template_id: null,
    qps_limit: null,
    max_in_flight_non_stream: null,
    max_in_flight_stream: null,
    pricing_template: null,
    health_status: "healthy",
    health_detail: null,
    last_health_check: "2026-03-25T10:00:00Z",
    created_at: "2026-03-25T10:00:00Z",
    updated_at: "2026-03-25T10:00:00Z",
    ...overrides,
  };
}

function ConnectionDialogHarness({
  editingConnection,
}: {
  editingConnection?: Connection;
}) {
  const [, setConnections] = useState<Connection[]>(editingConnection ? [editingConnection] : []);
  const [globalEndpoints, setGlobalEndpoints] = useState<Endpoint[]>([buildEndpoint()]);
  const [, setAllModels] = useState<ModelConfigListItem[]>([]);
  const [, setModel] = useState<ModelConfig | null>(null);

  const {
    isConnectionDialogOpen,
    setIsConnectionDialogOpen,
    editingConnection: activeEditingConnection,
    dialogTestingConnection,
    dialogTestResult,
    createMode,
    setCreateMode,
    selectedEndpointId,
    setSelectedEndpointId,
    newEndpointForm,
    setNewEndpointForm,
    connectionForm,
    setConnectionForm,
    headerRows,
    setHeaderRows,
    endpointSourceDefaultName,
    openConnectionDialog,
  } = useModelDetailDialogState({ globalEndpoints });

  const { handleConnectionSubmit } = useModelDetailConnectionMutations({
    id: "5",
    revision: 1,
    createMode,
    selectedEndpointId,
    newEndpointForm,
    connectionForm,
    headerRows,
    editingConnection: activeEditingConnection,
    endpointSourceDefaultName,
    refreshCurrentState: vi.fn(),
    setIsConnectionDialogOpen,
    setAllModels,
    setConnections,
    setGlobalEndpoints,
    setModel,
  });

  return (
    <>
      <button
        type="button"
        onClick={() => {
          openConnectionDialog(editingConnection);
          if (!editingConnection) {
            setCreateMode("new");
          }
        }}
      >
        Open Connection Dialog
      </button>
      <ConnectionDialog
        isOpen={isConnectionDialogOpen}
        onOpenChange={setIsConnectionDialogOpen}
        editingConnection={activeEditingConnection}
        connectionForm={connectionForm}
        setConnectionForm={setConnectionForm}
        newEndpointForm={newEndpointForm}
        setNewEndpointForm={setNewEndpointForm}
        createMode={createMode}
        setCreateMode={setCreateMode}
        selectedEndpointId={selectedEndpointId}
        setSelectedEndpointId={setSelectedEndpointId}
        globalEndpoints={globalEndpoints}
        headerRows={headerRows}
        setHeaderRows={setHeaderRows}
        handleConnectionSubmit={handleConnectionSubmit}
        dialogTestingConnection={dialogTestingConnection}
        dialogTestResult={dialogTestResult}
        handleDialogTestConnection={vi.fn()}
        endpointSourceDefaultName={endpointSourceDefaultName}
        pricingTemplates={[]}
      />
    </>
  );
}

describe("ConnectionDialog limiter fields", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.connections.create.mockResolvedValue(buildConnection({ id: 22 }));
    api.connections.update.mockResolvedValue(buildConnection());
  });

  it("defaults new limiter fields to unlimited null values", () => {
    expect(createDefaultConnectionForm()).toEqual({
      name: "",
      is_active: true,
      custom_headers: null,
      pricing_template_id: null,
      qps_limit: null,
      max_in_flight_non_stream: null,
      max_in_flight_stream: null,
    });
  });

  it("hydrates existing limiter values when editing a connection", async () => {
    render(
      <ConnectionDialogHarness
        editingConnection={buildConnection({
          qps_limit: 30,
          max_in_flight_non_stream: 12,
          max_in_flight_stream: 4,
        })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open Connection Dialog" }));

    expect(await screen.findByDisplayValue("30")).toBeInTheDocument();
    expect(screen.getByDisplayValue("12")).toBeInTheDocument();
    expect(screen.getByDisplayValue("4")).toBeInTheDocument();
  });

  it("includes limiter fields in the create submit payload when present", async () => {
    render(<ConnectionDialogHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Open Connection Dialog" }));

    fireEvent.change(screen.getByPlaceholderText("e.g. OpenAI Primary"), {
      target: { value: "Inline endpoint" },
    });
    fireEvent.change(screen.getByPlaceholderText("https://api.openai.com"), {
      target: { value: "https://api.example.com/v1" },
    });
    fireEvent.change(screen.getByPlaceholderText("sk-..."), {
      target: { value: "sk-test" },
    });
    fireEvent.change(screen.getByLabelText("QPS Limit"), {
      target: { value: "9" },
    });
    fireEvent.change(screen.getByLabelText("Max In-Flight (Non-Stream)"), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByLabelText("Max In-Flight (Stream)"), {
      target: { value: "2" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save Connection" }));

    await waitFor(() => {
      expect(api.connections.create).toHaveBeenCalledWith(
        5,
        expect.objectContaining({
          qps_limit: 9,
          max_in_flight_non_stream: 5,
          max_in_flight_stream: 2,
        }),
      );
    });
  });

  it("submits null limiter values after clearing existing inputs", async () => {
    render(
      <ConnectionDialogHarness
        editingConnection={buildConnection({
          qps_limit: 20,
          max_in_flight_non_stream: 7,
          max_in_flight_stream: 3,
        })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open Connection Dialog" }));

    fireEvent.change(screen.getByLabelText("QPS Limit"), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByLabelText("Max In-Flight (Non-Stream)"), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByLabelText("Max In-Flight (Stream)"), {
      target: { value: "" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save Connection" }));

    await waitFor(() => {
      expect(api.connections.update).toHaveBeenCalledWith(
        11,
        expect.objectContaining({
          qps_limit: null,
          max_in_flight_non_stream: null,
          max_in_flight_stream: null,
        }),
      );
    });
  });
});
