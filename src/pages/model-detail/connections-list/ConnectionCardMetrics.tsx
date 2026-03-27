import { Info, Route } from "lucide-react";
import { useLocale } from "@/i18n/useLocale";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatLatencyForDisplay, type ConnectionDerivedMetrics } from "../modelDetailMetricsAndPaths";
import type { FormatTime } from "./connectionCardTypes";
import { ConnectionCardMetricTile } from "./ConnectionCardMetricTile";

export function ConnectionCardMetrics({
  formatTime,
  metrics24h,
}: {
  formatTime: FormatTime;
  metrics24h: ConnectionDerivedMetrics | undefined;
}) {
  const { messages } = useLocale();
  const copy = messages.modelDetail;
  const successRate = metrics24h?.success_rate_24h ?? null;

  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <span>{copy.successRate24h}</span>
        <span className="text-[10px]">{copy.successRateSample((metrics24h?.request_count_24h ?? 0).toLocaleString())}</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5" />
            </TooltipTrigger>
            <TooltipContent className="pointer-events-none">
              <p className="text-xs">{copy.successRateTooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="block rounded-sm">
        <div className="flex items-center gap-2 pt-0.5">
          <Progress
            value={successRate ?? 0}
            className={cn(
              "h-1.5",
              successRate === null
                ? "[&>[data-slot=progress-indicator]]:bg-muted-foreground/40"
                : successRate >= 95
                  ? "[&>[data-slot=progress-indicator]]:bg-emerald-500"
                  : successRate >= 80
                    ? "[&>[data-slot=progress-indicator]]:bg-amber-500"
                    : "[&>[data-slot=progress-indicator]]:bg-red-500",
            )}
          />
          <span
            className={cn(
              "shrink-0 text-[10px] font-medium tabular-nums",
              successRate === null
                ? "text-muted-foreground"
                : successRate >= 95
                  ? "text-emerald-600 dark:text-emerald-400"
                  : successRate >= 80
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-red-600 dark:text-red-400",
            )}
          >
            {successRate === null ? "-" : `${successRate.toFixed(1)}%`}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <ConnectionCardMetricTile
          label={copy.p95Latency24h}
          value={formatLatencyForDisplay(metrics24h?.p95_latency_ms ?? null)}
        />
        <ConnectionCardMetricTile
          label={copy.sampled5xxRate}
          value={
            metrics24h?.five_xx_rate === null || metrics24h?.five_xx_rate === undefined
              ? "-"
              : `${metrics24h.five_xx_rate.toFixed(1)}%`
          }
        />
      </div>

      <div className="rounded border border-dashed px-2 py-1.5 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <Route className="h-3.5 w-3.5" />
          {copy.failoverSignals}
        </div>
        <div className="mt-1 flex items-center gap-3">
          <span>{copy.failoverEvents(String(metrics24h?.heuristic_failover_events ?? 0))}</span>
          <span>
            {copy.failoverLast(metrics24h?.last_failover_like_at ? formatTime(metrics24h.last_failover_like_at) : "-")}
          </span>
        </div>
      </div>
    </div>
  );
}
