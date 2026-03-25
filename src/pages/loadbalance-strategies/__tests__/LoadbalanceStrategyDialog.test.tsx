import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LoadbalanceStrategyDialog } from "../LoadbalanceStrategyDialog";

describe("LoadbalanceStrategyDialog", () => {
  it("shows tooltip help for every failover policy field", async () => {
    vi.stubGlobal(
      "ResizeObserver",
      class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );

    render(
      <LocaleProvider>
        <TooltipProvider>
          <LoadbalanceStrategyDialog
            editingLoadbalanceStrategy={null}
            loadbalanceStrategyForm={{
              name: "failover-primary",
              strategy_type: "failover",
              failover_recovery_enabled: true,
              failover_cooldown_seconds: 60,
              failover_failure_threshold: 2,
              failover_backoff_multiplier: 2,
              failover_max_cooldown_seconds: 900,
              failover_jitter_ratio: 0.2,
              failover_auth_error_cooldown_seconds: 1800,
            }}
            loadbalanceStrategySaving={false}
            onClose={vi.fn()}
            onOpenChange={vi.fn()}
            onSave={vi.fn().mockResolvedValue(undefined)}
            open
            setLoadbalanceStrategyForm={vi.fn()}
          />
        </TooltipProvider>
      </LocaleProvider>,
    );

    const helpButtons = [
      {
        label: "Explain Base Cooldown (seconds)",
        text: "Starting cooldown applied after transient failures once the threshold is reached.",
      },
      {
        label: "Explain Failure Threshold",
        text: "Number of consecutive failures required before the cooldown window opens.",
      },
      {
        label: "Explain Backoff Multiplier",
        text: "Multiplier applied to the cooldown after each failure beyond the threshold.",
      },
      {
        label: "Explain Max Cooldown (seconds)",
        text: "Upper limit for the computed cooldown, even after repeated failures.",
      },
      {
        label: "Explain Jitter Ratio",
        text: "Random spread applied to the cooldown so retries do not all happen at the same instant.",
      },
      {
        label: "Explain Auth Error Cooldown",
        text: "Cooldown used for auth-like failures such as invalid keys or permission errors.",
      },
    ];

    for (const { label, text } of helpButtons) {
      const trigger = screen.getByRole("button", { name: label });
      fireEvent.focus(trigger);
      expect(await screen.findByRole("tooltip", { name: text })).toBeInTheDocument();
      fireEvent.blur(trigger);
    }

    vi.unstubAllGlobals();
  });

  it("renders localized dialog copy when the saved locale is Chinese", () => {
    localStorage.setItem("prism.locale", "zh-CN");

    render(
      <LocaleProvider>
        <TooltipProvider>
          <LoadbalanceStrategyDialog
            editingLoadbalanceStrategy={null}
            loadbalanceStrategyForm={{
              name: "single-primary",
              strategy_type: "single",
              failover_recovery_enabled: false,
              failover_cooldown_seconds: 60,
              failover_failure_threshold: 2,
              failover_backoff_multiplier: 2,
              failover_max_cooldown_seconds: 900,
              failover_jitter_ratio: 0.2,
              failover_auth_error_cooldown_seconds: 1800,
            }}
            loadbalanceStrategySaving={false}
            onClose={vi.fn()}
            onOpenChange={vi.fn()}
            onSave={vi.fn().mockResolvedValue(undefined)}
            open
            setLoadbalanceStrategyForm={vi.fn()}
          />
        </TooltipProvider>
      </LocaleProvider>,
    );

    expect(screen.getByText("新增负载均衡策略")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存策略" })).toBeInTheDocument();
  });

  it("renders localized Chinese field labels, descriptions, and tooltip accessibility copy", async () => {
    localStorage.setItem("prism.locale", "zh-CN");
    vi.stubGlobal(
      "ResizeObserver",
      class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );

    render(
      <LocaleProvider>
        <TooltipProvider>
          <LoadbalanceStrategyDialog
            editingLoadbalanceStrategy={null}
            loadbalanceStrategyForm={{
              name: "failover-primary",
              strategy_type: "failover",
              failover_recovery_enabled: true,
              failover_cooldown_seconds: 60,
              failover_failure_threshold: 2,
              failover_backoff_multiplier: 2,
              failover_max_cooldown_seconds: 900,
              failover_jitter_ratio: 0.2,
              failover_auth_error_cooldown_seconds: 1800,
            }}
            loadbalanceStrategySaving={false}
            onClose={vi.fn()}
            onOpenChange={vi.fn()}
            onSave={vi.fn().mockResolvedValue(undefined)}
            open
            setLoadbalanceStrategyForm={vi.fn()}
          />
        </TooltipProvider>
      </LocaleProvider>,
    );

    expect(screen.getByLabelText("名称")).toBeInTheDocument();
    expect(screen.getByText("策略类型")).toBeInTheDocument();
    expect(screen.getByText("自动恢复")).toBeInTheDocument();
    expect(
      screen.getByText("允许此策略中的失败端点在后端管理的冷却窗口后自动恢复。"),
    ).toBeInTheDocument();

    const trigger = screen.getByRole("button", { name: "查看基础冷却时间（秒）说明" });
    fireEvent.focus(trigger);
    expect(
      await screen.findByRole("tooltip", {
        name: "达到阈值后，在瞬时失败后应用的起始冷却时间。",
      }),
    ).toBeInTheDocument();

    vi.unstubAllGlobals();
  });
});
