import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ModelDetailPage } from "../../ModelDetailPage";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { useModelDetailData } from "../useModelDetailData";
import { useModelDetailPageShell } from "../useModelDetailPageShell";

vi.mock("../useModelDetailData", () => ({
  useModelDetailData: vi.fn(),
}));

vi.mock("../useModelDetailPageShell", () => ({
  useModelDetailPageShell: vi.fn(),
}));

vi.mock("../OverviewCards", () => ({
  OverviewCards: () => <div>overview-cards</div>,
}));

vi.mock("../ConnectionsList", () => ({
  ConnectionsList: () => <div>connections-list</div>,
}));

vi.mock("../ConnectionDialog", () => ({
  ConnectionDialog: () => null,
}));

vi.mock("../ModelSettingsDialog", () => ({
  ModelSettingsDialog: () => null,
}));

vi.mock("../LoadbalanceEventsTab", () => ({
  LoadbalanceEventsTab: () => <div>events-tab</div>,
}));

vi.mock("../ProxyTargetsCard", () => ({
  ProxyTargetsCard: ({ proxyTargets }: { proxyTargets: Array<{ target_model_id: string }> }) => (
    <div>{`proxy-targets-card:${proxyTargets.map((target) => target.target_model_id).join(",")}`}</div>
  ),
}));

const useModelDetailDataMock = vi.mocked(useModelDetailData);
const useModelDetailPageShellMock = vi.mocked(useModelDetailPageShell);

function buildHookValue(modelType: "native" | "proxy") {
  return {
    model: {
      id: 9,
      vendor_id: 7,
      vendor: {
        id: 7,
        key: "anthropic",
        name: "Anthropic",
        description: null,
        audit_enabled: false,
        audit_capture_bodies: false,
        created_at: "2026-03-20T10:00:00Z",
        updated_at: "2026-03-20T10:00:00Z",
      },
      api_family: "anthropic",
      model_id: "claude-proxy",
      display_name: "Claude Proxy",
      model_type: modelType,
      proxy_targets: modelType === "proxy"
        ? [{ target_model_id: "claude-sonnet-4-5-20250929", position: 0 }]
        : [],
      loadbalance_strategy_id: null,
      loadbalance_strategy: null,
      is_enabled: true,
      connections: [],
      created_at: "2026-03-20T10:00:00Z",
      updated_at: "2026-03-20T10:00:00Z",
    },
    loading: false,
    loadbalanceStrategies: [],
    isEditModelDialogOpen: false,
    setIsEditModelDialogOpen: vi.fn(),
    editLoadbalanceStrategyId: "",
    setEditLoadbalanceStrategyId: vi.fn(),
    editProxyTargets: [],
    setEditProxyTargets: vi.fn(),
    proxyTargetOptions: [],
    handleSaveProxyTargets: vi.fn(),
    spending: null,
    spendingLoading: false,
    spendingCurrencySymbol: "$",
    spendingCurrencyCode: "USD",
    kpiSummary24h: null,
    kpiSpend24hMicros: null,
    metrics24hLoading: false,
    connectionMetricsEnabled: false,
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
    connectionMetrics24h: new Map(),
    currentStateByConnectionId: new Map(),
    resettingConnectionIds: new Set<number>(),
    focusedConnectionId: null,
    connectionCardRefs: new Map(),
    globalEndpoints: [],
    createMode: "existing",
    setCreateMode: vi.fn(),
    selectedEndpointId: "",
    setSelectedEndpointId: vi.fn(),
    newEndpointForm: { name: "", base_url: "", api_key: "" },
    setNewEndpointForm: vi.fn(),
    connectionForm: {
      name: "",
      is_active: true,
      custom_headers: null,
      pricing_template_id: null,
      qps_limit: null,
      max_in_flight_non_stream: null,
      max_in_flight_stream: null,
    },
    setConnectionForm: vi.fn(),
    headerRows: [],
    setHeaderRows: vi.fn(),
    modelKpis: {
      successRate: null,
      p95LatencyMs: null,
      requestCount24h: 0,
      spend24hMicros: null,
    },
    proxyTargetSummary: {
      targetCount: modelType === "proxy" ? 1 : 0,
      firstTargetId: modelType === "proxy" ? "claude-sonnet-4-5-20250929" : null,
      firstTargetLabel: modelType === "proxy" ? "Claude Sonnet 4.5 (20250929)" : null,
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
    pricingTemplates: [],
    reorderInFlight: false,
    handleReorderConnections: vi.fn(),
    handleResetCooldown: vi.fn(),
  } as unknown as ReturnType<typeof useModelDetailData>;
}

function renderPage() {
  return render(
    <LocaleProvider>
      <MemoryRouter initialEntries={["/models/9"]}>
        <Routes>
          <Route path="/models/:id" element={<ModelDetailPage />} />
        </Routes>
      </MemoryRouter>
    </LocaleProvider>,
  );
}

describe("ModelDetailPage proxy target wiring", () => {
  it("renders the dedicated proxy target card for proxy models", () => {
    useModelDetailPageShellMock.mockReturnValue({
      activeTab: "connections",
      navigateBackToModels: vi.fn(),
      navigateToRequestLogs: vi.fn(),
      setActiveTab: vi.fn(),
    });
    useModelDetailDataMock.mockReturnValue(buildHookValue("proxy"));

    renderPage();

    expect(
      screen.getByText("proxy-targets-card:claude-sonnet-4-5-20250929"),
    ).toBeInTheDocument();
  });
});
