import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThroughputTab } from "../ThroughputTab";

interface AxisProps {
  axisLine?: { stroke?: string };
  label?: { style?: { fill?: string } };
  tick?: { fill?: string };
  tickLine?: { stroke?: string };
}

interface TooltipProps {
  labelStyle?: { color?: string };
}

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
  Tooltip: ({ labelStyle }: TooltipProps) => <div data-label-color={labelStyle?.color} data-testid="chart-tooltip" />,
  XAxis: ({ tick, axisLine, tickLine }: AxisProps) => (
    <div
      data-axis-stroke={axisLine?.stroke}
      data-testid="chart-x-axis"
      data-tick-fill={tick?.fill}
      data-tick-stroke={tickLine?.stroke}
    />
  ),
  YAxis: ({ tick, axisLine, tickLine, label }: AxisProps) => (
    <div
      data-axis-stroke={axisLine?.stroke}
      data-label-fill={label?.style?.fill}
      data-testid="chart-y-axis"
      data-tick-fill={tick?.fill}
      data-tick-stroke={tickLine?.stroke}
    />
  ),
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

  it("uses theme variables for chart axes in dark mode", () => {
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

    expect(screen.getByTestId("chart-x-axis")).toHaveAttribute("data-tick-fill", "var(--muted-foreground)");
    expect(screen.getByTestId("chart-x-axis")).toHaveAttribute("data-axis-stroke", "var(--border)");
    expect(screen.getByTestId("chart-x-axis")).toHaveAttribute("data-tick-stroke", "var(--border)");
    expect(screen.getByTestId("chart-y-axis")).toHaveAttribute("data-tick-fill", "var(--muted-foreground)");
    expect(screen.getByTestId("chart-y-axis")).toHaveAttribute("data-axis-stroke", "var(--border)");
    expect(screen.getByTestId("chart-y-axis")).toHaveAttribute("data-tick-stroke", "var(--border)");
    expect(screen.getByTestId("chart-y-axis")).toHaveAttribute("data-label-fill", "var(--muted-foreground)");
    expect(screen.getByTestId("chart-tooltip")).toHaveAttribute("data-label-color", "var(--popover-foreground)");
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

  it("renders the refresh control as a square icon button", () => {
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

    expect(screen.getByRole("button", { name: "Refresh throughput statistics" })).toHaveAttribute("data-size", "icon-sm");
  });
});
