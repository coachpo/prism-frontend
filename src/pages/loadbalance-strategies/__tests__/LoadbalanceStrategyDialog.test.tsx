import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LoadbalanceStrategyDialog } from "../LoadbalanceStrategyDialog";
import {
  DEFAULT_LOADBALANCE_STRATEGY_FORM,
  getDefaultAutoRecoveryDraft,
  type LoadbalanceStrategyFormState,
} from "../loadbalanceStrategyFormState";

function buildForm(
  overrides: Partial<LoadbalanceStrategyFormState> = {},
): LoadbalanceStrategyFormState {
  return {
    ...DEFAULT_LOADBALANCE_STRATEGY_FORM,
    name: "legacy-round-robin",
    strategy_type: "round-robin",
    auto_recovery: getDefaultAutoRecoveryDraft("round-robin"),
    ...overrides,
  };
}

describe("LoadbalanceStrategyDialog", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      "ResizeObserver",
      class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  it("shows a legacy strategy selector without adaptive routing copy", () => {
    render(
      <LocaleProvider>
        <TooltipProvider>
          <LoadbalanceStrategyDialog
            editingLoadbalanceStrategy={null}
            loadbalanceStrategyForm={DEFAULT_LOADBALANCE_STRATEGY_FORM}
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

    expect(screen.getByText("Strategy Type")).toBeInTheDocument();
    expect(screen.queryByText("Adaptive routing")).not.toBeInTheDocument();
    expect(screen.getByText("Auto Recovery")).toBeInTheDocument();

    const typeSelect = screen.getByRole("combobox", { name: "Strategy Type" });
    expect(typeSelect).toHaveTextContent("Single");
  });

  it("renders localized legacy dialog copy when the saved locale is Chinese", () => {
    localStorage.setItem("prism.locale", "zh-CN");

    render(
      <LocaleProvider>
        <TooltipProvider>
          <LoadbalanceStrategyDialog
            editingLoadbalanceStrategy={null}
            loadbalanceStrategyForm={DEFAULT_LOADBALANCE_STRATEGY_FORM}
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
    expect(screen.getByText("策略类型")).toBeInTheDocument();
    expect(screen.queryByText("自适应路由")).not.toBeInTheDocument();
  });

  it("submits through a real form without exposing adaptive routing_policy fields", () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <LocaleProvider>
        <TooltipProvider>
          <LoadbalanceStrategyDialog
            editingLoadbalanceStrategy={null}
            loadbalanceStrategyForm={DEFAULT_LOADBALANCE_STRATEGY_FORM}
            loadbalanceStrategySaving={false}
            onClose={vi.fn()}
            onOpenChange={vi.fn()}
            onSave={onSave}
            open
            setLoadbalanceStrategyForm={vi.fn()}
          />
        </TooltipProvider>
      </LocaleProvider>,
    );

    expect(screen.getByLabelText("Name")).toHaveAttribute("name", "name");
    expect(document.querySelector('input[name="routing_policy.kind"]')).toBeNull();

    const form = screen.getByRole("button", { name: "Save Strategy" }).closest("form");
    expect(form).not.toBeNull();

    fireEvent.submit(form!);

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("shows failover controls for enabled fill-first recovery and hides them when auto recovery is disabled", () => {
    const { rerender } = render(
      <LocaleProvider>
        <TooltipProvider>
          <LoadbalanceStrategyDialog
            editingLoadbalanceStrategy={null}
            loadbalanceStrategyForm={buildForm({
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
                ban: {
                  mode: "temporary",
                  max_cooldown_strikes_before_ban: 3,
                  ban_duration_seconds: 1800,
                },
              },
            })}
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

    expect(screen.getByLabelText("Failure Status Codes")).toBeInTheDocument();
    expect(screen.getByLabelText("Ban Duration (seconds)")).toBeInTheDocument();

    rerender(
      <LocaleProvider>
        <TooltipProvider>
          <LoadbalanceStrategyDialog
            editingLoadbalanceStrategy={null}
            loadbalanceStrategyForm={{
              ...DEFAULT_LOADBALANCE_STRATEGY_FORM,
              auto_recovery: { mode: "disabled" },
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

    expect(screen.queryByLabelText("Failure Status Codes")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Ban Duration (seconds)")).not.toBeInTheDocument();
  });
});
