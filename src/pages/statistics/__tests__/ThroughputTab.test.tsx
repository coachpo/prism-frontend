import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThroughputTab } from "../ThroughputTab";

vi.mock("@/hooks/useTimezone", () => ({
  useTimezone: () => ({
    format: (value: string) => value,
  }),
}));

vi.mock("recharts", () => ({
  Area: () => null,
  AreaChart: ({ children }: { children?: ReactNode }) => <svg>{children}</svg>,
  CartesianGrid: () => null,
  ResponsiveContainer: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

describe("ThroughputTab", () => {
  it("renders the RPM labels and explanation", () => {
    render(
      <ThroughputTab
        data={{
          average_rpm: 0.5,
          peak_rpm: 2,
          current_rpm: 1,
          total_requests: 30,
          time_window_seconds: 3600,
          buckets: [
            {
              timestamp: "2026-03-16T10:00:00+00:00",
              request_count: 2,
              rpm: 2,
            },
          ],
        }}
        isLoading={false}
        manualRefresh={() => undefined}
      />
    );

    expect(screen.getByText("Average RPM")).toBeInTheDocument();
    expect(screen.getByText("Peak RPM")).toBeInTheDocument();
    expect(screen.getByText("Current RPM")).toBeInTheDocument();
    expect(screen.getByText("Requests Per Minute (RPM) Over Time")).toBeInTheDocument();
    expect(screen.getByText(/Average RPM normalizes the selected window/i)).toBeInTheDocument();
    expect(screen.queryByText("Average TPS")).not.toBeInTheDocument();
    expect(screen.queryByText(/Transactions Per Second \(TPS\) Over Time/)).not.toBeInTheDocument();
  });

  it("preserves the selected window when the response has no requests", () => {
    render(
      <ThroughputTab
        data={{
          average_rpm: 0,
          peak_rpm: 0,
          current_rpm: 0,
          total_requests: 0,
          time_window_seconds: 3600,
          buckets: [],
        }}
        isLoading={false}
        manualRefresh={() => undefined}
      />
    );

    expect(screen.getByText("1.0h")).toBeInTheDocument();
    expect(screen.getByText("3,600s total")).toBeInTheDocument();
    expect(screen.getByText("No data points available")).toBeInTheDocument();
  });
});
