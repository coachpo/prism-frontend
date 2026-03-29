import { render, screen } from "@testing-library/react";
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

describe("OverviewCards", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows priority spillover wording and recovery state for fill-first strategies", () => {
    render(
      <LocaleProvider>
        <OverviewCards
          model={{
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
            api_family: "openai",
            model_id: "gpt-4o-mini",
            display_name: "GPT-4o Mini",
            model_type: "native",
            proxy_targets: [],
            loadbalance_strategy_id: 101,
            loadbalance_strategy: {
              id: 101,
              name: "priority-pack",
              strategy_type: "fill-first",
              auto_recovery: {
                mode: "enabled",
                status_codes: [403, 422, 429, 500, 502, 503, 504, 529],
                cooldown: {
                  base_seconds: 45,
                  failure_threshold: 4,
                  backoff_multiplier: 3.5,
                  max_cooldown_seconds: 720,
                  jitter_ratio: 0.35,
                },
                ban: {
                  mode: "off",
                },
              },
            },
            is_enabled: true,
            connections: [],
            created_at: "2026-03-20T10:00:00Z",
            updated_at: "2026-03-20T10:00:00Z",
          }}
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

    expect(screen.getByText("priority-pack")).toBeInTheDocument();
    expect(screen.getByText("Priority spillover")).toBeInTheDocument();
    expect(screen.getByText("Enabled")).toBeInTheDocument();
    expect(screen.getByText("Vendor")).toBeInTheDocument();
    expect(screen.getByText("Together AI")).toBeInTheDocument();
    expect(screen.getByText("API Family")).toBeInTheDocument();
    expect(screen.getByText("OpenAI")).toBeInTheDocument();
    expect(screen.queryByText("Not applicable for single strategies")).not.toBeInTheDocument();
  });

  it("renders overview copy from the Chinese locale catalog", () => {
    localStorage.setItem("prism.locale", "zh-CN");

    render(
      <LocaleProvider>
        <OverviewCards
          model={{
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
            api_family: "openai",
            model_id: "gpt-4o-mini",
            display_name: "GPT-4o Mini",
            model_type: "native",
            proxy_targets: [],
            loadbalance_strategy_id: 101,
            loadbalance_strategy: {
              id: 101,
              name: "priority-pack",
              strategy_type: "fill-first",
              auto_recovery: {
                mode: "enabled",
                status_codes: [403, 422, 429, 500, 502, 503, 504, 529],
                cooldown: {
                  base_seconds: 45,
                  failure_threshold: 4,
                  backoff_multiplier: 3.5,
                  max_cooldown_seconds: 720,
                  jitter_ratio: 0.35,
                },
                ban: {
                  mode: "off",
                },
              },
            },
            is_enabled: true,
            connections: [],
            created_at: "2026-03-20T10:00:00Z",
            updated_at: "2026-03-20T10:00:00Z",
          }}
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
  });

  it("shows disabled recovery from the nested auto_recovery branch", () => {
    render(
      <LocaleProvider>
        <OverviewCards
          model={{
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
            api_family: "openai",
            model_id: "gpt-4o-mini",
            display_name: "GPT-4o Mini",
            model_type: "native",
            proxy_targets: [],
            loadbalance_strategy_id: 101,
            loadbalance_strategy: {
              id: 101,
              name: "priority-pack",
              strategy_type: "fill-first",
              auto_recovery: {
                mode: "disabled",
              },
            },
            is_enabled: true,
            connections: [],
            created_at: "2026-03-20T10:00:00Z",
            updated_at: "2026-03-20T10:00:00Z",
          }}
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

    expect(screen.getByText("Disabled")).toBeInTheDocument();
  });
});
