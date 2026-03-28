import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import type { UsageRequestEventAvailableFilters } from "@/lib/types";
import type { UsageStatisticsRequestEventRow } from "../useUsageStatisticsPageData";
import { RequestEventsTable } from "../tables/RequestEventsTable";
import { installLocalStorageMock } from "./storage";

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
    installLocalStorageMock();
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

  it("renders Prism request-event rows, supports local snapshot-backed filters, keeps ingress drilldown links, and exports the filtered set", async () => {
    const createObjectURL = vi.mocked(URL.createObjectURL);
    const revokeObjectURL = vi.mocked(URL.revokeObjectURL);
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const availableFilters: UsageRequestEventAvailableFilters = {
      api_families: [
        { api_family: "anthropic", label: "anthropic" },
        { api_family: "openai", label: "openai" },
      ],
      endpoints: [
        { endpoint_id: 10, label: "Primary Endpoint" },
        { endpoint_id: 11, label: "Secondary Endpoint" },
      ],
      models: [
        { label: "Claude Sonnet 4.6", model_id: "claude-sonnet-4-6" },
        { label: "GPT-5.4", model_id: "gpt-5.4" },
      ],
      proxy_api_keys: [
        {
          key_prefix: "prism_pk_primary_1234",
          label: "Primary runtime key",
          proxy_api_key_id: 77,
        },
        {
          key_prefix: "prism_pk_fallback_5678",
          label: "Fallback runtime key",
          proxy_api_key_id: 88,
        },
      ],
    };
    const items = [
      createRequestEvent(),
      createRequestEvent({
        api_family: "anthropic",
        attempt_count: 1,
        created_at: "2026-03-27T10:30:00Z",
        endpoint_id: 11,
        endpoint_label: "Secondary Endpoint",
        ingress_request_id: "ingress-failed-2",
        model_id: "claude-sonnet-4-6",
        model_label: "Claude Sonnet 4.6",
        proxy_api_key: {
          key_prefix: "prism_pk_fallback_5678",
          label: "Fallback runtime key",
        },
        request_logs_href: "/request-logs?ingress_request_id=ingress-failed-2",
        status_code: 502,
        success_flag: false,
        total_cost_micros: 0,
        total_tokens: 60,
      }),
    ];

    render(
      <MemoryRouter>
        <LocaleProvider>
          <RequestEventsTable
            availableFilters={availableFilters}
            items={items}
            renderLimit={2}
            shownCount={2}
            total={4}
          />
        </LocaleProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText("Request Events")).toBeInTheDocument();
    expect(screen.getByText("ingress-success-1")).toBeInTheDocument();
    expect(screen.getByText("ingress-failed-2")).toBeInTheDocument();
    expect(screen.getByText("Showing 2 of 4 request events")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "GPT-5.4" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Primary Endpoint" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "openai" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Primary runtime key" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View in Request Logs" })).toHaveAttribute(
      "href",
      "/request-logs?ingress_request_id=ingress-success-1",
    );

    fireEvent.click(screen.getByRole("button", { name: "GPT-5.4" }));

    expect(screen.getByText("ingress-success-1")).toBeInTheDocument();
    expect(screen.queryByText("ingress-failed-2")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear Filters" })).toBeInTheDocument();

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
      expect(await jsonBlob.text()).toContain("ingress-success-1");
      expect(await jsonBlob.text()).not.toContain("ingress-failed-2");
      expect(await csvBlob.text()).toContain("ingress-success-1");
      expect(await csvBlob.text()).not.toContain("ingress-failed-2");
      expect(jsonBlob.type).toBe("application/json");
      expect(csvBlob.type).toContain("text/csv");
      expect(jsonBlob.size).toBeGreaterThan(0);
      expect(csvBlob.size).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole("button", { name: "Clear Filters" }));
    expect(screen.getByText("ingress-failed-2")).toBeInTheDocument();

    expect(clickSpy).toHaveBeenCalledTimes(2);
    expect(revokeObjectURL).toHaveBeenCalledTimes(2);
  });
});
