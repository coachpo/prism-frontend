import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LoadbalanceStrategyDialog } from "../LoadbalanceStrategyDialog";

describe("LoadbalanceStrategyDialog", () => {
  beforeEach(() => {
    localStorage.clear();
  });

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
              failover_ban_mode: "temporary",
              failover_max_cooldown_strikes_before_ban: 3,
              failover_ban_duration_seconds: 1200,
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
      {
        label: "Explain Ban Mode",
        text: "Choose whether repeated max-cooldown strikes stay off, expire automatically, or wait for a manual dismiss.",
      },
      {
        label: "Explain Max-cooldown Strikes Before Ban",
        text: "Number of max-cooldown strike events required before this connection is marked as banned.",
      },
      {
        label: "Explain Ban Duration (seconds)",
        text: "How long a temporary ban lasts before the connection becomes probe-eligible again.",
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
              failover_ban_mode: "off",
              failover_max_cooldown_strikes_before_ban: 0,
              failover_ban_duration_seconds: 0,
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
              failover_ban_mode: "temporary",
              failover_max_cooldown_strikes_before_ban: 3,
              failover_ban_duration_seconds: 1200,
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
    expect(screen.getByText("封禁升级")).toBeInTheDocument();
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

  it("shows the ban duration field only for temporary ban mode", () => {
    const setLoadbalanceStrategyForm = vi.fn();

    const { rerender } = render(
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
              failover_ban_mode: "temporary",
              failover_max_cooldown_strikes_before_ban: 3,
              failover_ban_duration_seconds: 1200,
            }}
            loadbalanceStrategySaving={false}
            onClose={vi.fn()}
            onOpenChange={vi.fn()}
            onSave={vi.fn().mockResolvedValue(undefined)}
            open
            setLoadbalanceStrategyForm={setLoadbalanceStrategyForm}
          />
        </TooltipProvider>
      </LocaleProvider>,
    );

    expect(screen.getByLabelText("Ban Duration (seconds)")).toBeInTheDocument();

    rerender(
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
              failover_ban_mode: "manual",
              failover_max_cooldown_strikes_before_ban: 3,
              failover_ban_duration_seconds: 0,
            }}
            loadbalanceStrategySaving={false}
            onClose={vi.fn()}
            onOpenChange={vi.fn()}
            onSave={vi.fn().mockResolvedValue(undefined)}
            open
            setLoadbalanceStrategyForm={setLoadbalanceStrategyForm}
          />
        </TooltipProvider>
      </LocaleProvider>,
    );

    expect(screen.queryByLabelText("Ban Duration (seconds)")).not.toBeInTheDocument();
  });
});
