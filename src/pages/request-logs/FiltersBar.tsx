import { Filter, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocale } from "@/i18n/useLocale";
import { cn } from "@/lib/utils";
import type { FilterOptions } from "./useRequestLogsPageData";
import type { RequestLogPageActions } from "./useRequestLogPageState";
import { FiltersBarPrimaryFilters } from "./FiltersBarPrimaryFilters";
import {
  LATENCY_BUCKET_OPTIONS,
  OUTCOME_OPTIONS,
  STREAM_OPTIONS,
} from "./queryParams";
import { getLatencyLabel } from "./FiltersBar.constants";

function ToolbarLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </Label>
  );
}

interface FiltersBarProps {
  actions: RequestLogPageActions;
  filterOptions: FilterOptions;
  filterOptionsLoaded: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function FiltersBar({ actions, filterOptions, filterOptionsLoaded, onRefresh, isRefreshing }: FiltersBarProps) {
  const { messages } = useLocale();
  const { state, hasActiveFilters } = actions;

  return (
    <Card className="border-border/70 bg-card/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/85">
      <CardContent className="space-y-3 p-4">
        <FiltersBarPrimaryFilters
          actions={actions}
          filterOptions={filterOptions}
          filterOptionsLoaded={filterOptionsLoaded}
          state={state}
        />

        <div className="grid gap-3 xl:grid-cols-[1fr_1fr_1fr_1.2fr_auto]">
          <div>
            <ToolbarLabel>{messages.requestLogs.outcome}</ToolbarLabel>
            <Select
              value={state.outcome_filter}
              onValueChange={(value) => actions.setOutcomeFilter(value as typeof state.outcome_filter)}
            >
              <SelectTrigger className="h-9 rounded-lg border-border/70 bg-background/80 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OUTCOME_OPTIONS.map((outcome) => (
                  <SelectItem key={outcome} value={outcome} className="capitalize">
                    {outcome === "all" ? messages.requestLogs.anyOutcome : outcome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <ToolbarLabel>{messages.requestLogs.stream}</ToolbarLabel>
            <Select
              value={state.stream_filter}
              onValueChange={(value) => actions.setStreamFilter(value as typeof state.stream_filter)}
            >
              <SelectTrigger className="h-9 rounded-lg border-border/70 bg-background/80 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STREAM_OPTIONS.map((stream) => (
                  <SelectItem key={stream} value={stream}>
                    {stream === "all"
                      ? messages.requestLogs.any
                      : stream === "yes"
                        ? messages.requestLogs.streaming
                        : messages.requestLogs.nonStreaming}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <ToolbarLabel>{messages.requestLogs.latency}</ToolbarLabel>
            <Select
              value={state.latency_bucket}
              onValueChange={(value) => actions.setLatencyBucket(value as typeof state.latency_bucket)}
            >
              <SelectTrigger className="h-9 rounded-lg border-border/70 bg-background/80 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LATENCY_BUCKET_OPTIONS.map((latencyBucket) => (
                  <SelectItem key={latencyBucket} value={latencyBucket}>
                    {getLatencyLabel(latencyBucket)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <ToolbarLabel>{messages.requestLogs.tokenRange}</ToolbarLabel>
            <div className="grid grid-cols-2 gap-2">
              <Input
                className="h-9 rounded-lg border-border/70 bg-background/80 text-xs"
                min={0}
                placeholder={messages.requestLogs.min}
                type="number"
                value={state.token_min}
                onChange={(event) => actions.setTokenMin(event.target.value)}
              />
              <Input
                className="h-9 rounded-lg border-border/70 bg-background/80 text-xs"
                min={0}
                placeholder={messages.requestLogs.max}
                type="number"
                value={state.token_max}
                onChange={(event) => actions.setTokenMax(event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 xl:items-end xl:justify-end">
            <Button
              variant={state.triage ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-9 rounded-full px-3 text-xs",
                state.triage &&
                  "border-amber-500/60 bg-amber-500 text-amber-950 hover:bg-amber-400",
              )}
              onClick={() => actions.setTriage(!state.triage)}
            >
              <Filter className="mr-1.5 h-3 w-3" />
              {messages.requestLogs.triage}
            </Button>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-label={messages.requestLogs.refreshRequestLogs}
              title={messages.requestLogs.refreshRequestLogs}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={actions.clearFilters}>
              <X className="h-3 w-3" />
              {messages.statistics.clearFilters}
            </Button>
          </div>
        )}

        {!hasActiveFilters && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-label={messages.requestLogs.refreshRequestLogs}
              title={messages.requestLogs.refreshRequestLogs}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
