import { ActivitySquare } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/i18n/useLocale";
import type { UsageServiceHealth } from "@/lib/types";
import { UsageHealthHeatmap } from "../charts/UsageHealthHeatmap";

interface UsageServiceHealthSectionProps {
  serviceHealth: UsageServiceHealth;
}

export function UsageServiceHealthSection({ serviceHealth }: UsageServiceHealthSectionProps) {
  const { formatNumber, messages } = useLocale();
  const availabilityPercent =
    serviceHealth.availability_percentage === null || serviceHealth.availability_percentage === undefined
      ? "—"
      : formatNumber(serviceHealth.availability_percentage, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        });

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">{messages.statistics.serviceHealthTitle}</h2>
        <p className="text-sm text-muted-foreground">
          {messages.statistics.requests} {formatNumber(serviceHealth.request_count)} · {messages.statistics.successRate} {availabilityPercent}%
        </p>
      </div>

      <Card className="border-border/70 bg-card/95 shadow-none">
        <CardHeader className="border-b border-border/60 pb-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-3">
              <div className="space-y-1">
                <CardTitle className="text-base tracking-tight">{messages.statistics.availability}</CardTitle>
                <CardDescription>{messages.statistics.health}</CardDescription>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground" data-testid="usage-health-legend">
                <span className="rounded-full border border-success/40 bg-success/10 px-2.5 py-1 text-success">
                  {messages.statistics.healthStatusOk}
                </span>
                <span className="rounded-full border border-warning/40 bg-warning/15 px-2.5 py-1 text-warning-foreground dark:text-warning">
                  {messages.statistics.healthStatusDegraded}
                </span>
                <span className="rounded-full border border-destructive/40 bg-destructive/10 px-2.5 py-1 text-destructive">
                  {messages.statistics.healthStatusDown}
                </span>
                <span className="rounded-full border border-border/70 bg-muted/40 px-2.5 py-1">
                  {messages.statistics.healthStatusIdle}
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[26rem]">
              <div className="rounded-xl border border-border/60 bg-muted/25 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{messages.statistics.availability}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">
                  {availabilityPercent}%
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/25 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{messages.statistics.requests}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">{formatNumber(serviceHealth.request_count)}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/25 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{messages.statistics.errors}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">{formatNumber(serviceHealth.failed_count)}</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {serviceHealth.cells && serviceHealth.cells.length > 0 ? (
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 sm:p-4" data-testid="usage-health-strip">
              <UsageHealthHeatmap
                cells={serviceHealth.cells}
                intervalMinutes={serviceHealth.interval_minutes}
              />
            </div>
          ) : (
            <EmptyState
              className="py-8"
              description={messages.statistics.noDataAvailable}
              icon={<ActivitySquare className="h-6 w-6" />}
              title={messages.statistics.serviceHealthTitle}
            />
          )}
        </CardContent>
      </Card>
    </section>
  );
}
