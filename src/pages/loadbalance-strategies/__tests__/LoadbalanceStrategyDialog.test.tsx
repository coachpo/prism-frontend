import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LoadbalanceStrategyDialog } from "../LoadbalanceStrategyDialog";
import {
  DEFAULT_LOADBALANCE_STRATEGY_FORM,
  getDefaultRoutingPolicyDraft,
  type LoadbalanceStrategyFormState,
} from "../loadbalanceStrategyFormState";

function buildForm(
  overrides: Partial<LoadbalanceStrategyFormState> = {},
): LoadbalanceStrategyFormState {
  return {
    ...DEFAULT_LOADBALANCE_STRATEGY_FORM,
    name: "adaptive-primary",
    routing_policy: getDefaultRoutingPolicyDraft(),
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

  it("shows tooltip help for every adaptive circuit-breaker field", async () => {
    render(
      <LocaleProvider>
        <TooltipProvider>
          <LoadbalanceStrategyDialog
            editingLoadbalanceStrategy={null}
            loadbalanceStrategyForm={buildForm({
              routing_policy: {
                ...buildForm().routing_policy,
                circuit_breaker: {
                  ...buildForm().routing_policy.circuit_breaker,
                  ban_mode: "temporary",
                  max_open_strikes_before_ban: 3,
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

    const helpButtons = [
      {
        label: "Explain Base Open Window (seconds)",
        text: "Starting open window applied after transient failures once the threshold is reached.",
      },
      {
        label: "Explain Failure Threshold",
        text: "Number of consecutive failures required before the circuit breaker opens.",
      },
      {
        label: "Explain Backoff Multiplier",
        text: "Multiplier applied to the open window after each failure beyond the threshold.",
      },
      {
        label: "Explain Max Open Window (seconds)",
        text: "Upper limit for the computed open window, even after repeated failures.",
      },
      {
        label: "Explain Jitter Ratio",
        text: "Random spread applied to the open window so retries do not all happen at the same instant.",
      },
      {
        label: "Explain Failure Status Codes",
        text: "HTTP status codes that should count toward the adaptive circuit breaker.",
      },
      {
        label: "Explain Ban Mode",
        text: "Choose whether repeated max-open strikes stay off, expire automatically, or wait for a manual dismiss.",
      },
      {
        label: "Explain Max Open Strikes Before Ban",
        text: "Number of max-open strike events required before this connection is marked as banned.",
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
  });

  it("renders localized dialog copy when the saved locale is Chinese", () => {
    localStorage.setItem("prism.locale", "zh-CN");

    render(
      <LocaleProvider>
        <TooltipProvider>
          <LoadbalanceStrategyDialog
            editingLoadbalanceStrategy={null}
            loadbalanceStrategyForm={buildForm()}
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
    expect(screen.getByText("自适应路由")).toBeInTheDocument();
  });

  it("submits through a real form and exposes routing_policy field names", () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <LocaleProvider>
        <TooltipProvider>
          <LoadbalanceStrategyDialog
            editingLoadbalanceStrategy={null}
            loadbalanceStrategyForm={buildForm()}
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
    expect(document.querySelector('input[type="hidden"][name="routing_policy.kind"]')).toHaveValue(
      "adaptive",
    );

    const form = screen.getByRole("button", { name: "Save Strategy" }).closest("form");
    expect(form).not.toBeNull();

    fireEvent.submit(form!);

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("shows the ban duration field only for temporary ban mode", () => {
    const setLoadbalanceStrategyForm = vi.fn();

    const { rerender } = render(
      <LocaleProvider>
        <TooltipProvider>
          <LoadbalanceStrategyDialog
            editingLoadbalanceStrategy={null}
            loadbalanceStrategyForm={buildForm({
              routing_policy: {
                ...getDefaultRoutingPolicyDraft(),
                circuit_breaker: {
                  ...getDefaultRoutingPolicyDraft().circuit_breaker,
                  ban_mode: "temporary",
                  max_open_strikes_before_ban: 3,
                  ban_duration_seconds: 1800,
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

    expect(screen.getByLabelText("Ban Duration (seconds)")).toBeInTheDocument();

    rerender(
      <LocaleProvider>
        <TooltipProvider>
          <LoadbalanceStrategyDialog
            editingLoadbalanceStrategy={null}
            loadbalanceStrategyForm={buildForm({
              routing_policy: {
                ...getDefaultRoutingPolicyDraft(),
                circuit_breaker: {
                  ...getDefaultRoutingPolicyDraft().circuit_breaker,
                  ban_mode: "manual",
                  max_open_strikes_before_ban: 3,
                  ban_duration_seconds: 0,
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

  it("shows adaptive routing copy instead of the retired strategy-type selector", () => {
    render(
      <LocaleProvider>
        <TooltipProvider>
          <LoadbalanceStrategyDialog
            editingLoadbalanceStrategy={null}
            loadbalanceStrategyForm={buildForm()}
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

    expect(screen.queryByText("Strategy Type")).not.toBeInTheDocument();
    expect(screen.getByText("Adaptive routing")).toBeInTheDocument();
    expect(screen.getByLabelText("Failure Status Codes")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Status Code" })).toBeInTheDocument();
    expect(screen.getByText("429")).toBeInTheDocument();
    expect(screen.getByText("503")).toBeInTheDocument();
  });
});
