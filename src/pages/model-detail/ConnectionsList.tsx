import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { StatusBadge, ValueBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { Search, Plus, Pencil, Activity, Trash2, Loader2, Info, Route, Shield, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTimezone } from "@/hooks/useTimezone";
import { getConnectionName, buildRequestLogsPath, formatLatencyForDisplay } from "./utils";
import type { ConnectionDerivedMetrics } from "./utils";
import type { Connection, ModelConfig } from "@/lib/types";

interface ConnectionsListProps {
  model: ModelConfig;
  connections: Connection[];
  connectionSearch: string;
  setConnectionSearch: (search: string) => void;
  openConnectionDialog: (connection?: Connection) => void;
  handleDeleteConnection: (id: number) => void;
  handleHealthCheck: (id: number) => void;
  handleToggleActive: (connection: Connection) => void;
  connectionMetrics24h: Map<number, ConnectionDerivedMetrics>;
  healthCheckingIds: Set<number>;
  focusedConnectionId: number | null;
  connectionCardRefs: Map<number, HTMLDivElement>;
}

export function ConnectionsList({
  model,
  connections,
  connectionSearch,
  setConnectionSearch,
  openConnectionDialog,
  handleDeleteConnection,
  handleHealthCheck,
  handleToggleActive,
  connectionMetrics24h,
  healthCheckingIds,
  focusedConnectionId,
  connectionCardRefs,
}: ConnectionsListProps) {
  const { format: formatTime } = useTimezone();

  const filteredConnections = [...(connectionSearch
    ? connections.filter(c =>
        (getConnectionName(c)).toLowerCase().includes(connectionSearch.toLowerCase()) ||
        (c.endpoint?.name || "").toLowerCase().includes(connectionSearch.toLowerCase()) ||
        (c.endpoint?.base_url || "").toLowerCase().includes(connectionSearch.toLowerCase())
      )
    : connections
  )].sort((a, b) => a.priority - b.priority);

  return (
    <>
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">
            Connections
            <span className="ml-2 text-xs font-normal text-muted-foreground">({connections.length})</span>
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Health checks run automatically when this page opens. Use manual check for spot validation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {connections.length > 3 && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Filter connections..."
                value={connectionSearch}
                onChange={(e) => setConnectionSearch(e.target.value)}
                className="h-8 w-48 pl-8 text-xs"
              />
            </div>
          )}
          <Button size="sm" onClick={() => openConnectionDialog()}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Connection
          </Button>
        </div>
      </div>

      {filteredConnections.length === 0 ? (
        <EmptyState
          icon={<Shield className="h-6 w-6" />}
          title={connectionSearch ? "No connections match your filter" : "No connections configured"}
          description={connectionSearch ? "Try a different search term" : "Add a connection to start routing requests"}
          action={!connectionSearch ? (
            <Button size="sm" onClick={() => openConnectionDialog()}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Connection
            </Button>
          ) : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filteredConnections.map((conn) => {
            const metrics24h = connectionMetrics24h.get(conn.id);
            const isChecking = healthCheckingIds.has(conn.id);
            const isFocused = focusedConnectionId === conn.id;
            const successRate = metrics24h?.success_rate_24h ?? null;
            const endpoint = conn.endpoint;
            const maskedKey = endpoint?.api_key && endpoint.api_key.length > 8
              ? `${endpoint.api_key.slice(0, 4)}••••••${endpoint.api_key.slice(-4)}`
              : "••••••";

            return (
              <div
                key={conn.id}
                ref={(el) => {
                  if (el) {
                    connectionCardRefs.set(conn.id, el);
                  } else {
                    connectionCardRefs.delete(conn.id);
                  }
                }}
                tabIndex={-1}
                className={cn(
                  "rounded-xl border bg-card p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  isFocused && "ring-2 ring-primary/40 border-primary/30 bg-muted/20",
                  !isFocused && "hover:border-border"
                )}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(
                        "inline-flex h-2.5 w-2.5 rounded-full shrink-0",
                        isChecking
                          ? "animate-pulse bg-primary/70"
                          : conn.health_status === "healthy"
                            ? "bg-emerald-500"
                            : conn.health_status === "unhealthy"
                              ? "bg-destructive"
                              : "bg-muted-foreground/50"
                      )} />
                      <span className="text-sm font-medium truncate">
                        {getConnectionName(conn)}
                      </span>
                      <StatusBadge
                        label={
                          isChecking
                            ? "Checking"
                            : conn.health_status === "healthy"
                              ? "Healthy"
                              : conn.health_status === "unhealthy"
                                ? "Unhealthy"
                                : "Unknown"
                        }
                        intent={
                          isChecking
                            ? "info"
                            : conn.health_status === "healthy"
                              ? "success"
                              : conn.health_status === "unhealthy"
                                ? "danger"
                                : "muted"
                        }
                      />
                      <ValueBadge
                        label={`P${conn.priority}`}
                        intent={conn.priority >= 10 ? "warning" : conn.priority >= 1 ? "info" : "muted"}
                      />
                      <StatusBadge
                        label={conn.pricing_template ? "Pricing On" : "Pricing Off"}
                        intent={conn.pricing_template ? "success" : "muted"}
                      />
                      {conn.pricing_template && (
                        <div className="flex items-center gap-1">
                          <ValueBadge
                            label={conn.pricing_template.name}
                            intent="info"
                          />
                          <ValueBadge
                            label={`v${conn.pricing_template.version}`}
                            intent="muted"
                          />
                          <ValueBadge
                            label={conn.pricing_template.pricing_currency_code}
                            intent="accent"
                          />
                        </div>
                      )}
                      {!conn.is_active && (
                        <StatusBadge label="Inactive" intent="muted" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="truncate font-medium">{endpoint?.name ?? "Unknown endpoint"}</span>
                      <span className="text-muted-foreground/70">•</span>
                      <span className="font-mono break-all">{endpoint?.base_url}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Key: {maskedKey}</span>
                      {isChecking ? (
                        <span className="inline-flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Checking now...
                        </span>
                      ) : conn.last_health_check ? (
                        <span>Checked {formatTime(conn.last_health_check, { hour: "numeric", minute: "numeric", second: "numeric", hour12: true })}</span>
                      ) : (
                        <span>Not checked yet</span>
                      )}
                    </div>
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
                      <Link
                        to={buildRequestLogsPath({
                          modelId: model.model_id,
                          connectionId: conn.id,
                          timeRange: "24h",
                          outcomeFilter: "all",
                        })}
                        className="block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <div className="flex items-center gap-2 pt-0.5 hover:opacity-90">
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
                                    : "[&>[data-slot=progress-indicator]]:bg-red-500"
                            )}
                          />
                          <span className={cn(
                            "text-[10px] font-medium tabular-nums shrink-0",
                            successRate === null
                              ? "text-muted-foreground"
                              : successRate >= 95
                                ? "text-emerald-600 dark:text-emerald-400"
                                : successRate >= 80
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-red-600 dark:text-red-400"
                          )}>
                            {successRate === null ? "-" : `${successRate.toFixed(1)}%`}
                          </span>
                        </div>
                      </Link>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="rounded border px-2 py-1.5">
                          <p className="text-muted-foreground">P95 latency (24h)</p>
                          <p className="font-medium tabular-nums">
                            {formatLatencyForDisplay(metrics24h?.p95_latency_ms ?? null)}
                          </p>
                        </div>
                        <div className="rounded border px-2 py-1.5">
                          <p className="text-muted-foreground">5xx rate (sampled)</p>
                          <p className="font-medium tabular-nums">
                            {metrics24h?.five_xx_rate === null ||
                            metrics24h?.five_xx_rate === undefined
                              ? "-"
                              : `${metrics24h.five_xx_rate.toFixed(1)}%`}
                          </p>
                        </div>
                      </div>
                      <div className="rounded border border-dashed px-2 py-1.5 text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Route className="h-3.5 w-3.5" />
                          Failover-like signals (derived from 5xx)
                        </div>
                        <div className="mt-1 flex items-center gap-3">
                          <span>
                            Events: {metrics24h?.heuristic_failover_events ?? 0}
                          </span>
                          <span>
                            Last: {metrics24h?.last_failover_like_at
                              ? formatTime(metrics24h.last_failover_like_at)
                              : "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={conn.is_active}
                      onCheckedChange={() => handleToggleActive(conn)}
                      className="scale-90 data-[state=checked]:bg-emerald-500"
                    />

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openConnectionDialog(conn)}>
                          <Pencil className="mr-2 h-3.5 w-3.5" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleHealthCheck(conn.id)} disabled={isChecking}>
                          {isChecking ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Activity className="mr-2 h-3.5 w-3.5" />}
                          Health Check
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteConnection(conn.id)}>
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
