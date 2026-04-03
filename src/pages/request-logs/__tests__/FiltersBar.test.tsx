import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { FiltersBar } from "../FiltersBar";
import { FiltersBarPrimaryFilters } from "../FiltersBarPrimaryFilters";
import type { RequestLogPageActions } from "../useRequestLogPageState";

function renderWithLocale(ui: React.ReactElement) {
  return render(<LocaleProvider>{ui}</LocaleProvider>);
}

function createPrimaryActions() {
  return {
    setIngressRequestId: vi.fn(),
    setRequestId: vi.fn(),
    setEndpointId: vi.fn(),
    setModelId: vi.fn(),
    setApiFamily: vi.fn(),
    setSearch: vi.fn(),
    setStatusFamily: vi.fn(),
    setTimeRange: vi.fn(),
  };
}

function createFiltersBarActions(): RequestLogPageActions {
  return {
    state: {
      ingress_request_id: "",
      model_id: "",
      api_family: "",
      endpoint_id: "",
      time_range: "24h" as const,
      status_family: "all" as const,
      search: "",
      outcome_filter: "all" as const,
      stream_filter: "all" as const,
      latency_bucket: "all" as const,
      token_min: "",
      token_max: "",
      triage: false,
      request_id: "",
      detail_tab: "overview" as const,
      limit: 100,
      offset: 0,
    },
    isExactMode: false,
    hasActiveFilters: false,
    clearFilters: vi.fn(),
    setIngressRequestId: vi.fn(),
    setRequestId: vi.fn(),
    setEndpointId: vi.fn(),
    setModelId: vi.fn(),
    setApiFamily: vi.fn(),
    setSearch: vi.fn(),
    setStatusFamily: vi.fn(),
    setTimeRange: vi.fn(),
    setOutcomeFilter: vi.fn(),
    setStreamFilter: vi.fn(),
    setLatencyBucket: vi.fn(),
    setTokenMin: vi.fn(),
    setTokenMax: vi.fn(),
    setTriage: vi.fn(),
    setLimit: vi.fn(),
    setOffset: vi.fn(),
    selectRequest: vi.fn(),
    clearRequest: vi.fn(),
    setDetailTab: vi.fn(),
    goToNextPage: vi.fn(),
    goToPreviousPage: vi.fn(),
  };
}

