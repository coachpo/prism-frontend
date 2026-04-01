import { MonitoringProbeHistoryStrip } from "@/components/MonitoringProbeHistoryStrip";
import { ValueBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/i18n/useLocale";
import type { MonitoringModelConnection } from "@/lib/types";
import type { FormatTime } from "./connectionCardTypes";

export function ConnectionCardMetrics({
  formatTime,
  monitoringConnection,
  monitoringLoading,
}: {
  formatTime: FormatTime;
  monitoringConnection: MonitoringModelConnection | undefined;
  monitoringLoading: boolean;
}) {
  const { messages, formatRelativeTimeFromNow } = useLocale();
  const copy = messages.modelDetail;

  if (monitoringLoading && !monitoringConnection) {
    return (
      <div className="space-y-2 pt-1" data-testid="connection-monitoring-placeholder">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-5 w-32 rounded-full" />
          <Skeleton className="h-5 w-44 rounded-full" />
        </div>
        <Skeleton className="h-8 w-full rounded-xl" />
      </div>
    );
  }

  if (!monitoringConnection) {
    return (
      <div className="pt-1">
        <MonitoringProbeHistoryStrip history={[]} showLegend={false} title={null} />
      </div>
    );
  }

  const nextUpdateLabel = buildNextUpdateLabel(
    monitoringConnection,
    formatRelativeTimeFromNow,
    formatTime,
    copy,
  );

  return (
    <div className="space-y-2 pt-1">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <ValueBadge label={nextUpdateLabel} intent="default" />
      </div>

      <MonitoringProbeHistoryStrip
        history={monitoringConnection.recent_history}
        showLegend={false}
        title={null}
      />
    </div>
  );
}

function buildNextUpdateLabel(
  monitoringConnection: MonitoringModelConnection,
  formatRelativeTimeFromNow: ReturnType<typeof useLocale>["formatRelativeTimeFromNow"],
  formatTime: FormatTime,
  copy: ReturnType<typeof useLocale>["messages"]["modelDetail"],
) {
  if (!monitoringConnection.last_probe_at) {
    return copy.nextUpdateIn("—");
  }

  const nextUpdateAt = new Date(monitoringConnection.last_probe_at);
  nextUpdateAt.setSeconds(
    nextUpdateAt.getSeconds() + (monitoringConnection.monitoring_probe_interval_seconds ?? 300),
  );

  const nextUpdateIso = nextUpdateAt.toISOString();
  const relativeLabel = formatRelativeTimeFromNow(nextUpdateIso);

  return copy.nextUpdateIn(relativeLabel || formatTime(nextUpdateIso));
}
