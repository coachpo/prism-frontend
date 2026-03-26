import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import type { AuditLogDetail, RequestLogEntry } from "@/lib/types";
import { RequestLogDetailSheet } from "../RequestLogDetailSheet";
import { useAuditDetail } from "../useAuditDetail";

vi.mock("../useAuditDetail", () => ({
  useAuditDetail: vi.fn(),
}));

const baseRequest = {
  id: 42,
  model_id: "gpt-5.4",
  resolved_target_model_id: null,
  profile_id: 7,
  provider_type: "openai",
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
} as unknown as RequestLogEntry;

const baseAudit: AuditLogDetail = {
  id: 9,
  request_log_id: 42,
  profile_id: 7,
  provider_id: 1,
  model_id: "gpt-5.4",
  endpoint_id: 12,
  connection_id: 34,
  endpoint_base_url: "https://api.example.com/v1",
  endpoint_description: "Primary endpoint",
  request_method: "POST",
  request_url: "https://api.example.com/v1/chat/completions",
  request_headers: '{"authorization":"redacted"}',
  request_body: '{"messages":[]}',
  response_status: 200,
  response_headers: '{"content-type":"application/json"}',
  response_body: '{"id":"resp_1"}',
  is_stream: false,
  duration_ms: 450,
  created_at: "2026-03-16T00:00:00.000Z",
};

const useAuditDetailMock = vi.mocked(useAuditDetail);

function renderSheet(
  overrides?: Partial<React.ComponentProps<typeof RequestLogDetailSheet>> & {
    request?: RequestLogEntry;
  }
) {
  const onClose = vi.fn();
  const onNavigateToConnection = vi.fn();
  const onTabChange = vi.fn();
  const request = overrides?.request ?? baseRequest;

  render(
    <LocaleProvider>
      <RequestLogDetailSheet
        request={request}
        open
        activeTab="overview"
        onTabChange={onTabChange}
        onClose={onClose}
        onNavigateToConnection={onNavigateToConnection}
        formatTimestamp={(iso) => `formatted:${iso}`}
        resolveModelLabel={() => "GPT 5.4"}
        {...overrides}
      />
    </LocaleProvider>
  );

  return { onClose, onNavigateToConnection, onTabChange };
}

