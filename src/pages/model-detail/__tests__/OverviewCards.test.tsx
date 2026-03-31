import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach } from "vitest";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { OverviewCards } from "../OverviewCards";

vi.mock("@/hooks/useTimezone", () => ({
  useTimezone: () => ({
    format: () => "2026-03-25",
    loading: false,
    refresh: vi.fn(),
    timezone: "UTC",
  }),
}));

function buildModel() {
  return {
    id: 1,
    vendor_id: 30,
    vendor: {
      id: 30,
      key: "together-ai",
      name: "Together AI",
      description: null,
      icon_key: null,
      audit_enabled: false,
      audit_capture_bodies: false,
      created_at: "2026-03-20T10:00:00Z",
      updated_at: "2026-03-20T10:00:00Z",
    },
    api_family: "openai" as const,
    model_id: "gpt-4o-mini",
    display_name: "GPT-4o Mini",
    model_type: "native" as const,
    proxy_targets: [],
    loadbalance_strategy_id: 101,
    loadbalance_strategy: {
      id: 101,
      name: "adaptive-availability",
      routing_policy: {
        kind: "adaptive" as const,
        routing_objective: "maximize_availability" as const,
        deadline_budget_ms: 30000,
        hedge: {
          enabled: false,
          delay_ms: 1500,
          max_additional_attempts: 1,
        },
        circuit_breaker: {
          failure_status_codes: [403, 422, 429, 500, 502, 503, 504, 529],
          base_open_seconds: 45,
          failure_threshold: 4,
          backoff_multiplier: 3.5,
          max_open_seconds: 720,
          jitter_ratio: 0.35,
          ban_mode: "off" as const,
          max_open_strikes_before_ban: 0,
          ban_duration_seconds: 0,
        },
        admission: {
          respect_qps_limit: true,
          respect_in_flight_limits: true,
        },
        monitoring: {
          enabled: true,
          stale_after_seconds: 300,
          endpoint_ping_weight: 1,
          conversation_delay_weight: 1,
          failure_penalty_weight: 2,
        },
      },
    },
    is_enabled: true,
    connections: [],
    created_at: "2026-03-20T10:00:00Z",
    updated_at: "2026-03-20T10:00:00Z",
  };
}

describe("OverviewCards", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows adaptive routing wording and the routing objective for native strategies", () => {
    render(
      <LocaleProvider>
        <OverviewCards
          model={buildModel()}
          spending={null}
          spendingLoading={false}
          spendingCurrencySymbol="$"
          spendingCurrencyCode="USD"
          metrics24hLoading={false}
          modelKpis={{
            successRate: null,
            p95LatencyMs: null,
            requestCount24h: 0,
            spend24hMicros: null,
          }}
        />
      </LocaleProvider>,
    );

    expect(screen.getByText("adaptive-availability")).toBeInTheDocument();
    expect(screen.getByText("Adaptive routing")).toBeInTheDocument();
    expect(screen.getByText("Maximize availability")).toBeInTheDocument();
    expect(screen.getByText("Vendor")).toBeInTheDocument();
    expect(screen.getByText("Together AI")).toBeInTheDocument();
    expect(screen.getByText("API Family")).toBeInTheDocument();
    expect(screen.getByText("OpenAI")).toBeInTheDocument();
  });

  it("renders overview copy from the Chinese locale catalog", () => {
    localStorage.setItem("prism.locale", "zh-CN");

    render(
      <LocaleProvider>
        <OverviewCards
          model={buildModel()}
          spending={null}
          spendingLoading={false}
          spendingCurrencySymbol="$"
          spendingCurrencyCode="USD"
          metrics24hLoading={false}
          modelKpis={{
            successRate: null,
            p95LatencyMs: null,
            requestCount24h: 0,
            spend24hMicros: null,
          }}
          onViewRequestLogs={vi.fn()}
        />
      </LocaleProvider>,
    );

    expect(screen.getByText("配置")).toBeInTheDocument();
    expect(screen.getByText("成本概览")).toBeInTheDocument();
    expect(screen.getByText("模型 KPI（24 小时）")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "查看请求日志" })).toBeInTheDocument();
    expect(screen.getByText("自适应路由")).toBeInTheDocument();
  });

  it("renders the archived 24-hour KPI snapshot and request-log action", () => {
    const handleViewRequestLogs = vi.fn();

    const { container } = render(
      <LocaleProvider>
        <OverviewCards
          model={buildModel()}
          spending={null}
          spendingLoading={false}
          spendingCurrencySymbol="$"
          spendingCurrencyCode="USD"
          metrics24hLoading={false}
          modelKpis={{
            successRate: 33.3,
            p95LatencyMs: 1441,
            requestCount24h: 3,
            spend24hMicros: 0,
          }}
          onViewRequestLogs={handleViewRequestLogs}
        />
      </LocaleProvider>,
    );

    const metricCards = container.querySelectorAll('[data-slot="metric-card"]');
    expect(metricCards).toHaveLength(4);

    expect(screen.getByText("33.3%")).toBeInTheDocument();
    expect(screen.getByText("1.44s")).toBeInTheDocument();
    expect(screen.getByText(/^3$/)).toBeInTheDocument();
    expect(screen.getByText(/^\$0(?:\.0+)?(?:\s[A-Z]{3})?$/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "View Request Logs" }));

    expect(handleViewRequestLogs).toHaveBeenCalledOnce();
  });
});
