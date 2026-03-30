import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import type {
  ApiFamily,
  Connection,
  Endpoint,
  ModelConfig,
  ModelConfigListItem,
  PricingTemplate,
} from "@/lib/types";
import { ConnectionDialog } from "../ConnectionDialog";
import { ConnectionCardHeader } from "../connections-list/ConnectionCardHeader";
import { createDefaultConnectionForm } from "../useModelDetailDataSupport";
import { useModelDetailConnectionMutations } from "../useModelDetailConnectionMutations";
import { useModelDetailDialogState } from "../useModelDetailDialogState";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock);
window.HTMLElement.prototype.scrollIntoView = vi.fn();

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
    openai_probe_endpoint_variant: "responses",
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

function buildPricingTemplate(overrides: Partial<PricingTemplate> = {}): PricingTemplate {
  return {
    id: 3,
    profile_id: 1,
    name: "Premium Pricing",
    description: "Tracks spend",
    pricing_unit: "PER_1M",
    pricing_currency_code: "USD",
    input_price: "1.25",
    output_price: "5.00",
    cached_input_price: null,
    cache_creation_price: null,
    reasoning_price: null,
    missing_special_token_price_policy: "MAP_TO_OUTPUT",
    version: 2,
    created_at: "2026-03-25T10:00:00Z",
    updated_at: "2026-03-25T10:00:00Z",
    ...overrides,
  };
}

function ConnectionDialogHarness({
  editingConnection,
  modelApiFamily = "openai",
  pricingTemplates = [],
  pricingTemplateIdOnOpen,
}: {
  editingConnection?: Connection;
  modelApiFamily?: ApiFamily;
  pricingTemplates?: PricingTemplate[];
  pricingTemplateIdOnOpen?: number | null;
}) {
  const [connections, setConnections] = useState<Connection[]>(editingConnection ? [editingConnection] : []);
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
  } = useModelDetailDialogState({ globalEndpoints, modelApiFamily });

  const { handleConnectionSubmit } = useModelDetailConnectionMutations({
    id: "5",
    revision: 1,
    modelApiFamily,
    createMode,
    selectedEndpointId,
    newEndpointForm,
    connectionForm,
    headerRows,
    editingConnection: activeEditingConnection,
    pricingTemplates,
    endpointSourceDefaultName,
    refreshCurrentState: vi.fn(),
    setIsConnectionDialogOpen,
    setAllModels,
    setConnections,
    setGlobalEndpoints,
    setModel,
  });

  const committedConnection = connections[0] ?? null;
  const committedConnectionName = committedConnection?.name ?? committedConnection?.endpoint?.name ?? "";

  return (
    <>
        <button
          type="button"
          onClick={() => {
            openConnectionDialog(editingConnection);
            if (pricingTemplateIdOnOpen !== undefined) {
              setConnectionForm((current) => ({
                ...current,
                pricing_template_id: pricingTemplateIdOnOpen,
              }));
            }
            if (!editingConnection) {
              setCreateMode("new");
            }
          }}
        >
          Open Connection Dialog
        </button>
        {committedConnection ? (
          <ConnectionCardHeader
            connection={committedConnection}
            connectionName={committedConnectionName}
            isChecking={false}
          />
        ) : null}
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
          modelApiFamily={modelApiFamily}
          pricingTemplates={pricingTemplates}
        />
      </>
  );
}

function renderWithLocale(ui: React.ReactElement) {
  return render(<LocaleProvider>{ui}</LocaleProvider>);
}

