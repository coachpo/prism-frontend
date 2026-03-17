import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DashboardHighlightsGrid } from "../DashboardHighlightsGrid";

describe("DashboardHighlightsGrid", () => {
  it("uses shared provider labels and icons for the provider mix card", () => {
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
          {
            key: "anthropic",
            total_requests: 126,
            success_count: 126,
            error_count: 0,
            avg_response_time_ms: 410,
            total_tokens: 800,
          },
          {
            key: "gemini",
            total_requests: 8,
            success_count: 8,
            error_count: 0,
            avg_response_time_ms: 290,
            total_tokens: 200,
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

    const openAiLabel = screen.getByText("OpenAI");
    const anthropicLabel = screen.getByText("Anthropic");
    const geminiLabel = screen.getByText("Gemini");

    expect(openAiLabel).toBeInTheDocument();
    expect(anthropicLabel).toBeInTheDocument();
    expect(geminiLabel).toBeInTheDocument();
    expect(screen.queryByText("Openai")).not.toBeInTheDocument();
    expect(openAiLabel.previousElementSibling?.tagName).toBe("svg");
    expect(anthropicLabel.previousElementSibling?.tagName).toBe("svg");
    expect(geminiLabel.previousElementSibling?.tagName).toBe("svg");
  });
});
