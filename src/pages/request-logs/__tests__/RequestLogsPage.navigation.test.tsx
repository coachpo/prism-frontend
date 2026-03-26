import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
  RequestFocusBanner: () => <div>request-focus-banner</div>,
}));

vi.mock("../FiltersBar", () => ({
  FiltersBar: () => <div>filters-bar</div>,
}));

vi.mock("../RequestLogsTable", () => ({
  RequestLogsTable: () => <div>request-logs-table</div>,
}));

vi.mock("../RequestLogDetailSheet", () => ({
  RequestLogDetailSheet: ({
    onNavigateToConnection,
    request,
  }: {
    onNavigateToConnection: (connectionId: number) => void;
    request: RequestLogEntry | null;
  }) =>
    request ? (
      <button type="button" onClick={() => onNavigateToConnection(request.connection_id ?? -1)}>
        navigate-to-connection
      </button>
    ) : null,
}));

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

describe("RequestLogsPage connection navigation", () => {
  beforeEach(() => {
    mockConnectionsOwner.mockReset();
    mockNavigate.mockReset();
    mockUseRequestLogPageState.mockReset();
    mockUseRequestLogsPageData.mockReset();

    mockConnectionsOwner.mockResolvedValue({ model_config_id: 99 });
    mockUseRequestLogPageState.mockReturnValue({
      state: {
        search: "",
        outcome_filter: "all",
        stream_filter: "all",
        latency_bucket: "all",
        token_min: "",
        token_max: "",
        priced_only: false,
        billable_only: false,
        special_token_filter: "all",
        triage: "all",
        request_id: "42",
        detail_tab: "overview",
        view: "table",
        limit: 25,
        offset: 0,
      },
      isExactMode: true,
      clearRequest: vi.fn(),
      setDetailTab: vi.fn(),
      setLimit: vi.fn(),
      goToNextPage: vi.fn(),
      goToPreviousPage: vi.fn(),
    });
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

  it("drills from a request log into the owning model with focus_connection_id", async () => {
    render(<RequestLogsPage />);

    fireEvent.click(screen.getByRole("button", { name: "navigate-to-connection" }));

    await waitFor(() => {
      expect(mockConnectionsOwner).toHaveBeenCalledWith(34);
    });
    expect(mockNavigate).toHaveBeenCalledWith("/models/99?focus_connection_id=34");
  });
});
