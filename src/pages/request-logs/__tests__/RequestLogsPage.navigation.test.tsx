import * as React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RequestLogEntry } from "@/lib/types";
import { RequestLogsPage } from "../../RequestLogsPage";

const {
  mockConnectionsOwner,
  mockNavigate,
  mockUseRequestLogPageState,
  mockUseRequestLogsPageData,
} = vi.hoisted(() => ({
  mockConnectionsOwner: vi.fn(),
  mockNavigate: vi.fn(),
  mockUseRequestLogPageState: vi.fn(),
  mockUseRequestLogsPageData: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/hooks/useConnectionNavigation", () => ({
  useConnectionNavigation: () => {
    throw new Error("RequestLogsPage should use a request-logs-local connection helper");
  },
}));

vi.mock("@/lib/api", () => ({
  api: {
    connections: {
      owner: mockConnectionsOwner,
    },
  },
}));

vi.mock("@/context/ProfileContext", () => ({
  useProfileContext: () => ({
    revision: 3,
    selectedProfileId: 7,
  }),
}));

vi.mock("@/hooks/useTimezone", () => ({
  useTimezone: () => ({
    format: (isoString: string) => `formatted:${isoString}`,
  }),
}));

vi.mock("@/i18n/useLocale", () => ({
  useLocale: () => ({
    messages: {
      requestLogs: {
        requestLogsTitle: "Request logs",
        requestLogsDescription: "Inspect request activity",
        requestNotFound: "Request not found",
        requestNotFoundDescription: (requestId: string | null) =>
          `Request ${requestId ?? ""} not found`,
        returnToRequestList: "Return to request list",
      },
    },
  }),
}));

vi.mock("@/components/PageHeader", () => ({
  PageHeader: ({ title, description }: { title: string; description: string }) => (
    <div>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  ),
}));

vi.mock("../useRequestLogPageState", () => ({
  useRequestLogPageState: mockUseRequestLogPageState,
}));

vi.mock("../useRequestLogsPageData", () => ({
  useRequestLogsPageData: mockUseRequestLogsPageData,
}));

vi.mock("../clientFilters", () => ({
  applyClientFilters: (items: RequestLogEntry[]) => items,
}));

vi.mock("../RequestFocusBanner", () => ({
  RequestFocusBanner: ({ requestId }: { requestId: string | null }) => (
    <div>{`request-focus-banner:${requestId ?? ""}`}</div>
  ),
}));

vi.mock("../FiltersBar", () => ({
  FiltersBar: () => <div>filters-bar</div>,
}));

vi.mock("../RequestLogsTable", () => ({
  RequestLogsTable: ({
    activeRequestId,
    items,
    onSelectRequest,
  }: {
    activeRequestId: number | null;
    items: RequestLogEntry[];
    onSelectRequest: (id: number) => void;
  }) => (
    <div>
      <div>request-logs-table</div>
      {items[0] ? (
        <button type="button" onClick={() => onSelectRequest(items[0].id)}>
          open-request
        </button>
      ) : null}
      {activeRequestId !== null ? <div>{`active-request:${activeRequestId}`}</div> : null}
    </div>
  ),
}));

vi.mock("../RequestLogDetailSheet", async () => {
  const React = await vi.importActual<typeof import("react")>("react");

  return {
    RequestLogDetailSheet: ({
      activeTab,
      onClose,
      onNavigateToConnection,
      onTabChange,
      open,
      request,
    }: {
      activeTab: "overview" | "audit";
      onClose: () => void;
      onNavigateToConnection: (connectionId: number) => void;
      onTabChange: (tab: "overview" | "audit") => void;
      open: boolean;
      request: RequestLogEntry | null;
    }) => {
      const [isPresent, setIsPresent] = React.useState(open);

      React.useEffect(() => {
        if (open) {
          setIsPresent(true);
          return;
        }

        const timer = window.setTimeout(() => setIsPresent(false), 0);
        return () => window.clearTimeout(timer);
      }, [open]);

      if (!isPresent) {
        return null;
      }

      return (
        <div data-open={open ? "true" : "false"} data-testid="detail-sheet">
          <div>{`Request #${request?.id ?? ""}`}</div>
          <div>{`active-tab:${activeTab}`}</div>
          {request ? (
            <button type="button" onClick={() => onNavigateToConnection(request.connection_id ?? -1)}>
              navigate-to-connection
            </button>
          ) : null}
          <button type="button" onClick={() => onTabChange("audit")}>
            switch-to-audit
          </button>
          <button type="button" onClick={() => onTabChange("overview")}>
            switch-to-overview
          </button>
          <button type="button" onClick={onClose}>
            close-request
          </button>
        </div>
      );
    },
  };
});