describe("request log filters", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders request lookup and ingress filtering in the primary controls", () => {
    const actions = createPrimaryActions();

    renderWithLocale(
      <FiltersBarPrimaryFilters
        filterOptions={{ apiFamilies: [], endpoints: [], models: [] }}
        filterOptionsLoaded={true}
        state={{
          ingress_request_id: "",
          endpoint_id: "",
          model_id: "",
          api_family: "",
          search: "",
          status_family: "all",
          time_range: "24h",
        }}
        actions={actions}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(/model, vendor, path, or error/i), {
      target: { value: "gateway error" },
    });

    const requestIdInput = screen.getByPlaceholderText("Request ID");
    fireEvent.change(requestIdInput, { target: { value: "42" } });
    fireEvent.keyDown(requestIdInput, { key: "Enter", code: "Enter", charCode: 13 });

    fireEvent.change(screen.getByPlaceholderText("Ingress request ID"), {
      target: { value: "ingress_req_42" },
    });

    expect(screen.getByText("Search")).toBeInTheDocument();
    expect(screen.getByText("Request ID")).toBeInTheDocument();
    expect(screen.getByText("Ingress request ID")).toBeInTheDocument();
    expect(screen.queryByText("Connection")).not.toBeInTheDocument();
    expect(actions.setSearch).toHaveBeenCalledWith("gateway error");
    expect(actions.setRequestId).toHaveBeenCalledWith("42");
    expect(actions.setIngressRequestId).toHaveBeenCalledWith("ingress_req_42");
  });

  it("renders a single dense filter surface without local refinement or view controls", () => {
    const actions = createFiltersBarActions();

    renderWithLocale(
      <FiltersBar
        actions={actions}
        filterOptions={{ apiFamilies: [], endpoints: [], models: [] }}
        filterOptionsLoaded={true}
        onRefresh={vi.fn()}
        isRefreshing={false}
      />,
    );

    expect(screen.getByText("Outcome")).toBeInTheDocument();
    expect(screen.getByText("Stream")).toBeInTheDocument();
    expect(screen.getByText("Latency")).toBeInTheDocument();
    expect(screen.getByText("Token range")).toBeInTheDocument();
    expect(screen.getByText("Triage")).toBeInTheDocument();
    expect(screen.queryByText("Local refinement")).not.toBeInTheDocument();
    expect(screen.queryByText("View")).not.toBeInTheDocument();
    expect(screen.queryByText("Connection")).not.toBeInTheDocument();
  });

  it("renders localized request-log filter copy when the saved locale is Chinese", () => {
    localStorage.setItem("prism.locale", "zh-CN");

    renderWithLocale(
      <FiltersBarPrimaryFilters
        filterOptions={{ apiFamilies: [], endpoints: [], models: [] }}
        filterOptionsLoaded={true}
        state={{
          ingress_request_id: "",
          endpoint_id: "",
          model_id: "",
          api_family: "",
          search: "",
          status_family: "all",
          time_range: "24h",
        }}
        actions={createPrimaryActions()}
      />,
    );

    expect(screen.getByText("搜索")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("模型、供应商、路径或错误")).toBeInTheDocument();
    expect(screen.getByText("请求 ID")).toBeInTheDocument();
    expect(screen.getByText("入口请求 ID")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("入口请求 ID")).toBeInTheDocument();
  });

  it("renders the selected model display name while preserving the model_id value", () => {
    renderWithLocale(
      <FiltersBarPrimaryFilters
        filterOptions={{
          apiFamilies: ["openai"],
          endpoints: [],
          models: [
            {
              active_connection_count: 1,
              connection_count: 1,
              created_at: "2026-01-01T00:00:00Z",
              display_name: "GPT-4o Mini",
              health_success_rate: null,
              health_total_requests: 0,
              id: 1,
              is_enabled: true,
              loadbalance_strategy: null,
              loadbalance_strategy_id: null,
              model_id: "gpt-4o-mini",
              model_type: "native",
              vendor: {
                id: 1,
                key: "openai",
                name: "OpenAI",
                description: null,
                icon_key: null,
                audit_enabled: false,
                audit_capture_bodies: false,
                created_at: "2026-01-01T00:00:00Z",
                updated_at: "2026-01-01T00:00:00Z",
              },
              proxy_targets: [],
              updated_at: "2026-01-01T00:00:00Z",
            },
          ],
        }}
        filterOptionsLoaded={true}
        state={{
          ingress_request_id: "",
          endpoint_id: "",
          model_id: "gpt-4o-mini",
          api_family: "",
          search: "",
          status_family: "all",
          time_range: "24h",
        }}
        actions={createPrimaryActions()}
      />,
    );

    expect(screen.getByText("GPT-4o Mini")).toBeInTheDocument();
    expect(screen.queryByText("gpt-4o-mini")).not.toBeInTheDocument();
  });

  it("keeps long endpoint labels shrink-safe in the endpoint trigger", () => {
    const longEndpointLabel =
      "CodexPool primary endpoint with an intentionally long descriptive label for request-log coverage";

    renderWithLocale(
      <FiltersBarPrimaryFilters
        filterOptions={{
          apiFamilies: ["openai"],
          endpoints: [
            {
              id: 7,
              name: longEndpointLabel,
              base_url: "https://example.com/v1",
              has_api_key: true,
              masked_api_key: "sk-••••",
              position: 0,
              created_at: "2026-01-01T00:00:00Z",
              updated_at: "2026-01-01T00:00:00Z",
            },
          ],
          models: [],
        }}
        filterOptionsLoaded={true}
        state={{
          ingress_request_id: "",
          endpoint_id: "7",
          model_id: "",
          api_family: "openai",
          search: "",
          status_family: "all",
          time_range: "24h",
        }}
        actions={createPrimaryActions()}
      />,
    );

    const endpointTrigger = screen.getByText(longEndpointLabel).closest("button");
    expect(endpointTrigger).toHaveClass("w-full");
    expect(endpointTrigger).toHaveClass("min-w-0");
    expect(endpointTrigger).toHaveClass("max-w-full");
  });
});
