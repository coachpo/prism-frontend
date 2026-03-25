import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { FiltersBarPrimaryFilters } from "../FiltersBarPrimaryFilters";
import { FiltersBarSecondaryFilters } from "../FiltersBarSecondaryFilters";

function renderWithLocale(ui: React.ReactElement) {
  return render(<LocaleProvider>{ui}</LocaleProvider>);
}

describe("request log filter split components", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the primary filter controls and wires search changes", () => {
    const setSearch = vi.fn();

    renderWithLocale(
      <FiltersBarPrimaryFilters
        filterOptions={{ connections: [], endpoints: [], models: [], providers: [] }}
        filterOptionsLoaded={true}
        state={{
          connection_id: "",
          endpoint_id: "",
          model_id: "",
          provider_type: "",
          search: "",
          status_family: "all",
          time_range: "24h",
        }}
        actions={{
          setConnectionId: vi.fn(),
          setEndpointId: vi.fn(),
          setModelId: vi.fn(),
          setProviderType: vi.fn(),
          setSearch,
          setStatusFamily: vi.fn(),
          setTimeRange: vi.fn(),
        }}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(/model, provider, path, or error/i), {
      target: { value: "gateway error" },
    });

    expect(screen.getByText("Search")).toBeInTheDocument();
    expect(screen.getByText("Time range")).toBeInTheDocument();
    expect(setSearch).toHaveBeenCalledWith("gateway error");
  });

  it("renders the secondary refinement controls and reset actions", () => {
    renderWithLocale(
      <FiltersBarSecondaryFilters
        localRefinementOpen={true}
        onLocalRefinementOpenChange={vi.fn()}
        state={{
          billable_only: false,
          latency_bucket: "all",
          outcome_filter: "all",
          priced_only: false,
          special_token_filter: "",
          stream_filter: "all",
          token_max: "",
          token_min: "",
          triage: false,
          view: "all",
        }}
        actions={{
          setBillableOnly: vi.fn(),
          setLatencyBucket: vi.fn(),
          setOutcomeFilter: vi.fn(),
          setPricedOnly: vi.fn(),
          setSpecialTokenFilter: vi.fn(),
          setStreamFilter: vi.fn(),
          setTokenMax: vi.fn(),
          setTokenMin: vi.fn(),
          setTriage: vi.fn(),
          setView: vi.fn(),
        }}
      />,
    );

    expect(screen.getByText("Local refinement")).toBeInTheDocument();
    expect(screen.getByText("Triage")).toBeInTheDocument();
    expect(screen.getByText("Priced only")).toBeInTheDocument();
  });

  it("renders localized request-log filter copy when the saved locale is Chinese", () => {
    localStorage.setItem("prism.locale", "zh-CN");

    renderWithLocale(
      <FiltersBarPrimaryFilters
        filterOptions={{ connections: [], endpoints: [], models: [], providers: [] }}
        filterOptionsLoaded={true}
        state={{
          connection_id: "",
          endpoint_id: "",
          model_id: "",
          provider_type: "",
          search: "",
          status_family: "all",
          time_range: "24h",
        }}
        actions={{
          setConnectionId: vi.fn(),
          setEndpointId: vi.fn(),
          setModelId: vi.fn(),
          setProviderType: vi.fn(),
          setSearch: vi.fn(),
          setStatusFamily: vi.fn(),
          setTimeRange: vi.fn(),
        }}
      />,
    );

    expect(screen.getByText("搜索")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("模型、提供商、路径或错误")).toBeInTheDocument();
    expect(screen.getByText("时间范围")).toBeInTheDocument();
  });

  it("renders the selected model display name while preserving the model_id value", () => {
    renderWithLocale(
      <FiltersBarPrimaryFilters
        filterOptions={{
          connections: [],
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
              provider: {
                audit_capture_bodies: false,
                audit_enabled: false,
                created_at: "2026-01-01T00:00:00Z",
                description: null,
                id: 1,
                name: "OpenAI",
                provider_type: "openai",
                updated_at: "2026-01-01T00:00:00Z",
              },
              provider_id: 1,
              redirect_to: null,
              updated_at: "2026-01-01T00:00:00Z",
            },
          ],
          providers: [],
        }}
        filterOptionsLoaded={true}
        state={{
          connection_id: "",
          endpoint_id: "",
          model_id: "gpt-4o-mini",
          provider_type: "",
          search: "",
          status_family: "all",
          time_range: "24h",
        }}
        actions={{
          setConnectionId: vi.fn(),
          setEndpointId: vi.fn(),
          setModelId: vi.fn(),
          setProviderType: vi.fn(),
          setSearch: vi.fn(),
          setStatusFamily: vi.fn(),
          setTimeRange: vi.fn(),
        }}
      />,
    );

    expect(screen.getByText("GPT-4o Mini")).toBeInTheDocument();
    expect(screen.queryByText("gpt-4o-mini")).not.toBeInTheDocument();
  });
});
