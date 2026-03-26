import type { Connection, LoadbalanceCurrentStateItem } from "@/lib/types";
import type { FormatTime } from "./connectionCardTypes";

export function getHealthBadgeProps(
  healthStatus: Connection["health_status"],
  isChecking: boolean,
): { healthLabel: string; healthIntent: "info" | "success" | "danger" | "muted" } {
  if (isChecking) {
    return { healthLabel: "Checking", healthIntent: "info" };
  }

  if (healthStatus === "healthy") {
    return { healthLabel: "Healthy", healthIntent: "success" };
  }

  if (healthStatus === "unhealthy") {
    return { healthLabel: "Unhealthy", healthIntent: "danger" };
  }

  return { healthLabel: "Unknown", healthIntent: "muted" };
}

export function getPriorityBadgeClasses(priority: number): string {
  if (priority === 0) {
    return "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
  }

  if (priority === 1) {
    return "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-400";
  }

  if (priority === 2) {
    return "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-400";
  }

  if (priority === 3) {
    return "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400";
  }

  return "border-muted-foreground/20 bg-muted/60 text-muted-foreground";
}

export function buildCurrentStateCopy(
  currentState: LoadbalanceCurrentStateItem,
  formatTime: FormatTime,
): string {
  const cooldown = formatCooldownSeconds(currentState.last_cooldown_seconds);
  const failureSummary = `${currentState.consecutive_failures} consecutive failure${currentState.consecutive_failures === 1 ? "" : "s"}`;
  const failureKindLabel = getFailureKindLabel(currentState.last_failure_kind);
  const blockedUntilLabel = currentState.blocked_until_at
    ? formatTime(currentState.blocked_until_at, {
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: true,
      })
    : null;
  const bannedUntilLabel = currentState.banned_until_at
    ? formatTime(currentState.banned_until_at, {
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: true,
      })
    : null;

  if (currentState.state === "banned") {
    if (currentState.ban_mode === "temporary") {
      return `This connection is banned until ${bannedUntilLabel ?? "the temporary ban expires"}.`;
    }

    return "This connection is banned until the operator dismisses it.";
  }

  if (currentState.state === "blocked") {
    return `${failureSummary} triggered a ${cooldown} cooldown after ${failureKindLabel}. Routing stays paused until ${blockedUntilLabel ?? "the cooldown expires"}.`;
  }

  if (currentState.state === "probe_eligible") {
    return `The last ${cooldown} cooldown expired${blockedUntilLabel ? ` at ${blockedUntilLabel}` : ""}. This connection is now eligible for the next routed probe after ${failureKindLabel}.`;
  }

  return `Tracking ${failureSummary} after ${failureKindLabel}. No cooldown is currently open, but failover recovery is still counting these signals.`;
}

function formatCooldownSeconds(seconds: number): string {
  const roundedSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(roundedSeconds / 60);
  const remainingSeconds = roundedSeconds % 60;

  if (minutes === 0) {
    return `${roundedSeconds}s`;
  }

  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

function getFailureKindLabel(failureKind: LoadbalanceCurrentStateItem["last_failure_kind"]): string {
  if (failureKind === "transient_http") {
    return "a transient HTTP failure";
  }
  if (failureKind === "auth_like") {
    return "an auth-like failure";
  }
  if (failureKind === "connect_error") {
    return "a connection error";
  }
  if (failureKind === "timeout") {
    return "a timeout";
  }
  return "an unknown failure";
}
