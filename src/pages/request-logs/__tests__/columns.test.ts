import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import type { ModelConfigListItem, RequestLogListItem } from "@/lib/types";
import { RequestLogsTable } from "../RequestLogsTable";
import { formatCost, getColumns } from "../columns";

class ResizeObserverMock {
  observe() {}
  disconnect() {}
  unobserve() {}
}

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  configurable: true,
  value: ResizeObserverMock,
});

function createResolveModelLabel(
  labels: Record<string, string>,
  modelTypes: Record<string, "native" | "proxy"> = {},
) {
  return Object.assign(
    (modelId: string) => labels[modelId] ?? modelId,
    {
      getModelMetadata: (modelId: string) =>
        modelTypes[modelId]
          ? ({
              model_id: modelId,
              model_type: modelTypes[modelId],
            } as ModelConfigListItem)
          : undefined,
    },
  );
}

function renderModelCell(
  row: RequestLogListItem,
  resolveModelLabel: ReturnType<typeof createResolveModelLabel>,
) {
  const modelColumn = getColumns("all").find((column) => column.key === "model_id");

  expect(modelColumn).toBeDefined();

  render(
    React.createElement(
      React.Fragment,
      null,
      modelColumn?.render(
        row,
        () => "formatted:2026-03-16T00:00:00.000Z",
        resolveModelLabel,
      ),
    ),
  );
}

function buildRow(overrides: Partial<RequestLogListItem> = {}): RequestLogListItem {
  return {
    id: 42,
    model_id: "claude-sonnet-4-5",
    resolved_target_model_id: null,
    created_at: "2026-03-16T00:00:00.000Z",
    api_family: "anthropic",
    vendor_id: 1,
    vendor_key: "anthropic",
    vendor_name: "Anthropic",
    endpoint_id: null,
    connection_id: null,
    status_code: 200,
    response_time_ms: 123,
    is_stream: false,
    total_tokens: null,
    total_cost_user_currency_micros: null,
    report_currency_symbol: null,
    ...overrides,
  } as RequestLogListItem;
}

describe("formatCost", () => {
  it("preserves up to six fractional digits for small costs", () => {
    expect(formatCost(23_412, "$" )).toBe("$0.023412");
  });

  it("returns an em dash for zero and missing costs", () => {
    expect(formatCost(null, "$" )).toBe("—");
    expect(formatCost(0, "$" )).toBe("—");
  });

  it("renders a proxy-origin sign for routed proxy rows", () => {
    renderModelCell(
      buildRow({
        resolved_target_model_id: "claude-sonnet-4-5-20250929",
        vendor_id: null,
        vendor_key: null,
        vendor_name: null,
      }),
      createResolveModelLabel(
        {
          "claude-sonnet-4-5": "Claude Sonnet 4.5 Proxy",
          "claude-sonnet-4-5-20250929": "Claude Sonnet 4.5 (20250929)",
        },
        { "claude-sonnet-4-5": "proxy" },
      ),
    );

    expect(screen.getByText("Claude Sonnet 4.5 Proxy")).toBeInTheDocument();
    expect(screen.getByText(/proxy origin/i)).toBeInTheDocument();
    expect(screen.getByText("Resolved target → Claude Sonnet 4.5 (20250929)")).toBeInTheDocument();
  });

  it("renders a proxy-origin sign for unroutable proxy rows from current model metadata", () => {
    renderModelCell(
      buildRow({
        id: 43,
        resolved_target_model_id: null,
        status_code: 503,
        response_time_ms: 45,
        vendor_id: null,
        vendor_key: null,
        vendor_name: null,
      }),
      createResolveModelLabel(
        { "claude-sonnet-4-5": "Gateway proxy" },
        { "claude-sonnet-4-5": "proxy" },
      ),
    );

    expect(screen.getByText("Gateway proxy")).toBeInTheDocument();
    expect(screen.getByText(/proxy origin/i)).toBeInTheDocument();
    expect(screen.queryByText(/Resolved target/i)).not.toBeInTheDocument();
  });

  it("keeps the vendor column next to api family and renders an em dash when vendor metadata is missing", () => {
    const columns = getColumns("all");
    const apiFamilyIndex = columns.findIndex((column) => column.key === "api_family");
    const vendorIndex = columns.findIndex((column) => column.key === "vendor_name");
    const vendorColumn = columns[vendorIndex];

    expect(apiFamilyIndex).toBeGreaterThan(-1);
    expect(vendorIndex).toBe(apiFamilyIndex + 1);
    expect(vendorColumn.headerTestId).toBe("request-log-vendor-column");

    render(
      React.createElement(
        LocaleProvider,
        null,
        React.createElement(RequestLogsTable, {
          items: [buildRow({ vendor_name: null, vendor_key: null, vendor_id: null })],
          total: 1,
          loading: false,
          view: "all",
          limit: 100,
          offset: 0,
          activeRequestId: null,
          onSelectRequest: () => undefined,
          onSetLimit: () => undefined,
          onNextPage: () => undefined,
          onPreviousPage: () => undefined,
          formatTimestamp: () => "formatted:2026-03-16T00:00:00.000Z",
          resolveModelLabel: createResolveModelLabel({ "claude-sonnet-4-5": "Claude Sonnet 4.5 Proxy" }),
        })
      )
    );

    expect(screen.getByTestId("request-log-vendor-column")).toBeInTheDocument();
    expect(screen.getByTestId("request-log-page-size-select")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });
});
