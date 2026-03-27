import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Messages } from "@/i18n/messages/en";
import { useLocale } from "@/i18n/useLocale";
import type { UsageSnapshotPreset } from "@/lib/types";

type StatisticsMessages = Messages["statistics"];

const TIME_RANGE_LABELS: Record<
  UsageSnapshotPreset,
  (messages: { statistics: StatisticsMessages }) => string
> = {
  all: (messages) => messages.statistics.allTime,
  "7d": (messages) => messages.statistics.last7Days,
  "24h": (messages) => messages.statistics.last24Hours,
  "7h": (messages) => messages.statistics.last7Hours,
};

interface UsageControlsBarProps {
  generatedAt: string | null;
  loading: boolean;
  onExportSnapshot: () => void;
  onRefresh: () => void;
  onSelectTimeRange: (preset: UsageSnapshotPreset) => void;
  selectedTimeRange: UsageSnapshotPreset;
}

export function UsageControlsBar({
  generatedAt,
  loading,
  onExportSnapshot,
  onRefresh,
  onSelectTimeRange,
  selectedTimeRange,
}: UsageControlsBarProps) {
  const { formatRelativeTimeFromNow, messages } = useLocale();

  return (
    <Card className="border-border/70 bg-card/95 shadow-none">
      <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "7h", "24h", "7d"] as const).map((preset) => (
            <Button
              key={preset}
              onClick={() => onSelectTimeRange(preset)}
              size="sm"
              variant={selectedTimeRange === preset ? "default" : "outline"}
            >
              {TIME_RANGE_LABELS[preset](messages)}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <p className="mr-2 text-sm text-muted-foreground">
            {messages.statistics.updated} {generatedAt ? formatRelativeTimeFromNow(generatedAt) : "—"}
          </p>
          <Button onClick={onExportSnapshot} size="sm" variant="outline">
            <Download className="mr-2 h-4 w-4" />
            {messages.statistics.exportSnapshotJson}
          </Button>
          <Button
            aria-label={messages.statistics.refreshUsageStatistics}
            disabled={loading}
            onClick={onRefresh}
            size="sm"
            title={messages.statistics.refreshUsageStatistics}
            variant="outline"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {messages.statistics.refreshUsageStatistics}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
