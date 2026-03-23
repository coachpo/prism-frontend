import {
  Activity,
  Info,
  Loader2,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Route,
  Trash2,
} from "lucide-react";
import { FailureKindBadge } from "@/components/loadbalance/LoadbalanceBadges";
import { StatusBadge, ValueBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  Connection,
  LoadbalanceCurrentStateItem,
  LoadbalanceCurrentStateValue,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  formatLatencyForDisplay,
  type ConnectionDerivedMetrics,
} from "../modelDetailMetricsAndPaths";
import type { FormatTime } from "./connectionCardTypes";

export function ConnectionCardHeader({
  connection,
  connectionName,
  isChecking,
}: {
  connection: Connection;
  connectionName: string;
  isChecking: boolean;
}) {
  const { healthLabel, healthIntent } = getHealthBadgeProps(connection.health_status, isChecking);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={cn(
          "inline-flex h-2.5 w-2.5 shrink-0 rounded-full",
          isChecking
            ? "animate-pulse bg-primary/70"
            : connection.health_status === "healthy"
              ? "bg-emerald-500"
              : connection.health_status === "unhealthy"
                ? "bg-destructive"
                : "bg-muted-foreground/50",
        )}
      />
      <span className="truncate text-sm font-medium">{connectionName}</span>
      <StatusBadge label={healthLabel} intent={healthIntent} />
      <ValueBadge
        label={`P${connection.priority}`}
        intent="default"
        className={cn("tabular-nums", getPriorityBadgeClasses(connection.priority))}
      />
      <StatusBadge
        label={connection.pricing_template ? "Pricing On" : "Pricing Off"}
        intent={connection.pricing_template ? "success" : "muted"}
      />
      {connection.pricing_template ? (
        <div className="flex items-center gap-1">
          <ValueBadge
            label={`${connection.pricing_template.name} v${connection.pricing_template.version}`}
            intent="info"
          />
          <ValueBadge label={connection.pricing_template.pricing_currency_code} intent="accent" />
        </div>
      ) : null}
      {!connection.is_active ? <StatusBadge label="Inactive" intent="muted" /> : null}
    </div>
  );
}

export function ConnectionCardDetails({
  connection,
  formatTime,
  isChecking,
}: {
  connection: Connection;
  formatTime: FormatTime;
  isChecking: boolean;
}) {
  const endpoint = connection.endpoint;
  const maskedKey = endpoint?.masked_api_key || "......";

  return (
    <>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="truncate font-medium">{endpoint?.name ?? "Unknown endpoint"}</span>
        <span className="text-muted-foreground/70">.</span>
        <span className="font-mono break-all">{endpoint?.base_url}</span>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>Key: {maskedKey}</span>
        {isChecking ? (
          <span className="inline-flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Checking now...
          </span>
        ) : connection.last_health_check ? (
          <span>
            Checked {formatTime(connection.last_health_check, {
              hour: "numeric",
              minute: "numeric",
              second: "numeric",
              hour12: true,
            })}
          </span>
        ) : (
          <span>Not checked yet</span>
        )}
      </div>
    </>
  );
}

export function ConnectionCardMetrics({
  formatTime,
  metrics24h,
}: {
  formatTime: FormatTime;
  metrics24h: ConnectionDerivedMetrics | undefined;
}) {
  const successRate = metrics24h?.success_rate_24h ?? null;

  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <span>Success rate (24h)</span>
        <span className="text-[10px]">n={(metrics24h?.request_count_24h ?? 0).toLocaleString()}</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5" />
            </TooltipTrigger>
            <TooltipContent className="pointer-events-none">
              <p className="text-xs">
                Success rate = successful requests / total requests for this connection in the last 24 hours. n = total requests counted in that 24h window.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="block rounded-sm">
        <div className="flex items-center gap-2 pt-0.5">
          <Progress
            value={successRate ?? 0}
            className={cn(
              "h-1.5",
              successRate === null
                ? "[&>[data-slot=progress-indicator]]:bg-muted-foreground/40"
                : successRate >= 95
                  ? "[&>[data-slot=progress-indicator]]:bg-emerald-500"
                  : successRate >= 80
                    ? "[&>[data-slot=progress-indicator]]:bg-amber-500"
                    : "[&>[data-slot=progress-indicator]]:bg-red-500",
            )}
          />
          <span
            className={cn(
              "shrink-0 text-[10px] font-medium tabular-nums",
              successRate === null
                ? "text-muted-foreground"
                : successRate >= 95
                  ? "text-emerald-600 dark:text-emerald-400"
                  : successRate >= 80
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-red-600 dark:text-red-400",
            )}
          >
            {successRate === null ? "-" : `${successRate.toFixed(1)}%`}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <MetricTile
          label="P95 latency (24h)"
          value={formatLatencyForDisplay(metrics24h?.p95_latency_ms ?? null)}
        />
        <MetricTile
          label="5xx rate (sampled)"
          value={
            metrics24h?.five_xx_rate === null || metrics24h?.five_xx_rate === undefined
              ? "-"
              : `${metrics24h.five_xx_rate.toFixed(1)}%`
          }
        />
      </div>

      <div className="rounded border border-dashed px-2 py-1.5 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <Route className="h-3.5 w-3.5" />
          Failover-like signals (derived from 5xx)
        </div>
        <div className="mt-1 flex items-center gap-3">
          <span>Events: {metrics24h?.heuristic_failover_events ?? 0}</span>
          <span>
            Last: {metrics24h?.last_failover_like_at ? formatTime(metrics24h.last_failover_like_at) : "-"}
          </span>
        </div>
      </div>
    </div>
  );
}

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
            <FailureKindBadge failureKind={currentState.last_failure_kind} />
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

export function ConnectionCardActions({
  connection,
  isChecking,
  onDelete,
  onEdit,
  onHealthCheck,
  onToggleActive,
}: {
  connection: Connection;
  isChecking: boolean;
  onEdit: (connection: Connection) => void;
  onDelete: (id: number) => void;
  onHealthCheck: (id: number) => void;
  onToggleActive: (connection: Connection) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <Switch
        checked={connection.is_active}
        onCheckedChange={() => onToggleActive(connection)}
        className="scale-90 data-[state=checked]:bg-emerald-500"
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(connection)}>
            <Pencil className="mr-2 h-3.5 w-3.5" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onHealthCheck(connection.id)} disabled={isChecking}>
            {isChecking ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Activity className="mr-2 h-3.5 w-3.5" />
            )}
            Health Check
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDelete(connection.id)}
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function buildCurrentStateCopy(
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

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border px-2 py-1.5">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium tabular-nums">{value}</p>
    </div>
  );
}

function getHealthBadgeProps(
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

function getPriorityBadgeClasses(priority: number): string {
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
