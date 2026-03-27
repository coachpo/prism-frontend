import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import type { UsageStatisticsRequestEventRow } from "../useUsageStatisticsPageData";
import { RequestEventsTable } from "../tables/RequestEventsTable";

function createRequestEvent(overrides: Partial<UsageStatisticsRequestEventRow> = {}): UsageStatisticsRequestEventRow {
  return {
    api_family: "openai",
    attempt_count: 2,
    cached_tokens: 25,
    connection_id: 12,
    created_at: "2026-03-27T11:00:00Z",
    endpoint_id: 10,
    endpoint_label: "Primary Endpoint",
    ingress_request_id: "ingress-success-1",
    input_tokens: 100,
    model_id: "gpt-5.4",
    model_label: "GPT-5.4",
    output_tokens: 50,
    proxy_api_key: {
      key_prefix: "prism_pk_primary_1234",
      label: "Primary runtime key",
    },
    reasoning_tokens: 10,
    request_logs_href: "/request-logs?ingress_request_id=ingress-success-1",
    request_path: "/v1/chat/completions",
    resolved_target_model_id: "gpt-5.4",
    status_code: 200,
    success_flag: true,
    total_cost_micros: 4200,
    total_tokens: 185,
    ...overrides,
  };
}

describe("RequestEventsTable", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:request-events"),
      writable: true,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
      writable: true,
    });
  });

  it("renders Prism request-event rows, keeps ingress drilldown links, and exports JSON plus CSV client-side", async () => {
    const createObjectURL = vi.mocked(URL.createObjectURL);
    const revokeObjectURL = vi.mocked(URL.revokeObjectURL);
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);

    render(
      <MemoryRouter>
        <LocaleProvider>
          <RequestEventsTable items={[createRequestEvent()]} total={1} />
        </LocaleProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText("Request Events")).toBeInTheDocument();
    expect(screen.getByText("ingress-success-1")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View in Request Logs" })).toHaveAttribute(
      "href",
      "/request-logs?ingress_request_id=ingress-success-1",
    );

    fireEvent.click(screen.getByRole("button", { name: "Export request events JSON" }));
    fireEvent.click(screen.getByRole("button", { name: "Export request events CSV" }));

    await waitFor(async () => {
      expect(createObjectURL).toHaveBeenCalledTimes(2);

      const jsonBlob = createObjectURL.mock.calls[0]?.[0];
      const csvBlob = createObjectURL.mock.calls[1]?.[0];

      expect(jsonBlob).toBeInstanceOf(Blob);
      expect(csvBlob).toBeInstanceOf(Blob);
      if (!(jsonBlob instanceof Blob) || !(csvBlob instanceof Blob)) {
        throw new Error("Expected export payloads to be Blobs");
      }
      expect(jsonBlob.type).toBe("application/json");
      expect(csvBlob.type).toContain("text/csv");
      expect(jsonBlob.size).toBeGreaterThan(0);
      expect(csvBlob.size).toBeGreaterThan(0);
    });

    expect(clickSpy).toHaveBeenCalledTimes(2);
    expect(revokeObjectURL).toHaveBeenCalledTimes(2);
  });
});
