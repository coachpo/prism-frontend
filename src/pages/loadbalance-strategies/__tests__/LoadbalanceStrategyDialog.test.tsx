import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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
      </TooltipProvider>,
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
});