describe("RequestLogDetailSheet", () => {
  beforeEach(() => {
    useAuditDetailMock.mockReturnValue({
      audits: [],
      error: null,
      loading: false,
    });
  });

  it("renders overview content and forwards navigation/tab/close actions", () => {
    const { onClose, onNavigateToConnection, onTabChange } = renderSheet();

    expect(screen.getByText("Request #42")).toBeInTheDocument();
    expect(screen.getAllByText("GPT 5.4")).toHaveLength(2);
    expect(screen.getAllByText("/v1/chat/completions")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: /#34/i }));
    expect(onNavigateToConnection).toHaveBeenCalledWith(34);

    const auditTab = screen.getByRole("tab", { name: /audit/i });
    fireEvent.mouseDown(auditTab);
    fireEvent.click(auditTab);
    expect(onTabChange).toHaveBeenCalledWith("audit");

    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows requested and resolved model context side by side", () => {
    render(
      <LocaleProvider>
        <RequestLogDetailSheet
          request={{
            ...baseRequest,
            model_id: "claude-sonnet-4-5",
            resolved_target_model_id: "claude-sonnet-4-5-20250929",
          } as RequestLogEntry}
          open
          activeTab="overview"
          onTabChange={vi.fn()}
          onClose={vi.fn()}
          onNavigateToConnection={vi.fn()}
          formatTimestamp={(iso) => `formatted:${iso}`}
          resolveModelLabel={(modelId) =>
            ({
              "claude-sonnet-4-5": "Claude Sonnet 4.5 Proxy",
              "claude-sonnet-4-5-20250929": "Claude Sonnet 4.5 (20250929)",
            })[modelId] ?? modelId
          }
        />
      </LocaleProvider>,
    );

    expect(screen.getByText("Requested model")).toBeInTheDocument();
    expect(screen.getByText("Resolved target")).toBeInTheDocument();
    expect(screen.getAllByText("Claude Sonnet 4.5 Proxy").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Claude Sonnet 4.5 (20250929)").length).toBeGreaterThan(0);
  });

  it("renders the loading audit state", () => {
    useAuditDetailMock.mockReturnValue({
      audits: [],
      error: null,
      loading: true,
    });

    render(
      <LocaleProvider>
        <RequestLogDetailSheet
          request={baseRequest}
          open
          activeTab="audit"
          onTabChange={vi.fn()}
          onClose={vi.fn()}
          onNavigateToConnection={vi.fn()}
          formatTimestamp={(iso) => `formatted:${iso}`}
          resolveModelLabel={() => "GPT 5.4"}
        />
      </LocaleProvider>
    );

    expect(document.body.querySelectorAll('[data-slot="skeleton"]').length).toBe(3);
  });

  it("preserves up to six fractional digits for small costs", () => {
    renderSheet({
      request: {
        ...baseRequest,
        total_cost_user_currency_micros: 23_412,
      },
    });

    expect(screen.getAllByText("$0.023412")).toHaveLength(2);
    expect(screen.queryByText("$0.0234")).not.toBeInTheDocument();
  });

  it("formats structured error detail for readability", () => {
    renderSheet({
      request: {
        ...baseRequest,
        status_code: 429,
        error_detail:
          '{"error":{"message":"The usage limit has been reached","type":"usage_limit_reached","param":null,"code":null,"plan_type":"basic","resets_in_seconds":28797}}',
      },
    });

    expect(screen.getByText(/formatted for readability/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
    expect(screen.getByText(/"type": "usage_limit_reached"/)).toBeInTheDocument();
    expect(screen.queryByText(/"type":"usage_limit_reached"/)).not.toBeInTheDocument();
  });

  it("copies the visible error detail through the Clipboard API when available", async () => {
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
      renderSheet({
        request: {
          ...baseRequest,
          status_code: 429,
          error_detail:
            '{"error":{"message":"The usage limit has been reached","type":"usage_limit_reached","param":null,"code":null,"plan_type":"basic","resets_in_seconds":28797}}',
        },
      });

      const formattedDetail = screen.getByText(/"type": "usage_limit_reached"/).textContent;
      expect(formattedDetail).toBeTruthy();

      fireEvent.click(screen.getByRole("button", { name: /copy/i }));

      await waitFor(() => {
        expect(writeTextMock).toHaveBeenCalledWith(formattedDetail);
      });
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

  it("applies wrapped monospace styling to long technical overview fields", () => {
    renderSheet({
      request: {
        ...baseRequest,
        model_id: "provider/super-long-model-id-with-many-segments-and-qualifiers",
        request_path: "/v1/responses/really/long/path/segment/that/should/wrap/in/the/drawer/without/overflow",
        endpoint_base_url:
          "https://api.example.com/v1/really/long/base/url/with/many/path/segments/and/query/like/values/that/should/wrap",
      },
    });

    const baseUrl = screen.getByText(
      "https://api.example.com/v1/really/long/base/url/with/many/path/segments/and/query/like/values/that/should/wrap"
    );

    expect(baseUrl).toHaveClass("font-mono", "whitespace-pre-wrap", "break-words");

    const wrappedPath = screen
      .getAllByText("/v1/responses/really/long/path/segment/that/should/wrap/in/the/drawer/without/overflow")
      .find((element) => element.className.includes("whitespace-pre-wrap"));

    expect(wrappedPath).toBeDefined();
    expect(wrappedPath).toHaveClass("font-mono", "whitespace-pre-wrap", "break-words");
  });

  it("renders the error audit state", () => {
    useAuditDetailMock.mockReturnValue({
      audits: [],
      error: "Audit temporarily unavailable",
      loading: false,
    });

    renderSheet({ activeTab: "audit" });

    expect(screen.getByText("Audit capture unavailable")).toBeInTheDocument();
    expect(screen.getByText("Audit temporarily unavailable")).toBeInTheDocument();
  });

  it("renders the empty audit state", () => {
    renderSheet({ activeTab: "audit" });

    expect(screen.getByText("No audit records found for this request.")).toBeInTheDocument();
  });

  it("renders captured audit payloads", () => {
    useAuditDetailMock.mockReturnValue({
      audits: [baseAudit],
      error: null,
      loading: false,
    });

    renderSheet({ activeTab: "audit" });

    expect(screen.getByText("POST https://api.example.com/v1/chat/completions")).toBeInTheDocument();
    expect(screen.getByText('{"messages":[]}')).toBeInTheDocument();
    expect(screen.getByText('{"id":"resp_1"}')).toBeInTheDocument();
  });

  it("wraps the audit request URL in a monospace block", () => {
    useAuditDetailMock.mockReturnValue({
      audits: [
        {
          ...baseAudit,
          request_url:
            "https://api.example.com/v1/chat/completions/really/long/path/that/should/wrap/in/the/audit/header/without/horizontal/overflow",
        },
      ],
      error: null,
      loading: false,
    });

    renderSheet({ activeTab: "audit" });

    const requestLine = screen.getByText(
      "POST https://api.example.com/v1/chat/completions/really/long/path/that/should/wrap/in/the/audit/header/without/horizontal/overflow"
    );

    expect(requestLine.tagName).toBe("PRE");
    expect(requestLine).toHaveClass("font-mono", "whitespace-pre-wrap", "break-words");
  });

  it("renders localized detail-sheet copy when the saved locale is Chinese", () => {
    localStorage.setItem("prism.locale", "zh-CN");

    render(
      <LocaleProvider>
        <RequestLogDetailSheet
          request={baseRequest}
          open
          activeTab="overview"
          onTabChange={vi.fn()}
          onClose={vi.fn()}
          onNavigateToConnection={vi.fn()}
          formatTimestamp={(iso) => `格式化:${iso}`}
          resolveModelLabel={() => "GPT 5.4"}
        />
      </LocaleProvider>,
    );

    expect(screen.getByText("技术排查")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /概览/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /审计/i })).toBeInTheDocument();
  });
});
