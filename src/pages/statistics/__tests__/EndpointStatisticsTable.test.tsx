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

  it("renders endpoint statistics as a flat sortable table without nested model details", () => {
    render(
      <LocaleProvider>
        <EndpointStatisticsTable
          currency={{ code: "USD", symbol: "$" }}
          items={[
            createEndpointStatistic(),
            createEndpointStatistic({
              endpoint_id: 11,
              endpoint_label: "Secondary Endpoint",
              request_count: 1,
              success_rate: 100,
              total_cost_micros: 1200,
              total_tokens: 80,
            }),
          ]}
        />
      </LocaleProvider>,
    );

    const table = screen.getByTestId("statistics-endpoint-table");
    expect(screen.getByText("Top Endpoints by Requests")).toBeInTheDocument();
    expect(screen.queryByTestId("statistics-endpoint-collapsible")).not.toBeInTheDocument();
    expect(screen.queryByText("Claude Sonnet 4.6")).not.toBeInTheDocument();

    const rows = within(table)
      .getAllByRole("row")
      .slice(1)
      .map((row) => row.textContent ?? "");
    expect(rows[0]).toContain("Primary Endpoint");
    expect(rows[1]).toContain("Secondary Endpoint");

    fireEvent.click(within(table).getByRole("button", { name: "Total Spend" }));

    const ascendingRows = within(table)
      .getAllByRole("row")
      .slice(1)
      .map((row) => row.textContent ?? "");
    expect(ascendingRows[0]).toContain("Secondary Endpoint");

    fireEvent.click(within(table).getByRole("button", { name: "Total Spend" }));

    const descendingRows = within(table)
      .getAllByRole("row")
      .slice(1)
      .map((row) => row.textContent ?? "");
    expect(descendingRows[0]).toContain("Primary Endpoint");
  });
});
