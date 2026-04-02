import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { VendorIcon } from "@/components/VendorIcon";
import { CompactMetricTile } from "@/components/CompactMetricTile";
import { MonitoringProbeHistoryStrip } from "@/components/MonitoringProbeHistoryStrip";
import { ValueBadge } from "@/components/StatusBadge";
import { formatLabel } from "@/lib/utils";
import type {
  MonitoringOverviewVendor,
} from "@/lib/types";
import { useLocale } from "@/i18n/useLocale";

interface MonitoringOverviewGroupsProps {
  vendors: MonitoringOverviewVendor[];
}

export function MonitoringOverviewGroups({ vendors }: MonitoringOverviewGroupsProps) {
  const { formatNumber, formatRelativeTimeFromNow, messages } = useLocale();
  const copy = messages.monitoring;
  const [openVendorIds, setOpenVendorIds] = useState<Set<number>>(() => new Set());
  const hasInitializedVendorLoadRef = useRef(vendors.length > 0);
  const previousVendorIdsRef = useRef<Set<number>>(new Set(vendors.map((vendor) => vendor.vendor_id)));

  useEffect(() => {
    setOpenVendorIds((current) => {
      const validVendorIds = new Set(vendors.map((vendor) => vendor.vendor_id));
      const next = new Set(Array.from(current).filter((vendorId) => validVendorIds.has(vendorId)));

      if (hasInitializedVendorLoadRef.current) {
        vendors.forEach((vendor) => {
          if (!previousVendorIdsRef.current.has(vendor.vendor_id)) {
            next.add(vendor.vendor_id);
          }
        });
      }

      return next;
    });

    previousVendorIdsRef.current = new Set(vendors.map((vendor) => vendor.vendor_id));
    if (vendors.length > 0) {
      hasInitializedVendorLoadRef.current = true;
    }
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
    vendors.length === 0 ? (
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
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <VendorIcon
                        vendor={{ key: vendor.vendor_key, name: vendor.vendor_name, icon_key: vendor.icon_key }}
                        size={20}
                        className="rounded-lg"
                      />
                      <span className="text-sm font-semibold">{vendor.vendor_name}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 self-start pt-0.5">
                    {openVendorIds.has(vendor.vendor_id) ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
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
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {copy.connectionCount(formatNumber(model.connection_count))}
                                </p>
                              </div>
                            </div>

                              <div className="divide-y">
                                {model.connections.map((connection) => {
                                  const lastProbeLabel = connection.last_probe_at
                                    ? formatRelativeTimeFromNow(connection.last_probe_at)
                                    : copy.notAvailable;
                                  const nextProbeLabel = formatNextProbeLabel(connection, formatRelativeTimeFromNow, copy.notAvailable);
                                  const lastSuccessLabel = formatLastSuccessLabel(connection, formatRelativeTimeFromNow, copy.notAvailable);

                                  return (
                                    <div
                                      key={connection.connection_id}
                                      className="px-4 py-4"
                                    >
                                      <div className="space-y-3">
                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                          <div className="min-w-0 space-y-1.5">
                                             <div className="flex flex-wrap items-center gap-2">
                                               <span className="text-sm font-medium">
                                                 {connection.connection_name ?? connection.endpoint_name}
                                               </span>
                                               <ValueBadge label={`#${connection.connection_id}`} intent="default" />
                                             </div>
                                            <p className="text-xs text-muted-foreground">
                                              {connection.endpoint_name}
                                            </p>
                                          </div>

                                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                            <span className="uppercase tracking-[0.16em]">{copy.lastProbeLabel}</span>
                                            <span className="font-medium text-foreground">{lastProbeLabel}</span>
                                            <span aria-hidden="true" className="text-muted-foreground/60">•</span>
                                            <span className="uppercase tracking-[0.16em]">{copy.nextProbeLabel}</span>
                                            <span className="font-medium text-foreground">{nextProbeLabel}</span>
                                          </div>
                                        </div>

                                         <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" data-testid="monitoring-connection-summary-grid">
                                           <SummaryTile
                                             label={copy.endpointPingSummaryLabel}
                                             value={formatLatency(connection.endpoint_ping_ms, formatNumber)}
                                           />
                                           <SummaryTile
                                             label={copy.conversationDelaySummaryLabel}
                                             value={formatLatency(connection.conversation_delay_ms, formatNumber)}
                                           />
                                           <SummaryTile
                                             label={copy.liveP95SummaryLabel}
                                             value={formatLatency(connection.live_p95_latency_ms, formatNumber)}
                                          />
                                          <SummaryTile
                                            label={copy.lastSuccessLabel}
                                            value={lastSuccessLabel}
                                          />
                                          <SummaryTile
                                            detail={connection.last_live_failure_kind ? `${copy.failureKindLabel}: ${formatLabel(connection.last_live_failure_kind)}` : undefined}
                                            label={copy.lastFailureLabel}
                                            value={connection.last_live_failure_at ? formatRelativeTimeFromNow(connection.last_live_failure_at) : copy.notAvailable}
                                          />
                                          <SummaryTile
                                            label={copy.failureKindLabel}
                                            value={connection.last_live_failure_kind ? formatLabel(connection.last_live_failure_kind) : copy.noneLabel}
                                          />
                                        </div>

                                        <MonitoringProbeHistoryStrip history={connection.recent_history} />
                                      </div>
                                    </div>
                                  );
                                })}
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
    )
  );
}

function SummaryTile({
  detail,
  label,
  value,
}: {
  detail?: string;
  label: string;
  value: string;
}) {
  return (
    <div data-testid="monitoring-connection-summary-tile">
      <CompactMetricTile
        className="border-border/60 bg-background/80"
        detail={detail}
        label={label}
        value={value}
        valueClassName="text-base [overflow-wrap:anywhere]"
      />
    </div>
  );
}

function formatLatency(
  value: number | null | undefined,
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string,
) {
  return typeof value === "number" ? `${formatNumber(value)} ms` : "—";
}

function formatNextProbeLabel(
  connection: MonitoringOverviewVendor["models"][number]["connections"][number],
  formatRelativeTimeFromNow: ReturnType<typeof useLocale>["formatRelativeTimeFromNow"],
  fallbackLabel: string,
) {
  if (!connection.last_probe_at) {
    return fallbackLabel;
  }

  const nextProbeAt = new Date(connection.last_probe_at);
  if (Number.isNaN(nextProbeAt.getTime())) {
    return fallbackLabel;
  }

  nextProbeAt.setSeconds(
    nextProbeAt.getSeconds() + (connection.monitoring_probe_interval_seconds ?? 300),
  );

  return formatRelativeTimeFromNow(nextProbeAt.toISOString()) || fallbackLabel;
}

function formatLastSuccessLabel(
  connection: MonitoringOverviewVendor["models"][number]["connections"][number],
  formatRelativeTimeFromNow: ReturnType<typeof useLocale>["formatRelativeTimeFromNow"],
  fallbackLabel: string,
) {
  if (connection.last_live_success_at) {
    return formatRelativeTimeFromNow(connection.last_live_success_at) || fallbackLabel;
  }

  const latestSuccessfulProbeAt = connection.recent_history.reduce<string | null>((latest, point) => {
    if (!isSuccessfulProbe(point)) {
      return latest;
    }

    if (!latest || point.checked_at > latest) {
      return point.checked_at;
    }

    return latest;
  }, null);

  return latestSuccessfulProbeAt ? formatRelativeTimeFromNow(latestSuccessfulProbeAt) || fallbackLabel : fallbackLabel;
}

function isSuccessfulProbe(point: MonitoringOverviewVendor["models"][number]["connections"][number]["recent_history"][number]) {
  return !point.failure_kind && point.endpoint_ping_status !== "failed" && point.conversation_status !== "failed";
}