function buildRequestLogEntry(): RequestLogEntry {
  return {
    id: 42,
    model_id: "gpt-5.4",
    resolved_target_model_id: null,
    profile_id: 7,
    api_family: "openai",
    endpoint_id: 12,
    connection_id: 34,
    ingress_request_id: null,
    attempt_number: null,
    provider_correlation_id: null,
    endpoint_base_url: "https://api.example.com/v1",
    endpoint_description: "Primary endpoint",
    status_code: 200,
    response_time_ms: 912,
    is_stream: true,
    input_tokens: 100,
    output_tokens: 50,
    total_tokens: 150,
    success_flag: true,
    billable_flag: true,
    priced_flag: true,
    unpriced_reason: null,
    cache_read_input_tokens: 0,
    cache_creation_input_tokens: 0,
    reasoning_tokens: 0,
    input_cost_micros: 1000,
    output_cost_micros: 2000,
    cache_read_input_cost_micros: 0,
    cache_creation_input_cost_micros: 0,
    reasoning_cost_micros: 0,
    total_cost_original_micros: 3000,
    total_cost_user_currency_micros: 3000,
    currency_code_original: "USD",
    report_currency_code: "USD",
    report_currency_symbol: "$",
    fx_rate_used: null,
    fx_rate_source: null,
    pricing_snapshot_unit: null,
    pricing_snapshot_input: null,
    pricing_snapshot_output: null,
    pricing_snapshot_cache_read_input: null,
    pricing_snapshot_cache_creation_input: null,
    pricing_snapshot_reasoning: null,
    pricing_snapshot_missing_special_token_price_policy: null,
    pricing_config_version_used: 1,
    request_path: "/v1/chat/completions",
    error_detail: null,
    created_at: "2026-03-16T00:00:00.000Z",
  };
}

function setupMockPageState(overrides: Partial<Record<string, unknown>> = {}) {
  const clearRequest = vi.fn();
  const setDetailTab = vi.fn();
  const setLimit = vi.fn();
  const goToNextPage = vi.fn();
  const goToPreviousPage = vi.fn();

  mockUseRequestLogPageState.mockImplementation(() => {
    const [state, setState] = React.useState({
      ingress_request_id: "",
      model_id: "",
      api_family: "",
      connection_id: "",
      endpoint_id: "",
      time_range: "24h",
      status_family: "all",
      search: "",
      outcome_filter: "all",
      stream_filter: "all",
      latency_bucket: "all",
      token_min: "",
      token_max: "",
      priced_only: false,
      billable_only: false,
      special_token_filter: "all",
      triage: false,
      request_id: "",
      detail_tab: "overview",
      view: "table",
      limit: 25,
      offset: 0,
      ...overrides,
    });

    return {
      state,
      isExactMode: state.request_id !== "",
      clearRequest: () => {
        clearRequest();
        setState((current) => ({ ...current, request_id: "", detail_tab: "overview" }));
      },
      setDetailTab: (tab: "overview" | "audit") => {
        setDetailTab(tab);
        setState((current) => ({ ...current, detail_tab: tab }));
      },
      setLimit,
      goToNextPage,
      goToPreviousPage,
    };
  });

  return {
    clearRequest,
    goToNextPage,
    goToPreviousPage,
    setDetailTab,
    setLimit,
  };
}

