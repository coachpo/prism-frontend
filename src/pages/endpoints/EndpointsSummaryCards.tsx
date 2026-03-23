import { Boxes, Link2, Sparkles } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";

interface EndpointsSummaryCardsProps {
  endpointsCount: number;
  totalAttachedModels: number;
  uniqueAttachedModels: number;
  endpointsInUse: number;
}

export function EndpointsSummaryCards({
  endpointsCount,
  totalAttachedModels,
  uniqueAttachedModels,
  endpointsInUse,
}: EndpointsSummaryCardsProps) {
  const metricCardClassName = [
    "[&_[data-slot=metric-label]]:text-[11px]",
    "[&_[data-slot=metric-label]]:font-semibold",
    "[&_[data-slot=metric-label]]:uppercase",
    "[&_[data-slot=metric-label]]:tracking-wide",
    "[&_[data-slot=metric-value]]:font-semibold",
    "[&_[data-slot=metric-value]]:tabular-nums",
    "[&_[data-slot=icon]]:h-9",
    "[&_[data-slot=icon]]:w-9",
    "[&_[data-slot=icon]]:rounded-md",
    "[&_[data-slot=icon]]:border",
    "[&_[data-slot=icon]]:border-primary/25",
    "[&_[data-slot=icon]]:bg-primary/10",
    "[&_[data-slot=icon]]:text-primary",
  ].join(" ");

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <MetricCard
        label="Configured Endpoints"
        value={endpointsCount}
        icon={<Boxes className="h-4 w-4" />}
        className={metricCardClassName}
      />
      <MetricCard
        label="Attached Models"
        value={totalAttachedModels}
        icon={<Link2 className="h-4 w-4" />}
        className={metricCardClassName}
      />
      <MetricCard
        label="Unique Models In Use"
        value={uniqueAttachedModels}
        detail={`${endpointsInUse} of ${endpointsCount} endpoints mapped`}
        icon={<Sparkles className="h-4 w-4" />}
        className={`${metricCardClassName} sm:col-span-2 lg:col-span-1 [&_[data-slot=metric-detail]]:text-[11px]`}
      />
    </div>
  );
}
