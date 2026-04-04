import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { VendorIcon } from "@/components/VendorIcon";
import { CompactMetricTile } from "@/components/CompactMetricTile";
import type {
  MonitoringOverviewVendor,
} from "@/lib/types";
import { useLocale } from "@/i18n/useLocale";

interface MonitoringOverviewGroupsProps {
  vendors: MonitoringOverviewVendor[];
}

export function MonitoringOverviewGroups({ vendors }: MonitoringOverviewGroupsProps) {
  const { formatNumber, messages } = useLocale();
  const copy = messages.monitoring;

  return (
    vendors.length === 0 ? (
      <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        {copy.noVendorMonitoringData}
      </div>
    ) : (
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">{copy.vendorGroupsTitle}</h2>
          <p className="text-sm text-muted-foreground">{copy.vendorGroupsDescription}</p>
        </div>
        {vendors.map((vendor) => (
          <Link
            key={vendor.vendor_id}
            to={`/monitoring/vendors/${vendor.vendor_id}`}
            className="block rounded-xl border border-border/70 bg-card/95 transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <VendorIcon
                      vendor={{ key: vendor.vendor_key, name: vendor.vendor_name, icon_key: vendor.icon_key }}
                      size={20}
                      className="rounded-lg"
                    />
                    <span className="text-sm font-semibold text-foreground">{vendor.vendor_name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {copy.vendorSummary(
                      formatNumber(vendor.model_count),
                      formatNumber(vendor.connection_count),
                    )}
                  </p>
                </div>
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              </div>

              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryTile label={messages.nav.models} value={formatNumber(vendor.model_count)} />
                <SummaryTile label={copy.connections} value={formatNumber(vendor.connection_count)} />
                <SummaryTile label={messages.dashboard.routingLegendHealthy} value={formatNumber(vendor.healthy_connection_count)} />
                <SummaryTile label={messages.dashboard.routingLegendDegraded} value={formatNumber(vendor.degraded_connection_count)} />
              </div>
            </div>
          </Link>
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
