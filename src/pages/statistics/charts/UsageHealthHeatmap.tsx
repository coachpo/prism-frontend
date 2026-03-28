import { useMemo } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLocale } from "@/i18n/useLocale";
import { cn } from "@/lib/utils";
import type { UsageServiceHealthCell } from "@/lib/types";

interface UsageHealthHeatmapProps {
  cells: UsageServiceHealthCell[];
  intervalMinutes?: number;
}

const STATUS_STYLES: Record<UsageServiceHealthCell["status"], string> = {
  degraded: "border-warning/60 bg-warning/75 hover:bg-warning/85 focus-visible:bg-warning/85",
  down: "border-destructive/60 bg-destructive/70 hover:bg-destructive/80 focus-visible:bg-destructive/80",
  empty: "border-border/70 bg-muted/45 hover:bg-muted/65 focus-visible:bg-muted/65",
  ok: "border-success/60 bg-success/80 hover:bg-success/90 focus-visible:bg-success/90",
};

function formatUtcDayKey(bucketStart: string) {
  return bucketStart.slice(0, 10);
}

export function UsageHealthHeatmap({ cells, intervalMinutes }: UsageHealthHeatmapProps) {
  const { formatNumber, locale, messages } = useLocale();
  const statusLabels: Record<UsageServiceHealthCell["status"], string> = {
    degraded: messages.statistics.healthStatusDegraded,
    down: messages.statistics.healthStatusDown,
    empty: messages.statistics.healthStatusIdle,
    ok: messages.statistics.healthStatusOk,
  };

  const groupedRows = useMemo(() => {
    const groups = new Map<string, UsageServiceHealthCell[]>();

    for (const cell of cells) {
      const dayKey = formatUtcDayKey(cell.bucket_start);
      const group = groups.get(dayKey);

      if (group) {
        group.push(cell);
      } else {
        groups.set(dayKey, [cell]);
      }
    }

    return [...groups.entries()]
      .sort(([leftDayKey], [rightDayKey]) => leftDayKey.localeCompare(rightDayKey))
      .map(([dayKey, dayCells]) => ({
        cells: [...dayCells].sort((leftCell, rightCell) => leftCell.bucket_start.localeCompare(rightCell.bucket_start)),
        dayKey,
      }));
  }, [cells]);

  const maxColumns = Math.max(...groupedRows.map((row) => row.cells.length), 1);
  const isEnglish = locale.toLowerCase().startsWith("en");

  const formatDayLabel = (dayKey: string) => {
    const date = new Date(`${dayKey}T00:00:00Z`);

    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      weekday: "short",
    }).format(date);
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
    <TooltipProvider delayDuration={0}>
      <div className="space-y-3" data-testid="usage-health-heatmap">
        {groupedRows.map((row) => (
          <div className="grid gap-2 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-center" data-testid="usage-health-day-row" key={row.dayKey}>
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {formatDayLabel(row.dayKey)}
            </div>

            <div
              className="grid gap-1"
              data-testid="usage-health-strip-grid"
              style={{ gridTemplateColumns: `repeat(${maxColumns}, minmax(0, 1fr))` }}
            >
              {row.cells.map((cell) => {
                const availabilityText = `${messages.statistics.availability} ${cell.availability_percentage?.toFixed(1) ?? "—"}%`;
                const requestText = isEnglish
                  ? `${formatNumber(cell.request_count)} ${messages.statistics.requests.toLowerCase()}`
                  : `${formatNumber(cell.request_count)} ${messages.statistics.requests}`;
                const outcomeText = `${messages.statistics.successfulCount(formatNumber(cell.success_count))} · ${messages.statistics.failedCount(formatNumber(cell.failed_count))}`;

                return (
                  <Tooltip key={cell.bucket_start}>
                    <TooltipTrigger asChild>
                      <button
                        aria-label={`${formatBucketLabel(cell.bucket_start)} ${availabilityText}`}
                        className={cn(
                          "h-4 min-w-0 rounded-[4px] border transition-transform duration-150 hover:-translate-y-0.5 focus-visible:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
                          STATUS_STYLES[cell.status],
                        )}
                        data-status={cell.status}
                        data-testid="usage-health-cell"
                        type="button"
                      />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-56 rounded-lg border border-border/60 bg-card px-3 py-2 text-card-foreground shadow-xl" sideOffset={6}>
                        <div className="space-y-1.5">
                          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                            {formatBucketLabel(cell.bucket_start)}
                            {intervalMinutes ? ` · ${intervalMinutes}m` : ""}
                          </p>
                          <p className="font-medium text-muted-foreground">{statusLabels[cell.status]}</p>
                          <p className="font-medium">{availabilityText}</p>
                          <p>{requestText}</p>
                          <p>{outcomeText}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}
