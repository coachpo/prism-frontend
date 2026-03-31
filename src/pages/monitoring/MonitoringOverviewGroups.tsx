import { useEffect, useRef, useState } from "react";
import { Activity, ChevronDown, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { StatusBadge, ValueBadge } from "@/components/StatusBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, formatLabel } from "@/lib/utils";
import type {
  MonitoringConnectionHistoryPoint,
  MonitoringOverviewVendor,
} from "@/lib/types";
import { useLocale } from "@/i18n/useLocale";

interface MonitoringOverviewGroupsProps {
  vendors: MonitoringOverviewVendor[];
}

export function MonitoringOverviewGroups({ vendors }: MonitoringOverviewGroupsProps) {
  const { formatNumber, formatRelativeTimeFromNow, messages } = useLocale();
  const copy = messages.monitoring;
  const [openVendorIds, setOpenVendorIds] = useState<Set<number>>(
    () => new Set(vendors.map((vendor) => vendor.vendor_id)),
  );
  const previousVendorIdsRef = useRef<Set<number>>(new Set(vendors.map((vendor) => vendor.vendor_id)));

  useEffect(() => {
    setOpenVendorIds((current) => {
      const validVendorIds = new Set(vendors.map((vendor) => vendor.vendor_id));
      const next = new Set(Array.from(current).filter((vendorId) => validVendorIds.has(vendorId)));

      vendors.forEach((vendor) => {
        if (!previousVendorIdsRef.current.has(vendor.vendor_id)) {
          next.add(vendor.vendor_id);
        }
      });

      return next;
    });

    previousVendorIdsRef.current = new Set(vendors.map((vendor) => vendor.vendor_id));
  }, [vendors]);

  const toggleVendor = (vendorId: number, nextOpen: boolean) => {
    setOpenVendorIds((current) => {
      const next = new Set(current);
      if (nextOpen) {
        next.add(vendorId);
      } else {
        next.delete(vendorId);
      }
      return next;
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Activity className="h-4 w-4" />
          {copy.vendorGroupsTitle}
        </CardTitle>
        <CardDescription className="text-xs">{copy.vendorGroupsDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {vendors.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            {copy.noVendorMonitoringData}
          </div>
        ) : (
          <div className="space-y-4">
            {vendors.map((vendor) => (
              <Collapsible
                key={vendor.vendor_id}
                open={openVendorIds.has(vendor.vendor_id)}
                onOpenChange={(nextOpen) => toggleVendor(vendor.vendor_id, nextOpen)}
              >
                <div className="rounded-xl border bg-muted/20">
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-muted/40"
                    >
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{vendor.vendor_name}</span>
                            <ValueBadge label={vendor.vendor_key} intent="info" />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {copy.vendorSummary(
                              formatNumber(vendor.model_count),
                              formatNumber(vendor.connection_count),
                            )}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <ValueBadge label={copy.modelCount(formatNumber(vendor.model_count))} intent="info" />
                          <ValueBadge label={copy.connectionCount(formatNumber(vendor.connection_count))} intent="accent" />
                          <StatusBadge label={copy.healthyCount(formatNumber(vendor.healthy_connection_count))} intent="success" />
                          <StatusBadge label={copy.degradedCount(formatNumber(vendor.degraded_connection_count))} intent="warning" />
                        </div>
                      </div>
                      {openVendorIds.has(vendor.vendor_id) ? (
                        <ChevronDown className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="border-t bg-background/80 px-4 py-4">
                      <div className="space-y-4">
                        {vendor.models.map((model) => (
                          <div key={model.model_config_id} className="rounded-lg border bg-card">
                            <div className="flex flex-col gap-3 border-b px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-sm font-semibold">
                                    {model.display_name ?? model.model_id}
                                  </h3>
                                  {model.display_name ? (
                                    <ValueBadge label={model.model_id} intent="default" />
                                  ) : null}
                                  <StatusBadge
                                    label={copy.fusedStatusLabel(model.fused_status)}
                                    intent={getStatusIntent(model.fused_status)}
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {copy.connectionCount(formatNumber(model.connection_count))}
                                </p>
                              </div>
                            </div>

                            <div className="divide-y">
                              {model.connections.map((connection) => (
                                <div
                                  key={connection.connection_id}
                                  className="grid gap-4 px-4 py-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]"
                                >
                                  <div className="space-y-3">
                                    <div className="flex flex-wrap items-start gap-2">
                                      <div className="min-w-0 flex-1 space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="text-sm font-medium">
                                            {connection.connection_name ?? connection.endpoint_name}
                                          </span>
                                          <StatusBadge
                                            label={copy.fusedStatusLabel(connection.fused_status)}
                                            intent={getStatusIntent(connection.fused_status)}
                                          />
                                          {connection.circuit_state ? (
                                            <ValueBadge
                                              label={formatLabel(connection.circuit_state)}
                                              intent="default"
                                            />
                                          ) : null}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                          {connection.endpoint_name}
                                        </p>
                                      </div>
                                      <ValueBadge
                                        label={copy.monitoringCadence(connection.monitoring_probe_interval_seconds)}
                                        intent="accent"
                                      />
                                    </div>

                                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                                      <MetricChip
                                        label={copy.endpointPingSummaryLabel}
                                        status={connection.endpoint_ping_status}
                                        value={formatLatency(connection.endpoint_ping_ms, formatNumber)}
                                      />
                                      <MetricChip
                                        label={copy.conversationDelaySummaryLabel}
                                        status={connection.conversation_status}
                                        value={formatLatency(connection.conversation_delay_ms, formatNumber)}
                                      />
                                      <MetricChip
                                        label={copy.liveP95SummaryLabel}
                                        status={connection.last_probe_status ?? connection.fused_status}
                                        value={formatLatency(connection.live_p95_latency_ms, formatNumber)}
                                      />
                                      <MetricChip
                                        label={copy.lastProbeLabel}
                                        status={connection.last_probe_status ?? "unknown"}
                                        value={connection.last_probe_at ? formatRelativeTimeFromNow(connection.last_probe_at) : copy.notAvailable}
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                    <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                                      <EvidenceItem
                                        label={copy.lastSuccessLabel}
                                        value={connection.last_live_success_at ? formatRelativeTimeFromNow(connection.last_live_success_at) : copy.notAvailable}
                                      />
                                      <EvidenceItem
                                        label={copy.lastFailureLabel}
                                        value={connection.last_live_failure_at ? formatRelativeTimeFromNow(connection.last_live_failure_at) : copy.notAvailable}
                                      />
                                      <EvidenceItem
                                        label={copy.failureKindLabel}
                                        value={connection.last_live_failure_kind ? formatLabel(connection.last_live_failure_kind) : copy.noneLabel}
                                      />
                                      <EvidenceItem
                                        label={copy.connectionIdLabel}
                                        value={String(connection.connection_id)}
                                      />
                                    </div>

                                    <ProbeHistoryStrip history={connection.recent_history} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EvidenceItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/20 px-3 py-2">
      <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm text-foreground">{value}</div>
    </div>
  );
}

function MetricChip({
  label,
  status,
  value,
}: {
  label: string;
  status: string;
  value: string;
}) {
  return (
    <div className="rounded-md border bg-muted/20 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
        <StatusBadge label={formatLabel(status)} intent={getStatusIntent(status)} />
      </div>
      <div className="mt-2 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function ProbeHistoryStrip({ history }: { history: MonitoringConnectionHistoryPoint[] }) {
  const { locale, messages } = useLocale();
  const copy = messages.monitoring;
  const sortedHistory = [...history].sort((left, right) => left.checked_at.localeCompare(right.checked_at));

  const statusLabels: Record<"ok" | "degraded" | "down", string> = {
    degraded: copy.probeStatusDegraded,
    down: copy.probeStatusDown,
    ok: copy.probeStatusOk,
  };

  const formatBucketLabel = (bucketStart: string) => {
    const date = new Date(bucketStart);

    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      month: "short",
    }).format(date);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {copy.past60ProbesTitle}
        </span>
        <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
          <LegendBadge label={copy.probeStatusOk} status="ok" />
          <LegendBadge label={copy.probeStatusDegraded} status="degraded" />
          <LegendBadge label={copy.probeStatusDown} status="down" />
        </div>
      </div>

      {sortedHistory.length === 0 ? (
        <div className="text-sm text-muted-foreground">{copy.noRecentHistory}</div>
      ) : (
        <TooltipProvider delayDuration={0}>
          <div
            className="grid gap-1 rounded-xl border border-border/60 bg-muted/20 p-2"
            data-testid="monitoring-probe-strip"
            style={{ gridTemplateColumns: `repeat(${sortedHistory.length}, minmax(0, 1fr))` }}
          >
            {sortedHistory.map((point) => {
              const probeStatus = getProbeStatus(point);
              const detailLines = [
                `endpoint ${point.endpoint_ping_status}${point.endpoint_ping_ms == null ? "" : ` ${point.endpoint_ping_ms}ms`}`,
                `conversation ${point.conversation_status}${point.conversation_delay_ms == null ? "" : ` ${point.conversation_delay_ms}ms`}`,
                point.failure_kind ? `failure ${point.failure_kind}` : null,
              ].filter(Boolean);

              return (
                <div data-testid="monitoring-probe-cell" key={point.checked_at}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        aria-label={`${copy.past60ProbesTitle} ${formatBucketLabel(point.checked_at)} ${statusLabels[probeStatus]}`}
                        className={cn(
                          "h-4 min-w-0 w-full rounded-[4px] border transition-transform duration-150 hover:-translate-y-0.5 focus-visible:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
                          getProbeToneClass(probeStatus),
                        )}
                        data-status={probeStatus}
                        data-testid={`monitoring-probe-cell-${probeStatus}`}
                        type="button"
                      />
                    </TooltipTrigger>
                    <TooltipContent
                      className="max-w-56 rounded-lg border border-border/60 bg-card px-3 py-2 text-card-foreground shadow-xl"
                      sideOffset={6}
                    >
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                          {formatBucketLabel(point.checked_at)}
                        </p>
                        <p className="font-medium text-muted-foreground">{statusLabels[probeStatus]}</p>
                        {detailLines.map((line) => (
                          <p key={`${point.checked_at}:${line}`}>{line}</p>
                        ))}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
              );
            })}
          </div>
        </TooltipProvider>
      )}
    </div>
  );
}

function LegendBadge({
  label,
  status,
}: {
  label: string;
  status: "ok" | "degraded" | "down";
}) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5",
        status === "ok" && "border-success/40 bg-success/10 text-success",
        status === "degraded" && "border-warning/40 bg-warning/15 text-warning-foreground dark:text-warning",
        status === "down" && "border-destructive/40 bg-destructive/10 text-destructive",
      )}
    >
      {label}
    </span>
  );
}

function getStatusIntent(status: string | null | undefined) {
  if (status === "healthy" || status === "closed") {
    return "success" as const;
  }

  if (status === "degraded" || status === "half_open" || status === "probe_eligible") {
    return "warning" as const;
  }

  if (status === "failed" || status === "unhealthy" || status === "open" || status === "banned") {
    return "danger" as const;
  }

  return "muted" as const;
}

function formatLatency(
  value: number | null | undefined,
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string,
) {
  return typeof value === "number" ? `${formatNumber(value)} ms` : "—";
}

function getProbeStatus(point: MonitoringConnectionHistoryPoint): "ok" | "degraded" | "down" {
  if (
    point.failure_kind ||
    point.endpoint_ping_status === "failed" ||
    point.conversation_status === "failed"
  ) {
    return "down";
  }

  if (
    point.endpoint_ping_status === "degraded" ||
    point.conversation_status === "degraded"
  ) {
    return "degraded";
  }

  return "ok";
}

function getProbeToneClass(status: "ok" | "degraded" | "down") {
  if (status === "ok") {
    return "border-success/60 bg-success/80 hover:bg-success/90 focus-visible:bg-success/90";
  }

  if (status === "degraded") {
    return "border-warning/60 bg-warning/75 hover:bg-warning/85 focus-visible:bg-warning/85";
  }

  return "border-destructive/60 bg-destructive/70 hover:bg-destructive/80 focus-visible:bg-destructive/80";
}
