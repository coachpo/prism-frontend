import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardMetricsGrid } from "../DashboardMetricsGrid";

describe("DashboardMetricsGrid", () => {
  it("shows Average RPM instead of the old system health card", () => {
    render(
      <DashboardMetricsGrid
        highlighted={false}
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
          totalRequests: 0,
        }}
      />
    );

    expect(screen.getByText("Average RPM")).toBeInTheDocument();
    expect(screen.getByText("0.000")).toBeInTheDocument();
    expect(screen.getByText("0 total requests")).toBeInTheDocument();
    expect(screen.queryByText("System Health")).not.toBeInTheDocument();
    expect(screen.queryByText("Critical")).not.toBeInTheDocument();
  });

  it("uses the throughput total for the RPM card detail", () => {
    render(
      <DashboardMetricsGrid
        highlighted={false}
        snapshot={{
          activeModels: 2,
          averageRpm: 1.25,
          averageRpmRequestTotal: 12,
          avgLatency: 320,
          errorRate: 5,
          p95Latency: 880,
          streamShare: 0,
          successRate: 95,
          totalCost: 123456,
          totalModels: 3,
          totalRequests: 24,
        }}
      />
    );

    expect(screen.getByText("12 total requests")).toBeInTheDocument();
    expect(screen.getByText("24")).toBeInTheDocument();
  });
});