describe("ConnectionDialog limiter fields", () => {
  beforeEach(() => {
    localStorage.clear();
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
      openai_probe_endpoint_variant: "responses",
      qps_limit: null,
      max_in_flight_non_stream: null,
      max_in_flight_stream: null,
    });
  });

  it("renders localized add-dialog copy in English", async () => {
    renderWithLocale(<ConnectionDialogHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Open Connection Dialog" }));

    expect(await screen.findByText("Add Connection")).toBeInTheDocument();
    expect(screen.getByText("Endpoint Source")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Select Existing" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Create New" })).toBeInTheDocument();
    expect(screen.getByLabelText("QPS Limit")).toBeInTheDocument();
    expect(screen.getByText("OpenAI probe endpoint")).toBeInTheDocument();
    expect(screen.getAllByText("Leave blank for unlimited.")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Save Connection" })).toBeInTheDocument();
  });

  it("renders localized edit-dialog copy in Chinese", async () => {
    localStorage.setItem("prism.locale", "zh-CN");

    renderWithLocale(<ConnectionDialogHarness editingConnection={buildConnection()} />);

    fireEvent.click(screen.getByRole("button", { name: "Open Connection Dialog" }));

    expect(await screen.findByText("编辑连接")).toBeInTheDocument();
    expect(screen.getByText("端点来源")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "选择现有端点" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "新建端点" })).toBeInTheDocument();
    expect(screen.getByLabelText("QPS 限流")).toBeInTheDocument();
    expect(screen.getByLabelText("最大并发（非流式）")).toBeInTheDocument();
    expect(screen.getByLabelText("最大并发（流式）")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "测试连接" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存连接" })).toBeInTheDocument();
  });

  it("shows the OpenAI probe variant selector only for OpenAI models", async () => {
    renderWithLocale(<ConnectionDialogHarness modelApiFamily="anthropic" />);

    fireEvent.click(screen.getByRole("button", { name: "Open Connection Dialog" }));

    expect(await screen.findByText("Add Connection")).toBeInTheDocument();
    expect(screen.queryByText("OpenAI probe endpoint")).not.toBeInTheDocument();
  });

  it("hydrates existing limiter values when editing a connection", async () => {
    renderWithLocale(
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

  it("adds stable names and autocomplete metadata for connection form fields", async () => {
    const pricingTemplate = buildPricingTemplate({ id: 9 });
    renderWithLocale(
      <ConnectionDialogHarness pricingTemplates={[pricingTemplate]} pricingTemplateIdOnOpen={pricingTemplate.id} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open Connection Dialog" }));

    expect(await screen.findByText("Add Connection")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveAttribute("name", "endpoint_name");
    expect(screen.getByLabelText("Base URL")).toHaveAttribute("name", "endpoint_base_url");
    expect(screen.getByLabelText("Base URL")).toHaveAttribute("autocomplete", "url");
    expect(screen.getByLabelText("API Key")).toHaveAttribute("name", "endpoint_api_key");
    expect(screen.getByLabelText("API Key")).toHaveAttribute("autocomplete", "off");
    expect(screen.getByLabelText("Name (Optional)")).toHaveAttribute("name", "name");
    expect(screen.getByLabelText("QPS Limit")).toHaveAttribute("name", "qps_limit");
    expect(screen.getByLabelText("Max In-Flight (Non-Stream)")).toHaveAttribute(
      "name",
      "max_in_flight_non_stream",
    );
    expect(screen.getByLabelText("Max In-Flight (Stream)")).toHaveAttribute(
      "name",
      "max_in_flight_stream",
    );
    expect(document.querySelector('input[type="hidden"][name="create_mode"]')).toHaveValue("new");
    expect(document.querySelector('input[type="hidden"][name="pricing_template_id"]')).toHaveValue("9");
    expect(document.querySelector('input[type="hidden"][name="openai_probe_endpoint_variant"]')).toHaveValue(
      "responses",
    );
  });

  it("includes limiter fields in the create submit payload when present", async () => {
    renderWithLocale(<ConnectionDialogHarness />);

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
    fireEvent.click(screen.getByRole("combobox", { name: "OpenAI probe endpoint" }));
    fireEvent.click(screen.getByRole("option", { name: "POST /v1/chat/completions" }));

    fireEvent.click(screen.getByRole("button", { name: "Save Connection" }));

    await waitFor(() => {
      expect(api.connections.create).toHaveBeenCalledWith(
        5,
        expect.objectContaining({
          openai_probe_endpoint_variant: "chat_completions",
          qps_limit: 9,
          max_in_flight_non_stream: 5,
          max_in_flight_stream: 2,
        }),
      );
    });
  });

  it("submits null limiter values after clearing existing inputs", async () => {
    renderWithLocale(
        <ConnectionDialogHarness
          editingConnection={buildConnection({
            openai_probe_endpoint_variant: "chat_completions",
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
          openai_probe_endpoint_variant: "chat_completions",
          qps_limit: null,
          max_in_flight_non_stream: null,
          max_in_flight_stream: null,
        }),
      );
    });
  });

  it("hydrates the committed connection pricing template after edit when update omits the nested relation", async () => {
    const pricingTemplate = buildPricingTemplate({
      id: 9,
      name: "EUR Template",
      pricing_currency_code: "EUR",
      version: 4,
    });

    api.connections.update.mockResolvedValue(
      buildConnection({
        pricing_template_id: pricingTemplate.id,
        pricing_template: null,
      }),
    );

    renderWithLocale(
      <ConnectionDialogHarness
        editingConnection={buildConnection()}
        pricingTemplates={[pricingTemplate]}
        pricingTemplateIdOnOpen={pricingTemplate.id}
      />,
    );

    expect(screen.getByText("Pricing Off")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open Connection Dialog" }));

    expect(await screen.findByText("Edit Connection")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save Connection" }));

    await waitFor(() => {
      expect(api.connections.update).toHaveBeenCalledWith(
        11,
        expect.objectContaining({ pricing_template_id: pricingTemplate.id }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Pricing On")).toBeInTheDocument();
      expect(screen.getByText("EUR Template v4")).toBeInTheDocument();
      expect(screen.getByText("EUR")).toBeInTheDocument();
    });
  });
});
