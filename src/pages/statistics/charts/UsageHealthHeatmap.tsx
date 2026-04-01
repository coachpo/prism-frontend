import * as React from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLocale } from "@/i18n/useLocale";
import type { UsageServiceHealthCell } from "@/lib/types";

interface UsageHealthHeatmapProps {
  cells: UsageServiceHealthCell[];
  days?: number;
  intervalMinutes?: number;
}

const CELL_SIZE_PX = 12;
const CELL_GAP_PX = 4;
const AVAILABILITY_PALETTE = [
  "rgb(203, 213, 225)",
  "rgb(239, 68, 68)",
  "rgb(250, 204, 21)",
  "rgb(142, 201, 58)",
  "rgb(34, 197, 94)",
];

type HeatmapCell = {
  bucket: UsageServiceHealthCell;
  key: string;
  label: string;
  level: number;
};

export function UsageHealthHeatmap({ cells, days, intervalMinutes }: UsageHealthHeatmapProps) {
  const { formatNumber, locale, messages } = useLocale();

  const statusLabels: Record<UsageServiceHealthCell["status"], string> = {
    degraded: messages.statistics.healthStatusDegraded,
    down: messages.statistics.healthStatusDown,
    empty: messages.statistics.healthStatusIdle,
    ok: messages.statistics.healthStatusOk,
  };

  const rows = React.useMemo(
    () => buildHeatmapRows({ cells, days, intervalMinutes, locale }),
    [cells, days, intervalMinutes, locale],
  );

  return (
    <div className="space-y-3" data-testid="usage-health-heatmap">
      <div className="space-y-3" data-testid="usage-health-heatmap-calendar">
        <ScrollArea className="w-full" data-testid="usage-health-grid-scroll">
          <div className="min-w-max px-1 py-2">
            <TooltipProvider delayDuration={0} disableHoverableContent>
              <section
                aria-label={messages.statistics.serviceHealthTitle}
                className="flex flex-col"
                data-testid="usage-health-grid"
                style={{ gap: `${CELL_GAP_PX}px` }}
              >
                {rows.map((row) => (
                  <div
                    className="flex flex-row"
                    data-testid="usage-health-row"
                    key={row[0]?.key ?? "usage-health-row"}
                    style={{ gap: `${CELL_GAP_PX}px` }}
                  >
                    {row.map((cell) => (
                      <Tooltip key={cell.key}>
                        <TooltipTrigger asChild>
                          <button
                            aria-label={`${cell.label} ${statusLabels[cell.bucket.status]} ${formatAvailabilityLine(cell.bucket, formatNumber, messages.statistics.availability)}`}
                            className="rounded-[3px] outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            data-level={String(cell.level)}
                            data-status={cell.bucket.status}
                            data-testid="usage-health-cell"
                            style={{
                              backgroundColor: AVAILABILITY_PALETTE[clampLevel(cell.level, AVAILABILITY_PALETTE.length)],
                              height: CELL_SIZE_PX,
                              width: CELL_SIZE_PX,
                            }}
                            type="button"
                          />
                        </TooltipTrigger>
                        <TooltipContent data-testid="usage-health-tooltip" side="top" sideOffset={6}>
                          <div className="space-y-1.5">
                            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-background/80">
                              {cell.label}
                              {intervalMinutes ? ` · ${formatIntervalLabel(intervalMinutes, messages)}` : ""}
                            </p>
                            <p className="font-medium text-background/90">{statusLabels[cell.bucket.status]}</p>
                            <p className="font-medium">
                              {formatAvailabilityLine(cell.bucket, formatNumber, messages.statistics.availability)}
                            </p>
                            <p>
                              {messages.statistics.requests} {formatNumber(cell.bucket.request_count)}
                            </p>
                            <p>
                              {messages.statistics.successfulCount(formatNumber(cell.bucket.success_count))} · {" "}
                              {messages.statistics.failedCount(formatNumber(cell.bucket.failed_count))}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                ))}
              </section>
            </TooltipProvider>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <div className="min-w-35" data-testid="usage-health-legend">
          <div className="mb-2 text-xs text-muted-foreground">
            <span data-testid="usage-health-legend-less">{messages.statistics.heatmapLegendLessAvailability}</span>
            <span aria-hidden> → </span>
            <span data-testid="usage-health-legend-more">{messages.statistics.heatmapLegendMoreAvailability}</span>
          </div>

          <div className="flex items-center" style={{ gap: `${CELL_GAP_PX}px` }}>
            {AVAILABILITY_PALETTE.map((color, level) => (
              <div
                aria-hidden="true"
                className="rounded-[3px]"
                data-level={String(level)}
                data-testid="usage-health-legend-swatch"
                key={`usage-health-legend-${color}`}
                style={{
                  backgroundColor: color,
                  height: CELL_SIZE_PX,
                  width: CELL_SIZE_PX,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function buildHeatmapRows({
  cells,
  days,
  intervalMinutes,
  locale,
}: {
  cells: UsageServiceHealthCell[];
  days?: number;
  intervalMinutes?: number;
  locale: string;
}) {
  const uniqueDayCount = new Set(cells.map((cell) => formatUtcDayKey(cell.bucket_start))).size;
  const dayCount = normalizePositiveInteger(days, uniqueDayCount || 1);
  const resolvedIntervalMinutes = normalizeIntervalMinutes(intervalMinutes);
  const bucketCountPerDay = Math.max(1, Math.round((24 * 60) / resolvedIntervalMinutes));
  const lastBucketStart = [...cells]
    .map((cell) => normalizeBucketStart(cell.bucket_start))
    .sort((leftBucket, rightBucket) => leftBucket.localeCompare(rightBucket))
    .at(-1);
  const anchorDay = startOfUtcDay(lastBucketStart ? new Date(lastBucketStart) : new Date());
  const firstDay = addUtcDays(anchorDay, -(dayCount - 1));
  const cellsByBucket = new Map(cells.map((cell) => [normalizeBucketStart(cell.bucket_start), cell] as const));

  return Array.from({ length: dayCount }, (_, dayIndex) => {
    const dayStart = addUtcDays(firstDay, dayIndex);

    return Array.from({ length: bucketCountPerDay }, (_, bucketIndex) => {
      const bucketStart = normalizeBucketStart(
        new Date(dayStart.getTime() + bucketIndex * resolvedIntervalMinutes * 60_000).toISOString(),
      );
      const bucket =
        cellsByBucket.get(bucketStart) ?? {
          availability_percentage: null,
          bucket_start: bucketStart,
          failed_count: 0,
          request_count: 0,
          status: "empty" as const,
          success_count: 0,
        };

      return {
        bucket,
        key: bucket.bucket_start,
        label: formatBucketLabel(bucket.bucket_start, locale),
        level: resolveAvailabilityLevel(bucket.availability_percentage),
      } satisfies HeatmapCell;
    });
  });
}

function clampLevel(level: number, levelCount: number) {
  return Math.max(0, Math.min(levelCount - 1, level));
}

function resolveAvailabilityLevel(availabilityPercentage: number | null) {
  if (availabilityPercentage === null || availabilityPercentage === undefined) {
    return 0;
  }

  if (availabilityPercentage <= 0) {
    return 1;
  }

  if (availabilityPercentage < 50) {
    return 2;
  }

  if (availabilityPercentage < 100) {
    return 3;
  }

  return 4;
}

function formatAvailabilityLine(
  cell: UsageServiceHealthCell,
  formatNumber: ReturnType<typeof useLocale>["formatNumber"],
  availabilityLabel: string,
) {
  if (cell.availability_percentage === null || cell.availability_percentage === undefined) {
    return `${availabilityLabel} —`;
  }

  return `${availabilityLabel} ${formatNumber(cell.availability_percentage, {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  })}%`;
}

function formatBucketLabel(bucketStart: string, locale: string) {
  const date = new Date(bucketStart);

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

function formatIntervalLabel(intervalMinutes: number, messages: ReturnType<typeof useLocale>["messages"]) {
  if (intervalMinutes % 60 === 0) {
    return messages.statistics.serviceHealthIntervalHours(intervalMinutes / 60);
  }

  return messages.statistics.serviceHealthIntervalMinutes(intervalMinutes);
}

function formatUtcDayKey(bucketStart: string) {
  return bucketStart.slice(0, 10);
}

function normalizeBucketStart(bucketStart: string) {
  return new Date(bucketStart).toISOString().replace(".000Z", "Z");
}

function normalizeIntervalMinutes(value?: number) {
  if (!value || !Number.isFinite(value) || value <= 0) {
    return 24 * 60;
  }

  return Math.max(1, Math.floor(value));
}

function normalizePositiveInteger(value: number | undefined, fallback: number) {
  if (!value || !Number.isFinite(value) || value <= 0) {
    return fallback;
  }

  return Math.max(1, Math.floor(value));
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date: Date, dayOffset: number) {
  return new Date(date.getTime() + dayOffset * 24 * 60 * 60_000);
}
