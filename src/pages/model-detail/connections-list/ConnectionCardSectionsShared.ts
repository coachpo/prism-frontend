import type { Connection, LoadbalanceCurrentStateItem } from "@/lib/types";
import type { FormatTime } from "./connectionCardTypes";

export type ConnectionCardHealthCopy = {
  checking: string;
  healthy: string;
  unhealthy: string;
  unknown: string;
};

export type ConnectionCardCurrentStateCopy = {
  consecutiveFailures: (count: number) => string;
  currentStateBlocked: (
    failureSummary: string,
    cooldown: string,
    failureKind: string,
    blockedUntil: string | null,
  ) => string;
  currentStateCounting: (failureSummary: string, failureKind: string) => string;
  currentStateManualBan: string;
  currentStateProbeEligible: (
    cooldown: string,
    blockedUntil: string | null,
    failureKind: string,
  ) => string;
  currentStateTemporaryBan: (until: string | null) => string;
  failureKindAuthLike: string;
  failureKindConnectError: string;
  failureKindTimeout: string;
  failureKindTransientHttp: string;
  failureKindUnknown: string;
};

export function getHealthBadgeProps(
  healthStatus: Connection["health_status"],
  isChecking: boolean,
  copy: ConnectionCardHealthCopy,
): { healthLabel: string; healthIntent: "info" | "success" | "danger" | "muted" } {
  if (isChecking) {
    return { healthLabel: copy.checking, healthIntent: "info" };
  }

  if (healthStatus === "healthy") {
    return { healthLabel: copy.healthy, healthIntent: "success" };
  }

  if (healthStatus === "unhealthy") {
    return { healthLabel: copy.unhealthy, healthIntent: "danger" };
  }

  return { healthLabel: copy.unknown, healthIntent: "muted" };
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
  copy: ConnectionCardCurrentStateCopy,
): string {
  const cooldown = formatCooldownSeconds(currentState.last_cooldown_seconds);
  const failureSummary = copy.consecutiveFailures(currentState.consecutive_failures);
  const failureKindLabel = getFailureKindLabel(currentState.last_failure_kind, copy);
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
      return copy.currentStateTemporaryBan(bannedUntilLabel);
    }

    return copy.currentStateManualBan;
  }

  if (currentState.state === "blocked") {
    return copy.currentStateBlocked(failureSummary, cooldown, failureKindLabel, blockedUntilLabel);
  }

  if (currentState.state === "probe_eligible") {
    return copy.currentStateProbeEligible(cooldown, blockedUntilLabel, failureKindLabel);
  }

  return copy.currentStateCounting(failureSummary, failureKindLabel);
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

function getFailureKindLabel(
  failureKind: LoadbalanceCurrentStateItem["last_failure_kind"],
  copy: ConnectionCardCurrentStateCopy,
): string {
  if (failureKind === "transient_http") {
    return copy.failureKindTransientHttp;
  }
  if (failureKind === "auth_like") {
    return copy.failureKindAuthLike;
  }
  if (failureKind === "connect_error") {
    return copy.failureKindConnectError;
  }
  if (failureKind === "timeout") {
    return copy.failureKindTimeout;
  }
  return copy.failureKindUnknown;
}
