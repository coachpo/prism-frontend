import { Link } from "react-router-dom";
import { Activity, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, ValueBadge } from "@/components/StatusBadge";
import type { MonitoringOverviewVendor } from "@/lib/types";
import { useLocale } from "@/i18n/useLocale";

interface MonitoringOverviewGroupsProps {
  vendors: MonitoringOverviewVendor[];
}

export function MonitoringOverviewGroups({ vendors }: MonitoringOverviewGroupsProps) {
  const { formatNumber, messages } = useLocale();
  const copy = messages.monitoring;

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
          <div className="grid gap-4 xl:grid-cols-2">
            {vendors.map((vendor) => (
              <Link
                key={vendor.vendor_id}
                className="rounded-lg border bg-card p-4 transition-colors hover:bg-muted/30"
                to={`/monitoring/vendors/${vendor.vendor_id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h2 className="text-sm font-semibold">{vendor.vendor_name}</h2>
                    <p className="text-xs text-muted-foreground">{vendor.vendor_key}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <ValueBadge label={copy.modelCount(formatNumber(vendor.model_count))} intent="info" />
                  <ValueBadge label={copy.connectionCount(formatNumber(vendor.connection_count))} intent="accent" />
                  <StatusBadge label={copy.healthyCount(formatNumber(vendor.healthy_connection_count))} intent="success" />
                  <StatusBadge label={copy.degradedCount(formatNumber(vendor.degraded_connection_count))} intent="warning" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
