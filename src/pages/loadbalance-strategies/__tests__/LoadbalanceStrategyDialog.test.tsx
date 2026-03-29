import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LoadbalanceStrategyDialog } from "../LoadbalanceStrategyDialog";
import {
  DEFAULT_LOADBALANCE_STRATEGY_FORM,
  type LoadbalanceStrategyFormState,
} from "../loadbalanceStrategyFormState";

function buildEnabledForm(
  overrides: Partial<LoadbalanceStrategyFormState> = {},
): LoadbalanceStrategyFormState {
  return {
    ...DEFAULT_LOADBALANCE_STRATEGY_FORM,
    name: "failover-primary",
    strategy_type: "failover",
    auto_recovery: {
      mode: "enabled",
      status_codes: [429, 503],
      status_code_input: "",
      cooldown: {
        base_seconds: 60,
        failure_threshold: 2,
        backoff_multiplier: 2,
        max_cooldown_seconds: 900,
        jitter_ratio: 0.2,
      },
      ban: {
        mode: "temporary",
        max_cooldown_strikes_before_ban: 3,
        ban_duration_seconds: 1200,
      },
    },
    ...overrides,
  };
}

function buildDisabledForm(
  overrides: Partial<LoadbalanceStrategyFormState> = {},
): LoadbalanceStrategyFormState {
  return {
    ...DEFAULT_LOADBALANCE_STRATEGY_FORM,
    name: "fill-first-primary",
    strategy_type: "fill-first",
    auto_recovery: { mode: "disabled" },
    ...overrides,
  };
}

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
            loadbalanceStrategyForm={buildEnabledForm()}
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
        label: "Explain Failover Status Codes",
        text: "HTTP status codes that should trigger failover for non-single strategies.",
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
              ...DEFAULT_LOADBALANCE_STRATEGY_FORM,
              name: "single-primary",
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
            loadbalanceStrategyForm={buildEnabledForm()}
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
            loadbalanceStrategyForm={buildEnabledForm()}
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
            loadbalanceStrategyForm={buildEnabledForm({
              auto_recovery: {
                mode: "enabled",
                status_codes: [429, 503],
                status_code_input: "",
                cooldown: {
                  base_seconds: 60,
                  failure_threshold: 2,
                  backoff_multiplier: 2,
                  max_cooldown_seconds: 900,
                  jitter_ratio: 0.2,
                },
                ban: {
                  mode: "manual",
                  max_cooldown_strikes_before_ban: 3,
                },
              },
            })}
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

  it("keeps the auto-recovery switch visible for non-single strategies even when the branch is disabled", () => {
    const setLoadbalanceStrategyForm = vi.fn();

    render(
      <LocaleProvider>
        <TooltipProvider>
          <LoadbalanceStrategyDialog
            editingLoadbalanceStrategy={null}
            loadbalanceStrategyForm={buildDisabledForm()}
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

    expect(screen.getByText("Auto-Recovery")).toBeInTheDocument();
    expect(screen.queryByLabelText("Failover Status Codes")).not.toBeInTheDocument();
    expect(screen.queryByText("Ban Escalation")).not.toBeInTheDocument();
  });

  it("removes the enabled auto_recovery branch when the switch is turned off", () => {
    const setLoadbalanceStrategyForm = vi.fn();
    const currentForm = buildEnabledForm({ strategy_type: "fill-first" });

    render(
      <LocaleProvider>
        <TooltipProvider>
          <LoadbalanceStrategyDialog
            editingLoadbalanceStrategy={null}
            loadbalanceStrategyForm={currentForm}
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

    fireEvent.click(screen.getByRole("switch"));
    const disableRecovery = setLoadbalanceStrategyForm.mock.calls.at(-1)?.[0] as
      | ((state: typeof currentForm) => typeof currentForm)
      | undefined;

    expect(disableRecovery?.(currentForm)).toMatchObject({
      auto_recovery: { mode: "disabled" },
    });
  });

  it("shows failover status code editing controls only when auto-recovery is enabled", () => {
    const setLoadbalanceStrategyForm = vi.fn();

    render(
      <LocaleProvider>
        <TooltipProvider>
          <LoadbalanceStrategyDialog
            editingLoadbalanceStrategy={null}
            loadbalanceStrategyForm={buildEnabledForm({ strategy_type: "fill-first" })}
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

    expect(screen.getByLabelText("Failover Status Codes")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Status Code" })).toBeInTheDocument();
    expect(screen.getByText("429")).toBeInTheDocument();
    expect(screen.getByText("503")).toBeInTheDocument();
  });

  it("shows fill-first in the strategy selector and treats it like another non-single strategy", () => {
    vi.stubGlobal(
      "ResizeObserver",
      class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = vi.fn();

    const setLoadbalanceStrategyForm = vi.fn();
    const currentForm = buildEnabledForm({
      name: "fill-first-primary",
      strategy_type: "fill-first",
      auto_recovery: {
        mode: "enabled",
        status_codes: [429, 503],
        status_code_input: "",
        cooldown: {
          base_seconds: 60,
          failure_threshold: 2,
          backoff_multiplier: 2,
          max_cooldown_seconds: 900,
          jitter_ratio: 0.2,
        },
        ban: { mode: "off" },
      },
    });

    render(
      <LocaleProvider>
        <TooltipProvider>
          <LoadbalanceStrategyDialog
            editingLoadbalanceStrategy={null}
            loadbalanceStrategyForm={currentForm}
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

    const strategyTypeSelect = screen.getAllByRole("combobox")[0];
    expect(strategyTypeSelect).toHaveTextContent("Fill-first");
    fireEvent.click(strategyTypeSelect);
    expect(screen.getAllByText("Fill-first").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByText("Failover"));
    const switchToFailover = setLoadbalanceStrategyForm.mock.calls.at(-1)?.[0] as
      | ((state: typeof currentForm) => typeof currentForm)
      | undefined;
    expect(switchToFailover?.(currentForm)).toMatchObject({
      strategy_type: "failover",
      auto_recovery: { mode: "enabled" },
    });

    fireEvent.click(strategyTypeSelect);
    fireEvent.click(screen.getByText("Single"));
    const switchToSingle = setLoadbalanceStrategyForm.mock.calls
      .map((call) => call[0])
      .find(
        (updater): updater is (state: typeof currentForm) => typeof currentForm =>
          typeof updater === "function" &&
          updater(currentForm).strategy_type === "single" &&
          updater(currentForm).auto_recovery.mode === "disabled",
      );
    expect(switchToSingle?.(currentForm)).toMatchObject({
      strategy_type: "single",
      auto_recovery: { mode: "disabled" },
    });

    vi.unstubAllGlobals();
    HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
  });

  it("shows round-robin in the strategy selector and treats it like another non-single strategy", () => {
    vi.stubGlobal(
      "ResizeObserver",
      class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = vi.fn();

    const setLoadbalanceStrategyForm = vi.fn();
    const currentForm = {
      ...DEFAULT_LOADBALANCE_STRATEGY_FORM,
      name: "single-primary",
    };

    render(
      <LocaleProvider>
        <TooltipProvider>
          <LoadbalanceStrategyDialog
            editingLoadbalanceStrategy={null}
            loadbalanceStrategyForm={currentForm}
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

    const strategyTypeSelect = screen.getAllByRole("combobox")[0];
    fireEvent.click(strategyTypeSelect);
    expect(screen.getAllByText("Round-robin").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByText("Round-robin"));
    const switchToRoundRobin = setLoadbalanceStrategyForm.mock.calls.at(-1)?.[0] as
      | ((state: typeof currentForm) => typeof currentForm)
      | undefined;
    expect(switchToRoundRobin?.(currentForm)).toMatchObject({
      strategy_type: "round-robin",
      auto_recovery: { mode: "disabled" },
    });

    vi.unstubAllGlobals();
    HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
  });
});
