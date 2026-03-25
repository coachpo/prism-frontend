import { Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge, ValueBadge } from "@/components/StatusBadge";
import type {
  LoadbalanceCurrentStateItem,
  LoadbalanceCurrentStateValue,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import type { FormatTime } from "./connectionCardTypes";
import { buildCurrentStateCopy } from "./ConnectionCardSectionsShared";

export function ConnectionCardCooldownState({
  currentState,
  formatTime,
  isResetting,
  onResetCooldown,
}: {
  currentState: LoadbalanceCurrentStateItem | undefined;
  formatTime: FormatTime;
  isResetting: boolean;
  onResetCooldown: (connectionId: number) => void;
}) {
  if (!currentState) {
    return null;
  }

  const tone = getCurrentStateTone(currentState.state);
  const failureCountLabel = `${currentState.consecutive_failures} failure${currentState.consecutive_failures === 1 ? "" : "s"}`;

  return (
    <div className={cn("rounded-lg border px-3 py-2 text-xs", tone.panelClassName)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label={tone.label} intent={tone.intent} />
            <ValueBadge label={failureCountLabel} intent="default" />
          </div>
          <p className="leading-5 text-muted-foreground">
            {buildCurrentStateCopy(currentState, formatTime)}
          </p>
        </div>

        <Button
          size="xs"
          variant="outline"
          disabled={isResetting}
          onClick={() => onResetCooldown(currentState.connection_id)}
          className="self-start"
        >
          {isResetting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RotateCcw className="h-3 w-3" />
          )}
          Reset Cooldown
        </Button>
      </div>
    </div>
  );
}

function getCurrentStateTone(
  state: LoadbalanceCurrentStateValue,
): {
  label: string;
  intent: "warning" | "danger" | "info";
  panelClassName: string;
} {
  if (state === "blocked") {
    return {
      label: "Cooling Down",
      intent: "danger",
      panelClassName: "border-red-500/20 bg-red-500/5",
    };
  }

  if (state === "probe_eligible") {
    return {
      label: "Probe Eligible",
      intent: "info",
      panelClassName: "border-sky-500/20 bg-sky-500/5",
    };
  }

  return {
    label: "Failure Counting",
    intent: "warning",
    panelClassName: "border-amber-500/20 bg-amber-500/5",
  };
}
