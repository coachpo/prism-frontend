import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import type { UsageEndpointStatistic } from "@/lib/types";
import { EndpointStatisticsTable } from "../tables/EndpointStatisticsTable";
import { installLocalStorageMock } from "./storage";

function createEndpointStatistic(
  overrides: Partial<UsageEndpointStatistic> = {},
): UsageEndpointStatistic {
  return {
    endpoint_id: 10,
    endpoint_label: "Primary Endpoint",
    models: [
      {
        model_id: "gpt-5.4",
        model_label: "GPT-5.4",
        request_count: 5,
        success_rate: 100,
        total_cost_micros: 4200,
        total_tokens: 320,
      },
      {
        model_id: "claude-sonnet-4-6",
        model_label: "Claude Sonnet 4.6",
        request_count: 2,
        success_rate: 50,
        total_cost_micros: 0,
        total_tokens: 90,
      },
    ],
    request_count: 7,
    success_rate: 85.7,
    total_cost_micros: 4200,
    total_tokens: 410,
    ...overrides,
  };
}

describe("EndpointStatisticsTable", () => {
  beforeEach(() => {
    installLocalStorageMock();
    localStorage.clear();
  });

  it("renders endpoint statistics as collapsibles with a sortable nested model table", () => {
    render(
      <LocaleProvider>
        <EndpointStatisticsTable
          currency={{ code: "USD", symbol: "$" }}
          items={[
            createEndpointStatistic(),
            createEndpointStatistic({
              endpoint_id: 11,
              endpoint_label: "Secondary Endpoint",
              models: [
                {
                  model_id: "gpt-4.1-mini",
                  model_label: "GPT-4.1 mini",
                  request_count: 1,
                  success_rate: 100,
                  total_cost_micros: 1200,
                  total_tokens: 80,
                },
              ],
              request_count: 1,
              success_rate: 100,
              total_cost_micros: 1200,
              total_tokens: 80,
            }),
          ]}
        />
      </LocaleProvider>,
    );

    expect(screen.getByTestId("statistics-endpoint-table")).toBeInTheDocument();
    expect(screen.getByText("Top Endpoints by Requests")).toBeInTheDocument();

    const triggers = screen.getAllByTestId("statistics-endpoint-collapsible");
    expect(triggers).toHaveLength(2);
    expect(triggers[0]).toHaveTextContent("Primary Endpoint");
    expect(triggers[1]).toHaveTextContent("Secondary Endpoint");
    expect(screen.queryByText("Claude Sonnet 4.6")).not.toBeInTheDocument();

    fireEvent.click(triggers[0]);

    const detail = screen.getByTestId("statistics-endpoint-details-10");
    const nestedTable = within(detail).getByTestId("statistics-endpoint-models-table-10");
    expect(within(nestedTable).getByText("GPT-5.4")).toBeInTheDocument();
    expect(within(nestedTable).getByText("Claude Sonnet 4.6")).toBeInTheDocument();

    fireEvent.click(within(nestedTable).getByRole("button", { name: "Total Spend" }));

    const rows = within(nestedTable)
      .getAllByRole("row")
      .slice(1)
      .map((row) => row.textContent ?? "");
    expect(rows[0]).toContain("Claude Sonnet 4.6");

    fireEvent.click(within(nestedTable).getByRole("button", { name: "Total Spend" }));

    const resortedRows = within(nestedTable)
      .getAllByRole("row")
      .slice(1)
      .map((row) => row.textContent ?? "");
    expect(resortedRows[0]).toContain("GPT-5.4");
  });
});
