import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocale } from "@/i18n/useLocale";
import type {
  UsageChartGranularity,
  UsageRequestTrendSeries,
  UsageStatisticsChartKey,
  UsageTokenTrendSeries,
} from "@/lib/types";
import { UsageTrendChart } from "../charts/UsageTrendChart";

interface UsageTrendsSectionProps {
  availableModelLineIds: string[];
  chartGranularity: {
    requestTrends: UsageChartGranularity;
    tokenUsageTrends: UsageChartGranularity;
  };
  onSetChartGranularity: (key: UsageStatisticsChartKey, granularity: UsageChartGranularity) => void;
  onSetSelectedModelLines: (modelIds: string[]) => void;
  requestTrendSeries: UsageRequestTrendSeries[];
  selectedModelLineIds: string[];
  tokenUsageTrendSeries: UsageTokenTrendSeries[];
}

const MAX_VISIBLE_LINES = 9;

export function UsageTrendsSection({
  availableModelLineIds,
  chartGranularity,
  onSetChartGranularity,
  onSetSelectedModelLines,
  requestTrendSeries,
  selectedModelLineIds,
  tokenUsageTrendSeries,
}: UsageTrendsSectionProps) {
  const { formatNumber, messages } = useLocale();
  const addableModelIds = useMemo(
    () => availableModelLineIds.filter((modelId) => !selectedModelLineIds.includes(modelId)),
    [availableModelLineIds, selectedModelLineIds],
  );
  const [pendingModelId, setPendingModelId] = useState<string>(addableModelIds[0] ?? "");
  const resolvedPendingModelId = addableModelIds.includes(pendingModelId)
    ? pendingModelId
    : (addableModelIds[0] ?? "");

  const handleAddLine = () => {
    if (!resolvedPendingModelId || selectedModelLineIds.length >= MAX_VISIBLE_LINES) {
      return;
    }

    onSetSelectedModelLines([...selectedModelLineIds, resolvedPendingModelId]);
  };

  const handleRemoveLine = (modelId: string) => {
    onSetSelectedModelLines(selectedModelLineIds.filter((value) => value !== modelId));
  };

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">{messages.statistics.requestTrendsTitle}</h2>
        <p className="text-sm text-muted-foreground">{messages.statistics.linesToDisplay}</p>
      </div>

      <div className="rounded-xl border border-border/70 bg-card/95 p-4 shadow-none">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-semibold tracking-tight">{messages.statistics.linesToDisplay}</h3>
              <Badge variant="outline">{messages.statistics.linesSelected(String(selectedModelLineIds.length), String(MAX_VISIBLE_LINES))}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedModelLineIds.length === 0 ? (
                <p className="text-sm text-muted-foreground">{messages.statistics.noDataAvailable}</p>
              ) : (
                selectedModelLineIds.map((modelId) => (
                  <Badge className="gap-1 px-2 py-1" key={modelId} variant="secondary">
                    {modelId}
                    <button
                      aria-label={messages.statistics.removeLine(modelId)}
                      className="rounded-full p-0.5 hover:bg-foreground/10"
                      onClick={() => handleRemoveLine(modelId)}
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select onValueChange={setPendingModelId} value={resolvedPendingModelId}>
              <SelectTrigger className="w-full min-w-56 sm:w-64">
                <SelectValue placeholder={messages.statistics.selectModelLinePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {addableModelIds.map((modelId) => (
                  <SelectItem key={modelId} value={modelId}>
                    {modelId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              disabled={!resolvedPendingModelId || selectedModelLineIds.length >= MAX_VISIBLE_LINES}
              onClick={handleAddLine}
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              {messages.statistics.addLine}
            </Button>
          </div>
        </div>
        {selectedModelLineIds.length >= MAX_VISIBLE_LINES ? (
          <p className="mt-3 text-sm text-muted-foreground">{messages.statistics.lineLimitReached}</p>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <UsageTrendChart
          description={messages.statistics.requestsPerMinuteOverTime}
          emptyDescription={messages.statistics.adjustFiltersOrTimeRange}
          emptyTitle={messages.statistics.noDataAvailable}
          formatValue={(value) => formatNumber(value, { maximumFractionDigits: 2 })}
          granularity={chartGranularity.requestTrends}
          onGranularityChange={(granularity) => onSetChartGranularity("requestTrends", granularity)}
          series={requestTrendSeries.map((series) => ({
            key: series.key,
            label: series.label,
            points: series.points.map((point) => ({
              bucket_start: point.bucket_start,
              value: point.request_count,
            })),
          }))}
          title={messages.statistics.requestTrendsTitle}
        />

        <UsageTrendChart
          description={messages.statistics.tokenThroughput}
          emptyDescription={messages.statistics.adjustFiltersOrTimeRange}
          emptyTitle={messages.statistics.noTokenUsage}
          formatValue={(value) => formatNumber(value)}
          granularity={chartGranularity.tokenUsageTrends}
          onGranularityChange={(granularity) => onSetChartGranularity("tokenUsageTrends", granularity)}
          series={tokenUsageTrendSeries.map((series) => ({
            key: series.key,
            label: series.label,
            points: series.points.map((point) => ({
              bucket_start: point.bucket_start,
              value: point.total_tokens,
            })),
          }))}
          title={messages.statistics.tokenUsageTrendsTitle}
        />
      </div>
    </section>
  );
}
