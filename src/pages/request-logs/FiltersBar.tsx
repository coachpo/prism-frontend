import { Search, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
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
  normal: "500ms–2s",
  slow: "2s–5s",
  very_slow: "> 5s",
};

export function FiltersBar({ actions, filterOptions, filterOptionsLoaded }: FiltersBarProps) {
  const { state, hasActiveFilters } = actions;

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-auto sm:min-w-[200px]">
          <Label className="mb-1.5 text-xs text-muted-foreground">Model</Label>
          <Select value={state.model_id || "__all__"} onValueChange={(v) => actions.setModelId(v === "__all__" ? "" : v)}>
            <SelectTrigger className="h-8 text-xs">
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

        <div className="w-full sm:w-auto sm:min-w-[140px]">
          <Label className="mb-1.5 text-xs text-muted-foreground">Provider</Label>
          <Select value={state.provider_type || "__all__"} onValueChange={(v) => actions.setProviderType(v === "__all__" ? "" : v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="All providers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All providers</SelectItem>
              {filterOptionsLoaded &&
                filterOptions.providers.map((p) => (
                  <SelectItem key={p.id} value={p.provider_type}>
                    {p.provider_type}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-auto sm:min-w-[140px]">
          <Label className="mb-1.5 text-xs text-muted-foreground">Endpoint</Label>
          <Select value={state.endpoint_id || "__all__"} onValueChange={(v) => actions.setEndpointId(v === "__all__" ? "" : v)}>
            <SelectTrigger className="h-8 text-xs">
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

        <div className="w-full sm:w-auto sm:min-w-[140px]">
          <Label className="mb-1.5 text-xs text-muted-foreground">Connection</Label>
          <Select value={state.connection_id || "__all__"} onValueChange={(v) => actions.setConnectionId(v === "__all__" ? "" : v)}>
            <SelectTrigger className="h-8 text-xs">
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

        <div className="w-full sm:w-auto sm:min-w-[140px]">
          <Label className="mb-1.5 text-xs text-muted-foreground">Time range</Label>
          <Select value={state.time_range} onValueChange={(v) => actions.setTimeRange(v as typeof state.time_range)}>
            <SelectTrigger className="h-8 text-xs">
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

      <div className="flex flex-wrap items-end gap-3">
        <div className="relative w-full sm:w-auto sm:min-w-[220px]">
          <Label className="mb-1.5 text-xs text-muted-foreground">Search</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-8 pl-8 text-xs"
              placeholder="model, provider, path, error..."
              value={state.search}
              onChange={(e) => actions.setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="w-full sm:w-auto sm:min-w-[120px]">
          <Label className="mb-1.5 text-xs text-muted-foreground">Outcome</Label>
          <Select value={state.outcome_filter} onValueChange={(v) => actions.setOutcomeFilter(v as typeof state.outcome_filter)}>
            <SelectTrigger className="h-8 text-xs">
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

        <div className="w-full sm:w-auto sm:min-w-[100px]">
          <Label className="mb-1.5 text-xs text-muted-foreground">Stream</Label>
          <Select value={state.stream_filter} onValueChange={(v) => actions.setStreamFilter(v as typeof state.stream_filter)}>
            <SelectTrigger className="h-8 text-xs">
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

        <div className="w-full sm:w-auto sm:min-w-[120px]">
          <Label className="mb-1.5 text-xs text-muted-foreground">Latency</Label>
          <Select value={state.latency_bucket} onValueChange={(v) => actions.setLatencyBucket(v as typeof state.latency_bucket)}>
            <SelectTrigger className="h-8 text-xs">
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

        <div className="flex items-end gap-1.5">
          <div className="w-20">
            <Label className="mb-1.5 text-xs text-muted-foreground">Min tokens</Label>
            <Input
              className="h-8 text-xs"
              type="number"
              min={0}
              placeholder="0"
              value={state.token_min}
              onChange={(e) => actions.setTokenMin(e.target.value)}
            />
          </div>
          <div className="w-20">
            <Label className="mb-1.5 text-xs text-muted-foreground">Max tokens</Label>
            <Input
              className="h-8 text-xs"
              type="number"
              min={0}
              placeholder="∞"
              value={state.token_max}
              onChange={(e) => actions.setTokenMax(e.target.value)}
            />
          </div>
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={actions.clearFilters}>
            <X className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-auto sm:min-w-[140px]">
          <Label className="mb-1.5 text-xs text-muted-foreground">Special tokens</Label>
          <Select value={state.special_token_filter || "__none__"} onValueChange={(v) => actions.setSpecialTokenFilter(v === "__none__" ? "" : v)}>
            <SelectTrigger className="h-8 text-xs">
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

        <div className="w-full sm:w-auto sm:min-w-[100px]">
          <Label className="mb-1.5 text-xs text-muted-foreground">View</Label>
          <Select value={state.view} onValueChange={(v) => actions.setView(v as typeof state.view)}>
            <SelectTrigger className="h-8 text-xs">
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

        <Button
          variant={state.priced_only ? "default" : "outline"}
          size="sm"
          className="h-8 text-xs"
          onClick={() => actions.setPricedOnly(!state.priced_only)}
        >
          Priced only
        </Button>

        <Button
          variant={state.billable_only ? "default" : "outline"}
          size="sm"
          className="h-8 text-xs"
          onClick={() => actions.setBillableOnly(!state.billable_only)}
        >
          Billable only
        </Button>

        <Button
          variant={state.triage ? "default" : "outline"}
          size="sm"
          className={cn("h-8 gap-1.5 text-xs", state.triage && "bg-amber-600 hover:bg-amber-700")}
          onClick={() => actions.setTriage(!state.triage)}
        >
          <Filter className="h-3 w-3" />
          Triage
        </Button>
      </div>
    </div>
  );
}
