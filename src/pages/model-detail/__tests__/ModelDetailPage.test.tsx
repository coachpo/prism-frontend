import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useModelDetailPageShell } from "../useModelDetailPageShell";

const { mockNavigate, mockUseModelDetailData, mockSetIsEditModelDialogOpen } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockUseModelDetailData: vi.fn(),
  mockSetIsEditModelDialogOpen: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: "5" }),
  };
});

vi.mock("../useModelDetailData", () => ({
  useModelDetailData: mockUseModelDetailData,
}));

vi.mock("../OverviewCards", () => ({
  OverviewCards: () => <div>overview-cards</div>,
}));

vi.mock("../ProxyTargetsCard", () => ({
  ProxyTargetsCard: ({ proxyTargets }: { proxyTargets: Array<{ target_model_id: string }> }) => (
    <div>{`proxy-targets:${proxyTargets.length}`}</div>
  ),
}));

vi.mock("../ConnectionDialog", () => ({
  ConnectionDialog: () => <div>connection-dialog</div>,
}));

vi.mock("../ModelSettingsDialog", () => ({
  ModelSettingsDialog: ({ isOpen }: { isOpen: boolean }) => (
    <div>{`model-settings-dialog:${isOpen ? "open" : "closed"}`}</div>
  ),
}));

vi.mock("../ConnectionsList", () => ({
  ConnectionsList: () => <div>legacy-connections-list</div>,
}));

vi.mock("../LoadbalanceEventsTab", () => ({
  LoadbalanceEventsTab: () => <div>legacy-loadbalance-events-tab</div>,
}));

vi.mock("../ModelDetailHeader", () => ({
  ModelDetailHeader: ({
    model,
    onEditModel,
  }: {
    model: { model_id: string };
    onEditModel: () => void;
  }) => (
    <div>
      <div>{`model-detail-header:${model.model_id}`}</div>
      <button type="button" onClick={onEditModel}>
        open-edit-model
      </button>
    </div>
  ),
}));

vi.mock("../ModelDetailTabs", () => ({
  ModelDetailTabs: ({
    activeTab,
    model,
    setActiveTab,
  }: {
    activeTab: "connections" | "events";
    model: { model_id: string };
    setActiveTab: (tab: "connections" | "events") => void;
  }) => (
    <div>
      <div>{`model-detail-tabs:${model.model_id}:${activeTab}`}</div>
      <button type="button" onClick={() => setActiveTab("events")}>
        switch-to-events
      </button>
    </div>
  ),
}));

function buildModelDetailData() {
  return {
    model: {
      id: 5,
      vendor_id: 1,
      vendor: {
        id: 1,
        key: "openai",
        name: "OpenAI",
        description: null,
        audit_enabled: false,
        audit_capture_bodies: false,
        created_at: "",
        updated_at: "",
      },
      api_family: "openai",
      model_id: "gpt-5.4",
      display_name: "GPT-5.4",
      model_type: "proxy",
      is_enabled: true,
      proxy_targets: [{ target_model_id: "gpt-4o" }],
      created_at: "2026-03-25T10:00:00Z",
      loadbalance_strategy: null,
    },
    loading: false,
    loadbalanceStrategies: [],
    isEditModelDialogOpen: false,
    setIsEditModelDialogOpen: mockSetIsEditModelDialogOpen,
    editLoadbalanceStrategyId: null,
    setEditLoadbalanceStrategyId: vi.fn(),
    editProxyTargets: [{ target_model_id: "gpt-4o" }],
    spending: null,
    spendingLoading: false,
    spendingCurrencySymbol: "$",
    spendingCurrencyCode: "USD",
    metrics24hLoading: false,
    connectionMetricsEnabled: true,
    connectionMetricsLoading: false,
    connections: [],
    isConnectionDialogOpen: false,
    setIsConnectionDialogOpen: vi.fn(),
    editingConnection: null,
    connectionSearch: "",
    setConnectionSearch: vi.fn(),
    setConnectionMetricsEnabled: vi.fn(),
    healthCheckingIds: new Set<number>(),
    dialogTestingConnection: false,
    dialogTestResult: null,
    connectionMetrics24h: {},
    currentStateByConnectionId: {},
    resettingConnectionIds: new Set<number>(),
    focusedConnectionId: null,
    connectionCardRefs: new Map<number, HTMLDivElement | null>(),
    globalEndpoints: [],
    createMode: "existing",
    setCreateMode: vi.fn(),
    selectedEndpointId: null,
    setSelectedEndpointId: vi.fn(),
    newEndpointForm: {},
    setNewEndpointForm: vi.fn(),
    connectionForm: {},
    setConnectionForm: vi.fn(),
    headerRows: [],
    setHeaderRows: vi.fn(),
    modelKpis: {
      successRate: null,
      p95LatencyMs: null,
      requestCount24h: 0,
      spend24hMicros: null,
    },
    proxyTargetOptions: [{ modelId: "gpt-4o", label: "GPT-4o" }],
    proxyTargetSummary: {
      targetCount: 1,
      firstTargetId: "gpt-4o",
      firstTargetLabel: "GPT-4o",
      routePolicyLabel: "Ordered priority routing",
    },
    endpointSourceDefaultName: "",
    openConnectionDialog: vi.fn(),
    handleConnectionSubmit: vi.fn(),
    handleDeleteConnection: vi.fn(),
    handleHealthCheck: vi.fn(),
    handleHealthCheckAll: vi.fn(),
    handleDialogTestConnection: vi.fn(),
    handleToggleActive: vi.fn(),
    handleEditModelSubmit: vi.fn(),
    handleSaveProxyTargets: vi.fn(),
    pricingTemplates: [],
    reorderInFlight: false,
    handleReorderConnections: vi.fn(),
    handleResetCooldown: vi.fn(),
  } as const;
}

describe("useModelDetailPageShell", () => {
  it("starts on the connections tab and navigates to related routes", () => {
    const navigate = vi.fn();
    const { result } = renderHook(() => useModelDetailPageShell(navigate));

    expect(result.current.activeTab).toBe("connections");

    act(() => {
      result.current.setActiveTab("events");
      result.current.navigateBackToModels();
      result.current.navigateToRequestLogs("gpt-5.4");
    });

    expect(result.current.activeTab).toBe("events");
    expect(navigate).toHaveBeenNthCalledWith(1, "/models");
    expect(navigate).toHaveBeenNthCalledWith(2, "/request-logs?model_id=gpt-5.4");
  });
});

describe("ModelDetailPage shell", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockSetIsEditModelDialogOpen.mockReset();
    mockUseModelDetailData.mockReset();
    mockUseModelDetailData.mockReturnValue(buildModelDetailData());
  });

  it("mounts extracted header and tab content components while preserving proxy targets and dialog wiring", async () => {
    const { ModelDetailPage } = await import("../../ModelDetailPage");

    render(<ModelDetailPage />);

    expect(screen.getByText("model-detail-header:gpt-5.4")).toBeInTheDocument();
    expect(screen.getByText("model-detail-tabs:gpt-5.4:connections")).toBeInTheDocument();
    expect(screen.getByText("proxy-targets:1")).toBeInTheDocument();
    expect(screen.getByText("connection-dialog")).toBeInTheDocument();
    expect(screen.getByText("model-settings-dialog:closed")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "switch-to-events" }));

    expect(screen.getByText("model-detail-tabs:gpt-5.4:events")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "open-edit-model" }));

    expect(mockSetIsEditModelDialogOpen).toHaveBeenCalledWith(true);
  });
});
