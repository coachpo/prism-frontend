import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLocale } from "@/i18n/useLocale";
import type { MonitoringConnectionHistoryPoint } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MonitoringProbeHistoryStripProps {
  columns?: number;
  history: MonitoringConnectionHistoryPoint[];
  rows?: number;
  showLegend?: boolean;
  title?: string | null;
}

const DEFAULT_PROBE_GRID_COLUMNS = 60;
const DEFAULT_PROBE_GRID_ROWS = 1;

export function MonitoringProbeHistoryStrip({
  columns = DEFAULT_PROBE_GRID_COLUMNS,
  history,
  rows = DEFAULT_PROBE_GRID_ROWS,
  showLegend = true,
  title,
}: MonitoringProbeHistoryStripProps) {
  const { locale, messages } = useLocale();
  const copy = messages.monitoring;
  const resolvedColumns = normalizeGridDimension(columns, DEFAULT_PROBE_GRID_COLUMNS);
  const resolvedRows = normalizeGridDimension(rows, DEFAULT_PROBE_GRID_ROWS);
  const gridCellCount = resolvedColumns * resolvedRows;
  const sortedHistory = [...history]
    .sort((left, right) => left.checked_at.localeCompare(right.checked_at))
    .slice(-gridCellCount);
  const resolvedTitle = title === undefined ? copy.past60ProbesTitle : title;
  const paddedHistory = [
    ...Array.from({ length: Math.max(gridCellCount - sortedHistory.length, 0) }, (_, index) => ({
      kind: "no-data" as const,
      key: `no-data-${index}`,
    })),
    ...sortedHistory.map((point) => ({
      kind: "history" as const,
      key: point.checked_at,
      point,
    })),
  ];

  const statusLabels: Record<ProbeCellStatus, string> = {
    degraded: copy.probeStatusDegraded,
    down: copy.probeStatusDown,
    "no-data": copy.probeStatusNoData,
    ok: copy.probeStatusOk,
  };
  const stripLabel = resolvedTitle ?? copy.past60ProbesTitle;

  return (
    <div className="space-y-2.5">
      {resolvedTitle || showLegend ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {resolvedTitle ? (
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {resolvedTitle}
            </span>
          ) : (
            <span />
          )}
          {showLegend ? (
            <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
              <LegendBadge label={copy.probeStatusNoData} status="no-data" />
              <LegendBadge label={copy.probeStatusOk} status="ok" />
              <LegendBadge label={copy.probeStatusDegraded} status="degraded" />
              <LegendBadge label={copy.probeStatusDown} status="down" />
            </div>
          ) : null}
        </div>
      ) : null}

      <TooltipProvider delayDuration={0} disableHoverableContent>
        <ul
          aria-label={stripLabel}
          className="grid list-none gap-1 rounded-xl border border-border/60 bg-muted/20 p-2"
          data-testid="monitoring-probe-strip"
          style={{
            gridTemplateColumns: `repeat(${resolvedColumns}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${resolvedRows}, minmax(0, 1fr))`,
          }}
        >
          {paddedHistory.map((cell) => {
            const probeStatus = cell.kind === "no-data" ? "no-data" : getProbeStatus(cell.point);
            const detailLines =
              cell.kind === "no-data"
                ? [copy.probeStatusNoData]
                : [
                    copy.probeTooltipPingStatus(getMeasurementStatusLabel(cell.point.endpoint_ping_status, copy)),
                    cell.point.endpoint_ping_ms == null
                      ? null
                      : copy.probeTooltipPingTime(formatProbeDuration(cell.point.endpoint_ping_ms)),
                    copy.probeTooltipConversationStatus(
                      getMeasurementStatusLabel(cell.point.conversation_status, copy),
                    ),
                    cell.point.conversation_delay_ms == null
                      ? null
                      : copy.probeTooltipConversationLatency(formatProbeDuration(cell.point.conversation_delay_ms)),
                    cell.point.failure_kind ? copy.probeTooltipFailureKind(cell.point.failure_kind) : null,
                  ].filter(Boolean);
            const bucketLabel = cell.kind === "no-data" ? null : formatBucketLabel(cell.point.checked_at, locale);
            const ariaLabel = bucketLabel
              ? `${stripLabel} ${bucketLabel} ${statusLabels[probeStatus]}`
              : `${stripLabel} ${statusLabels[probeStatus]}`;

            return (
              <Tooltip key={cell.key}>
                <TooltipTrigger asChild>
                  <li
                    aria-label={ariaLabel}
                    className={cn(
                      "h-4 min-w-0 w-full rounded-[4px] border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
                      getProbeToneClass(probeStatus),
                    )}
                    data-status={probeStatus}
                    data-testid={`monitoring-probe-cell-${probeStatus}`}
                    tabIndex={-1}
                  />
                </TooltipTrigger>
                <TooltipContent
                  className="max-w-56 rounded-lg border border-border/60 bg-card px-3 py-2 text-card-foreground shadow-xl"
                  sideOffset={6}
                >
                  <div className="space-y-1.5">
                    {bucketLabel ? (
                      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        {bucketLabel}
                      </p>
                    ) : null}
                    <p className="font-medium text-muted-foreground">{statusLabels[probeStatus]}</p>
                    {detailLines.map((line) => (
                      <p key={`${cell.key}:${line}`}>{line}</p>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </ul>
      </TooltipProvider>
    </div>
  );
}

type ProbeCellStatus = "ok" | "degraded" | "down" | "no-data";

function getMeasurementStatusLabel(
  status: MonitoringConnectionHistoryPoint["endpoint_ping_status"] | MonitoringConnectionHistoryPoint["conversation_status"],
  copy: ReturnType<typeof useLocale>["messages"]["monitoring"],
) {
  if (status === "healthy") {
    return copy.probeStatusOk;
  }

  if (status === "degraded") {
    return copy.probeStatusDegraded;
  }

  return copy.probeStatusDown;
}

function formatProbeDuration(value: number | null) {
  return `${value} ms`;
}

function LegendBadge({
  label,
  status,
}: {
  label: string;
  status: ProbeCellStatus;
}) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5",
        status === "no-data" && "border-border/70 bg-muted/40 text-muted-foreground",
        status === "ok" && "border-success/40 bg-success/10 text-success",
        status === "degraded" && "border-warning/40 bg-warning/15 text-warning-foreground dark:text-warning",
        status === "down" && "border-destructive/40 bg-destructive/10 text-destructive",
      )}
    >
      {label}
    </span>
  );
}

function formatBucketLabel(bucketStart: string, locale: string) {
  const date = new Date(bucketStart);

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(date);
}

function getProbeStatus(point: MonitoringConnectionHistoryPoint): "ok" | "degraded" | "down" {
  if (
    point.failure_kind ||
    point.endpoint_ping_status === "failed" ||
    point.conversation_status === "failed"
  ) {
    return "down";
  }

  if (
    point.endpoint_ping_status === "degraded" ||
    point.conversation_status === "degraded"
  ) {
    return "degraded";
  }

  return "ok";
}

function normalizeGridDimension(value: number, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(1, Math.floor(value));
}

function getProbeToneClass(status: ProbeCellStatus) {
  if (status === "no-data") {
    return "border-border/70 bg-muted/45 hover:bg-muted/60 focus-visible:bg-muted/60";
  }

  if (status === "ok") {
    return "border-success/60 bg-success/80 hover:bg-success/90 focus-visible:bg-success/90";
  }

  if (status === "degraded") {
    return "border-warning/60 bg-warning/75 hover:bg-warning/85 focus-visible:bg-warning/85";
  }

  return "border-destructive/60 bg-destructive/70 hover:bg-destructive/80 focus-visible:bg-destructive/80";
}
