import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import type { UsageModelStatistic } from "@/lib/types";
import { ModelStatisticsTable } from "../tables/ModelStatisticsTable";
import { installLocalStorageMock } from "./storage";

function createModelStatistic(
  overrides: Partial<UsageModelStatistic> = {},
): UsageModelStatistic {
  return {
    api_family: "openai",
    failed_count: 0,
    model_id: "gpt-5.4",
    model_label: "GPT-5.4",
    request_count: 7,
    success_count: 7,
    success_rate: 100,
    total_cost_micros: 4200,
    total_tokens: 410,
    ...overrides,
  };
}

describe("ModelStatisticsTable", () => {
  beforeEach(() => {
    installLocalStorageMock();
    localStorage.clear();
  });

  it("renders tight model statistic cards and only shows spend when pricing exists", () => {
    render(
      <LocaleProvider>
        <ModelStatisticsTable
          currency={{ code: "USD", symbol: "$" }}
          items={[
            createModelStatistic(),
            createModelStatistic({
              api_family: "anthropic",
              failed_count: 2,
              model_id: "claude-sonnet-4-6",
              model_label: "Claude Sonnet 4.6",
              request_count: 3,
              success_count: 1,
              success_rate: 33.3,
              total_cost_micros: 0,
              total_tokens: 90,
            }),
          ]}
        />
      </LocaleProvider>,
    );

    const cards = screen.getAllByTestId("model-stat-card");
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent("GPT-5.4");
    expect(cards[1]).toHaveTextContent("Claude Sonnet 4.6");
    expect(within(cards[0]).getByText("OpenAI")).toBeInTheDocument();
    expect(within(cards[0]).getByTestId("model-stat-cost")).toBeInTheDocument();
    expect(within(cards[1]).queryByTestId("model-stat-cost")).not.toBeInTheDocument();
  });
});
