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
      name: "round-robin-primary",
      strategy_type: "round-robin" as const,
      auto_recovery: {
        mode: "enabled" as const,
        status_codes: [403, 422, 429, 500, 502, 503, 504, 529],
        cooldown: {
          base_seconds: 45,
          failure_threshold: 4,
          backoff_multiplier: 3.5,
          max_cooldown_seconds: 720,
          jitter_ratio: 0.35,
        },
        ban: {
          mode: "off" as const,
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

  it("shows legacy strategy wording for native strategies", () => {
    render(
      <LocaleProvider>
        <OverviewCards
          model={buildModel()}
          spending={null}
          spendingLoading={false}
          spendingCurrencySymbol="$"
          spendingCurrencyCode="USD"
        />
      </LocaleProvider>,
    );

    expect(screen.getByText("round-robin-primary")).toBeInTheDocument();
    expect(screen.getAllByText("Round robin").length).toBeGreaterThan(0);
    expect(screen.queryByText("Adaptive routing")).not.toBeInTheDocument();
    expect(screen.queryByText("Maximize availability")).not.toBeInTheDocument();
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
          onViewRequestLogs={vi.fn()}
        />
      </LocaleProvider>,
    );

    expect(screen.getByText("配置")).toBeInTheDocument();
    expect(screen.getByText("成本概览")).toBeInTheDocument();
    expect(screen.queryByText("模型 KPI（24 小时）")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "查看请求日志" })).toBeInTheDocument();
    expect(screen.getAllByText("轮询").length).toBeGreaterThan(0);
    expect(screen.queryByText("自适应路由")).not.toBeInTheDocument();
  });

  it("keeps the request-log action after retiring the archived 24-hour KPI card", () => {
    const handleViewRequestLogs = vi.fn();

    const { container } = render(
      <LocaleProvider>
        <OverviewCards
          model={buildModel()}
          spending={null}
          spendingLoading={false}
          spendingCurrencySymbol="$"
          spendingCurrencyCode="USD"
          onViewRequestLogs={handleViewRequestLogs}
        />
      </LocaleProvider>,
    );

    const metricCards = container.querySelectorAll('[data-slot="metric-card"]');
    expect(metricCards).toHaveLength(0);
    expect(screen.queryByText("Model KPIs (24h)")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "View Request Logs" }));

    expect(handleViewRequestLogs).toHaveBeenCalledOnce();
  });
});
