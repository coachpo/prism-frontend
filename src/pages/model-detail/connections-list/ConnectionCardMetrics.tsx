import { MonitoringProbeHistoryStrip } from "@/components/MonitoringProbeHistoryStrip";
import { Skeleton } from "@/components/ui/skeleton";
import type { MonitoringModelConnection } from "@/lib/types";

export function ConnectionCardMetrics({
  monitoringConnection,
  monitoringLoading,
}: {
  monitoringConnection: MonitoringModelConnection | undefined;
  monitoringLoading: boolean;
}) {
  if (monitoringLoading && !monitoringConnection) {
    return (
      <div className="pt-1" data-testid="connection-monitoring-placeholder">
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

  return (
    <div className="pt-1">
      <MonitoringProbeHistoryStrip
        history={monitoringConnection.recent_history}
        showLegend={false}
        title={null}
      />
    </div>
  );
}
