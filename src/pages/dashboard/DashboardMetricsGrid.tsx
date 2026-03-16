import { Activity, DollarSign, Server } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { formatMoneyMicros } from "@/lib/costing";
import { cn } from "@/lib/utils";
import type { DashboardMetricSnapshot } from "./useDashboardPageData";

interface DashboardMetricsGridProps {
  highlighted: boolean;
  snapshot: DashboardMetricSnapshot;
}

export function DashboardMetricsGrid({
  highlighted,
  snapshot,
}: DashboardMetricsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label="Active Models"
        value={snapshot.activeModels}
        detail={`of ${snapshot.totalModels} total configured`}
        icon={<Server className="h-4 w-4" />}
      />
      <MetricCard
        label="24h Requests"
        value={snapshot.totalRequests.toLocaleString()}
        detail={`${snapshot.successRate.toFixed(1)}% success rate`}
        icon={<Activity className="h-4 w-4" />}
        className={cn(
          "[&_[data-slot=icon]]:bg-blue-500/10 [&_[data-slot=icon]]:text-blue-500",
          snapshot.successRate < 95 && "text-amber-600",
          highlighted && "ws-value-updated"
        )}
      />
      <MetricCard
        label="30d Spending"
        value={formatMoneyMicros(snapshot.totalCost, "$")}
        detail="Estimated cost"
        icon={<DollarSign className="h-4 w-4" />}
        className={cn(
          "[&_[data-slot=icon]]:bg-emerald-500/10 [&_[data-slot=icon]]:text-emerald-500",
          highlighted && "ws-value-updated"
        )}
      />
      <MetricCard
        label="Average RPM"
        value={snapshot.averageRpm.toFixed(3)}
        detail={`${snapshot.averageRpmRequestTotal.toLocaleString()} total requests`}
        icon={<Activity className="h-4 w-4" />}
        className={cn(
          highlighted && "ws-value-updated"
        )}
      />
    </div>
  );
}
