import { ChevronDown, Filter, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/i18n/useLocale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { RequestLogPageActions } from "./useRequestLogPageState";
import {
  LATENCY_BUCKET_OPTIONS,
  OUTCOME_OPTIONS,
  STREAM_OPTIONS,
  VIEW_OPTIONS,
} from "./queryParams";
import { LATENCY_LABELS } from "./FiltersBar.constants";

interface FiltersBarSecondaryFiltersProps {
  actions: Pick<
    RequestLogPageActions,
    | "setBillableOnly"
    | "setLatencyBucket"
    | "setOutcomeFilter"
    | "setPricedOnly"
    | "setSpecialTokenFilter"
    | "setStreamFilter"
    | "setTokenMax"
    | "setTokenMin"
    | "setTriage"
    | "setView"
  >;
  localRefinementOpen: boolean;
  onLocalRefinementOpenChange: (open: boolean) => void;
  state: Pick<
    RequestLogPageActions["state"],
    | "billable_only"
    | "latency_bucket"
    | "outcome_filter"
    | "priced_only"
    | "special_token_filter"
    | "stream_filter"
    | "token_max"
    | "token_min"
    | "triage"
    | "view"
  >;
}

function ToolbarLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </Label>
  );
}

export function FiltersBarSecondaryFilters({
  actions,
  localRefinementOpen,
  onLocalRefinementOpenChange,
  state,
}: FiltersBarSecondaryFiltersProps) {
  const { messages } = useLocale();

  return (
    <Collapsible open={localRefinementOpen} onOpenChange={onLocalRefinementOpenChange}>
      <div className="rounded-xl border border-dashed border-border/70 bg-muted/25 p-3">
        <CollapsibleTrigger className="mb-0 flex w-full items-center justify-between gap-3 rounded-lg px-1 py-1 text-left transition-colors hover:bg-muted/40">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>{messages.requestLogs.localRefinement}</span>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              localRefinementOpen && "rotate-180",
            )}
          />
        </CollapsibleTrigger>

        <CollapsibleContent className="pt-3">
          <div className="grid gap-3 xl:grid-cols-[1.1fr_1fr_1fr_1fr_1.2fr_1fr]">
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
                      {latencyBucket === "all"
                        ? messages.requestLogs.anyLatency
                        : LATENCY_LABELS[latencyBucket]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <ToolbarLabel>{messages.requestLogs.specialTokens}</ToolbarLabel>
              <Select
                value={state.special_token_filter || "__none__"}
                onValueChange={(value) =>
                  actions.setSpecialTokenFilter(value === "__none__" ? "" : value)
                }
              >
                <SelectTrigger className="h-9 rounded-lg border-border/70 bg-background/80 text-xs">
                  <SelectValue placeholder={messages.requestLogs.any} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{messages.requestLogs.any}</SelectItem>
                  <SelectItem value="cache_read">{messages.requestLogs.cacheRead}</SelectItem>
                  <SelectItem value="cache_creation">{messages.requestLogs.cacheCreation}</SelectItem>
                  <SelectItem value="reasoning">{messages.requestLogs.reasoning}</SelectItem>
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

            <div>
              <ToolbarLabel>{messages.requestLogs.view}</ToolbarLabel>
              <Select
                value={state.view}
                onValueChange={(value) => actions.setView(value as typeof state.view)}
              >
                <SelectTrigger className="h-9 rounded-lg border-border/70 bg-background/80 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VIEW_OPTIONS.map((view) => (
                    <SelectItem key={view} value={view} className="capitalize">
                      {view === "all" ? messages.requestLogs.allColumns : messages.requestLogs.compact}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant={state.priced_only ? "default" : "outline"}
              size="sm"
              className="h-8 rounded-full px-3 text-xs"
              onClick={() => actions.setPricedOnly(!state.priced_only)}
            >
              {messages.requestLogs.pricedOnly}
            </Button>
            <Button
              variant={state.billable_only ? "default" : "outline"}
              size="sm"
              className="h-8 rounded-full px-3 text-xs"
              onClick={() => actions.setBillableOnly(!state.billable_only)}
            >
              {messages.requestLogs.billableOnly}
            </Button>
            <Button
              variant={state.triage ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-8 rounded-full px-3 text-xs",
                state.triage &&
                  "border-amber-500/60 bg-amber-500 text-amber-950 hover:bg-amber-400",
              )}
              onClick={() => actions.setTriage(!state.triage)}
            >
              <Filter className="mr-1.5 h-3 w-3" />
              {messages.requestLogs.triage}
            </Button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
