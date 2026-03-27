import { ActivitySquare } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useLocale } from "@/i18n/useLocale";
import type { UsageServiceHealth } from "@/lib/types";
import { UsageSparkline } from "../charts/UsageSparkline";

interface UsageServiceHealthSectionProps {
  serviceHealth: UsageServiceHealth;
}

export function UsageServiceHealthSection({ serviceHealth }: UsageServiceHealthSectionProps) {
  const { formatNumber, messages } = useLocale();

  const sparkline = serviceHealth.daily.map((point) => ({
    label: point.bucket_start,
    value: point.availability_percentage ?? 0,
  }));

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">{messages.statistics.serviceHealthTitle}</h2>
        <p className="text-sm text-muted-foreground">
          {messages.statistics.requests} {formatNumber(serviceHealth.request_count)} · {messages.statistics.successRate} {serviceHealth.availability_percentage?.toFixed(1) ?? "—"}%
        </p>
      </div>

      <Card className="border-border/70 bg-card/95 shadow-none">
        <CardHeader className="border-b border-border/60 pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-base font-semibold tracking-tight">{messages.statistics.availability}</h3>
              <p className="text-sm text-muted-foreground">{messages.statistics.health}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-semibold tracking-tight">
                {serviceHealth.availability_percentage?.toFixed(1) ?? "—"}%
              </p>
              <p className="text-xs text-muted-foreground">
                {formatNumber(serviceHealth.success_count)} / {formatNumber(serviceHealth.request_count)}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)]">
          {sparkline.length > 0 ? (
            <UsageSparkline
              ariaLabel={messages.statistics.serviceHealthTitle}
              className="h-24 w-full"
              color="var(--color-chart-2)"
              points={sparkline}
            />
          ) : (
            <EmptyState
              className="py-8"
              description={messages.statistics.noDataAvailable}
              icon={<ActivitySquare className="h-6 w-6" />}
              title={messages.statistics.serviceHealthTitle}
            />
          )}

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-xl border border-border/60 bg-muted/25 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{messages.statistics.requests}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{formatNumber(serviceHealth.request_count)}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/25 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{messages.statistics.successOnly}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{formatNumber(serviceHealth.success_count)}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/25 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{messages.statistics.errors}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{formatNumber(serviceHealth.failed_count)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