describe("RequestLogsPage request detail sheet", () => {
  beforeEach(() => {
    mockConnectionsOwner.mockReset();
    mockNavigate.mockReset();
    mockUseRequestLogPageState.mockReset();
    mockUseRequestLogsPageData.mockReset();

    mockConnectionsOwner.mockResolvedValue({ model_config_id: 99 });
    mockUseRequestLogsPageData.mockReturnValue({
      items: [buildRequestLogEntry()],
      total: 1,
      loading: false,
      error: null,
      filterOptions: { models: [] },
      filterOptionsLoaded: true,
      refresh: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps the selected request visible during overview close until the sheet fully exits", () => {
    vi.useFakeTimers();
    setupMockPageState();

    render(<RequestLogsPage />);

    fireEvent.click(screen.getByRole("button", { name: "open-request" }));
    expect(screen.getByText("Request #42")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "close-request" }));

    expect(screen.getByTestId("detail-sheet")).toHaveAttribute("data-open", "false");
    expect(screen.getByText("Request #42")).toBeInTheDocument();
    expect(screen.queryByText(/^Request #$/)).not.toBeInTheDocument();

    act(() => {
      vi.runAllTimers();
    });

    expect(screen.queryByTestId("detail-sheet")).not.toBeInTheDocument();
  });

  it("closes from the audit tab in one action without degrading to a blank request shell", () => {
    vi.useFakeTimers();
    setupMockPageState();

    render(<RequestLogsPage />);

    fireEvent.click(screen.getByRole("button", { name: "open-request" }));
    fireEvent.click(screen.getByRole("button", { name: "switch-to-audit" }));

    expect(screen.getByText("active-tab:audit")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "close-request" }));

    expect(screen.getByTestId("detail-sheet")).toHaveAttribute("data-open", "false");
    expect(screen.getByText("Request #42")).toBeInTheDocument();
    expect(screen.getByText("active-tab:audit")).toBeInTheDocument();
    expect(screen.queryByText("active-tab:overview")).not.toBeInTheDocument();
    expect(screen.queryByText(/^Request #$/)).not.toBeInTheDocument();

    act(() => {
      vi.runAllTimers();
    });

    expect(screen.queryByTestId("detail-sheet")).not.toBeInTheDocument();
  });

  it("clears exact-request mode after dismissal while keeping the request snapshot stable during exit", () => {
    vi.useFakeTimers();
    const { clearRequest } = setupMockPageState({ request_id: "42", detail_tab: "audit" });

    render(<RequestLogsPage />);

    expect(screen.getByText("request-focus-banner:42")).toBeInTheDocument();
    expect(screen.getByText("Request #42")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "close-request" }));

    expect(clearRequest).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("detail-sheet")).toHaveAttribute("data-open", "false");
    expect(screen.getByText("Request #42")).toBeInTheDocument();
    expect(screen.getByText("active-tab:audit")).toBeInTheDocument();
    expect(screen.queryByText("active-tab:overview")).not.toBeInTheDocument();
    expect(screen.queryByText(/^Request #$/)).not.toBeInTheDocument();

    act(() => {
      vi.runAllTimers();
    });

    expect(screen.queryByTestId("detail-sheet")).not.toBeInTheDocument();
    expect(screen.queryByText("request-focus-banner:42")).not.toBeInTheDocument();
    expect(screen.getByText("request-logs-table")).toBeInTheDocument();
  });

  it("drills from a request log into the owning model with focus_connection_id", async () => {
    setupMockPageState({ request_id: "42", detail_tab: "overview" });

    render(<RequestLogsPage />);

    fireEvent.click(screen.getByRole("button", { name: "navigate-to-connection" }));

    await waitFor(() => {
      expect(mockConnectionsOwner).toHaveBeenCalledWith(34);
    });
    expect(mockNavigate).toHaveBeenCalledWith("/models/99?focus_connection_id=34");
  });
});
