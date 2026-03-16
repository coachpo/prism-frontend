import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuditLogDetail, RequestLogEntry } from "@/lib/types";
import { RequestLogDetailSheet } from "../RequestLogDetailSheet";
import { useAuditDetail } from "../useAuditDetail";

vi.mock("../useAuditDetail", () => ({
  useAuditDetail: vi.fn(),
}));

const baseRequest: RequestLogEntry = {
  id: 42,
  model_id: "gpt-5.4",
  profile_id: 7,
  provider_type: "openai",
  endpoint_id: 12,
  connection_id: 34,
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

  it("renders the loading audit state", () => {
    useAuditDetailMock.mockReturnValue({
      audits: [],
      error: null,
      loading: true,
    });

    render(
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
});
