import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DashboardHighlightsGrid } from "../DashboardHighlightsGrid";

describe("DashboardHighlightsGrid", () => {
  it("uses shared provider labels for the provider mix card", () => {
    render(
      <DashboardHighlightsGrid
        highlighted={false}
        onInspectSpending={vi.fn()}
        onOpenStatistics={vi.fn()}
        onReviewRequests={vi.fn()}
        providerRows={[
          {
            key: "openai",
            total_requests: 2161,
            success_count: 2160,
            error_count: 1,
            avg_response_time_ms: 320,
            total_tokens: 1000,
          },
        ]}
        snapshot={{
          activeModels: 2,
          averageRpm: 0,
          averageRpmRequestTotal: 0,
          avgLatency: 320,
          errorRate: 5,
          p95Latency: 880,
          streamShare: 0,
          successRate: 95,
          totalCost: 123456,
          totalModels: 3,
          totalRequests: 2161,
        }}
      />
    );

    expect(screen.getByText("OpenAI")).toBeInTheDocument();
    expect(screen.queryByText("Openai")).not.toBeInTheDocument();
  });
});
