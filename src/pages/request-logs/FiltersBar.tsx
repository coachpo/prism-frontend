import { useState } from "react";
import { ChevronDown, Filter, RefreshCw, Search, SlidersHorizontal, X } from "lucide-react";
import { ProviderIcon } from "@/components/ProviderIcon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatProviderType } from "@/lib/utils";
import type { FilterOptions } from "./useRequestLogsPageData";
import type { RequestLogPageActions } from "./useRequestLogPageState";
import {
  LATENCY_BUCKET_OPTIONS,
  OUTCOME_OPTIONS,
  STREAM_OPTIONS,
  TIME_RANGE_OPTIONS,
  VIEW_OPTIONS,
} from "./queryParams";

interface FiltersBarProps {
  actions: RequestLogPageActions;
  filterOptions: FilterOptions;
  filterOptionsLoaded: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const TIME_LABELS: Record<string, string> = {
  "1h": "Last hour",
  "6h": "Last 6 hours",
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  all: "All time",
};

const LATENCY_LABELS: Record<string, string> = {
  all: "Any latency",
  fast: "< 500ms",
  normal: "500ms-2s",
  slow: "2s-5s",
  very_slow: "> 5s",
};

function ToolbarLabel({ children }: { children: React.ReactNode }) {
  return <Label className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{children}</Label>;
}

export function FiltersBar({ actions, filterOptions, filterOptionsLoaded, onRefresh, isRefreshing }: FiltersBarProps) {
  const { state, hasActiveFilters } = actions;
  const [localRefinementOpen, setLocalRefinementOpen] = useState(false);

  return (
    <Card className="border-border/70 bg-card/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/85">
      <CardContent className="space-y-4 p-4">
        <div className="grid gap-3 xl:grid-cols-6">
          <div className="xl:col-span-2">
            <ToolbarLabel>Search</ToolbarLabel>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 rounded-lg border-border/70 bg-background/80 pl-9 text-sm"
                placeholder="model, provider, path, or error"
                value={state.search}
                onChange={(e) => actions.setSearch(e.target.value)}
              />
            </div>
          </div>

          <div>
            <ToolbarLabel>Model</ToolbarLabel>
            <Select value={state.model_id || "__all__"} onValueChange={(v) => actions.setModelId(v === "__all__" ? "" : v)}>
              <SelectTrigger className="h-9 rounded-lg border-border/70 bg-background/80 text-xs">
                <SelectValue placeholder="All models" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All models</SelectItem>
                {filterOptionsLoaded &&
                  filterOptions.models.map((m) => (
                    <SelectItem key={m.model_id} value={m.model_id}>
                      {m.model_id}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <ToolbarLabel>Provider</ToolbarLabel>
            <Select value={state.provider_type || "__all__"} onValueChange={(v) => actions.setProviderType(v === "__all__" ? "" : v)}>
              <SelectTrigger className="h-9 rounded-lg border-border/70 bg-background/80 text-xs">
                <SelectValue placeholder="All providers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All providers</SelectItem>
                {filterOptionsLoaded &&
                  filterOptions.providers.map((p) => (
                    <SelectItem key={p.id} value={p.provider_type}>
                      <span className="flex items-center gap-2">
                        <ProviderIcon providerType={p.provider_type} size={14} />
                        {formatProviderType(p.provider_type)}
                      </span>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <ToolbarLabel>Endpoint</ToolbarLabel>
            <Select value={state.endpoint_id || "__all__"} onValueChange={(v) => actions.setEndpointId(v === "__all__" ? "" : v)}>
              <SelectTrigger className="h-9 rounded-lg border-border/70 bg-background/80 text-xs">
                <SelectValue placeholder="All endpoints" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All endpoints</SelectItem>
                {filterOptionsLoaded &&
                  filterOptions.endpoints.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.name || e.base_url}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <ToolbarLabel>Connection</ToolbarLabel>
            <Select value={state.connection_id || "__all__"} onValueChange={(v) => actions.setConnectionId(v === "__all__" ? "" : v)}>
              <SelectTrigger className="h-9 rounded-lg border-border/70 bg-background/80 text-xs">
                <SelectValue placeholder="All connections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All connections</SelectItem>
                {filterOptionsLoaded &&
                  filterOptions.connections.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <ToolbarLabel>Time range</ToolbarLabel>
            <Select value={state.time_range} onValueChange={(v) => actions.setTimeRange(v as typeof state.time_range)}>
              <SelectTrigger className="h-9 rounded-lg border-border/70 bg-background/80 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_RANGE_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TIME_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={onRefresh} disabled={isRefreshing}>
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={actions.clearFilters}>
              <X className="h-3 w-3" />
              Clear all
            </Button>
          </div>
        )}

        {!hasActiveFilters && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={onRefresh} disabled={isRefreshing}>
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        )}

        <Collapsible open={localRefinementOpen} onOpenChange={setLocalRefinementOpen}>
          <div className="rounded-xl border border-dashed border-border/70 bg-muted/25 p-3">
            <CollapsibleTrigger className="mb-0 flex w-full items-center justify-between gap-3 rounded-lg px-1 py-1 text-left transition-colors hover:bg-muted/40">
              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Local refinement</span>
              </div>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", localRefinementOpen && "rotate-180")} />
            </CollapsibleTrigger>

            <CollapsibleContent className="pt-3">
              <div className="grid gap-3 xl:grid-cols-[1.1fr_1fr_1fr_1fr_1.2fr_1fr]">
            <div>
              <ToolbarLabel>Outcome</ToolbarLabel>
              <Select value={state.outcome_filter} onValueChange={(v) => actions.setOutcomeFilter(v as typeof state.outcome_filter)}>
                <SelectTrigger className="h-9 rounded-lg border-border/70 bg-background/80 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OUTCOME_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o} className="capitalize">
                      {o === "all" ? "Any outcome" : o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <ToolbarLabel>Stream</ToolbarLabel>
              <Select value={state.stream_filter} onValueChange={(v) => actions.setStreamFilter(v as typeof state.stream_filter)}>
                <SelectTrigger className="h-9 rounded-lg border-border/70 bg-background/80 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STREAM_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === "all" ? "Any" : s === "yes" ? "Streaming" : "Non-streaming"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <ToolbarLabel>Latency</ToolbarLabel>
              <Select value={state.latency_bucket} onValueChange={(v) => actions.setLatencyBucket(v as typeof state.latency_bucket)}>
                <SelectTrigger className="h-9 rounded-lg border-border/70 bg-background/80 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LATENCY_BUCKET_OPTIONS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {LATENCY_LABELS[l]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <ToolbarLabel>Special tokens</ToolbarLabel>
              <Select value={state.special_token_filter || "__none__"} onValueChange={(v) => actions.setSpecialTokenFilter(v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-9 rounded-lg border-border/70 bg-background/80 text-xs">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Any</SelectItem>
                  <SelectItem value="cache_read">Cache read</SelectItem>
                  <SelectItem value="cache_creation">Cache creation</SelectItem>
                  <SelectItem value="reasoning">Reasoning</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <ToolbarLabel>Token range</ToolbarLabel>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  className="h-9 rounded-lg border-border/70 bg-background/80 text-xs"
                  type="number"
                  min={0}
                  placeholder="Min"
                  value={state.token_min}
                  onChange={(e) => actions.setTokenMin(e.target.value)}
                />
                <Input
                  className="h-9 rounded-lg border-border/70 bg-background/80 text-xs"
                  type="number"
                  min={0}
                  placeholder="Max"
                  value={state.token_max}
                  onChange={(e) => actions.setTokenMax(e.target.value)}
                />
              </div>
            </div>

            <div>
              <ToolbarLabel>View</ToolbarLabel>
              <Select value={state.view} onValueChange={(v) => actions.setView(v as typeof state.view)}>
                <SelectTrigger className="h-9 rounded-lg border-border/70 bg-background/80 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VIEW_OPTIONS.map((v) => (
                    <SelectItem key={v} value={v} className="capitalize">
                      {v === "all" ? "All columns" : "Compact"}
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
                  Priced only
                </Button>
                <Button
                  variant={state.billable_only ? "default" : "outline"}
                  size="sm"
                  className="h-8 rounded-full px-3 text-xs"
                  onClick={() => actions.setBillableOnly(!state.billable_only)}
                >
                  Billable only
                </Button>
                <Button
                  variant={state.triage ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-8 rounded-full px-3 text-xs",
                    state.triage && "border-amber-500/60 bg-amber-500 text-amber-950 hover:bg-amber-400"
                  )}
                  onClick={() => actions.setTriage(!state.triage)}
                >
                  <Filter className="mr-1.5 h-3 w-3" />
                  Triage
                </Button>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
