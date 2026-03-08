import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProviderSelect } from "@/components/ProviderSelect";
import { cn } from "@/lib/utils";
import { Check, Coins, Filter, Search, X } from "lucide-react";
import type { ConnectionDropdownItem, Endpoint } from "@/lib/types";
import { getConnectionLabel } from "./formatters";
import {
  LATENCY_BUCKETS,
  REQUEST_TIME_RANGES,
  TRIAGE_OPTIONS,
  VIEW_OPTIONS,
  parseTokenInputValue,
} from "./queryParams";
import type {
  LatencyBucket,
  OutcomeFilter,
  SpecialTokenFilter,
  StreamFilter,
  TimeRange,
  TriageFilter,
  ViewType,
} from "./queryParams";

interface FiltersBarProps {
  view: ViewType;
  setView: (view: ViewType) => void;
  triage: TriageFilter;
  setTriage: (triage: TriageFilter) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  showPricedOnly: boolean;
  setShowPricedOnly: (show: boolean | ((prev: boolean) => boolean)) => void;
  showBillableOnly: boolean;
  setShowBillableOnly: (show: boolean | ((prev: boolean) => boolean)) => void;
  modelId: string;
  setModelId: (id: string) => void;
  models: { model_id: string; display_name: string | null }[];
  providerType: string;
  setProviderType: (type: string) => void;
  connectionId: string;
  setConnectionId: (id: string) => void;
  connections: ConnectionDropdownItem[];
  endpointId: string;
  setEndpointId: (id: string) => void;
  endpoints: Endpoint[];
  outcomeFilter: OutcomeFilter;
  setOutcomeFilter: (filter: OutcomeFilter) => void;
  streamFilter: StreamFilter;
  setStreamFilter: (filter: StreamFilter) => void;
  latencyBucket: LatencyBucket;
  setLatencyBucket: (bucket: LatencyBucket) => void;
  specialTokenFilter: SpecialTokenFilter;
  setSpecialTokenFilter: (filter: SpecialTokenFilter) => void;
  tokenMinInput: string;
  setTokenMinInput: (val: string | ((prev: string) => string)) => void;
  setTokenMin: (val: number | null) => void;
  tokenMaxInput: string;
  setTokenMaxInput: (val: string | ((prev: string) => string)) => void;
  setTokenMax: (val: number | null) => void;
  setOffset: (offset: number) => void;
  clearAllFilters: () => void;
}

export function FiltersBar({
  view,
  setView,
  triage,
  setTriage,
  searchQuery,
  setSearchQuery,
  timeRange,
  setTimeRange,
  showPricedOnly,
  setShowPricedOnly,
  showBillableOnly,
  setShowBillableOnly,
  modelId,
  setModelId,
  models,
  providerType,
  setProviderType,
  connectionId,
  setConnectionId,
  connections,
  endpointId,
  setEndpointId,
  endpoints,
  outcomeFilter,
  setOutcomeFilter,
  streamFilter,
  setStreamFilter,
  latencyBucket,
  setLatencyBucket,
  specialTokenFilter,
  setSpecialTokenFilter,
  tokenMinInput,
  setTokenMinInput,
  setTokenMin,
  tokenMaxInput,
  setTokenMaxInput,
  setTokenMax,
  setOffset,
  clearAllFilters,
}: FiltersBarProps) {
  return (
    <div className="sticky top-4 z-20">
      <div className="space-y-3 rounded-lg border border-border/70 bg-background/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1">
          <Tabs value={view} onValueChange={(next) => setView(next as ViewType)} className="w-full">
            <TabsList className="w-full justify-start sm:w-auto">
              {VIEW_OPTIONS.map((option) => (
                <TabsTrigger key={option.value} value={option.value} className="gap-2 px-3">
                  <option.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{option.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap flex items-center gap-1">
            <Filter className="h-3 w-3" />
            Triage:
          </span>
          {TRIAGE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={triage === option.value ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-7 gap-1.5 rounded-full border-dashed text-xs whitespace-nowrap",
                triage === option.value && "border-solid"
              )}
              onClick={() => {
                setTriage(triage === option.value ? "none" : option.value);
                setOffset(0);
              }}
            >
              <option.icon className="h-3 w-3" />
              {option.label}
              {triage === option.value ? <X className="h-3 w-3" /> : null}
            </Button>
          ))}
        </div>

        <div className="grid gap-2 md:grid-cols-12">
          <div className="relative md:col-span-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setOffset(0);
              }}
              placeholder="Search request id, model, endpoint, status, or error..."
              className="h-9 pl-9 text-xs"
            />
          </div>

          <div className="inline-flex w-fit flex-wrap gap-1 rounded-md bg-muted/30 p-1 md:col-span-3 md:justify-self-start">
            {REQUEST_TIME_RANGES.map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "secondary" : "ghost"}
                size="sm"
                className={cn("h-7 px-3 text-xs", timeRange === range && "bg-background")}
                onClick={() => {
                  setTimeRange(range);
                  setOffset(0);
                }}
              >
                {range === "all" ? "All Time" : range}
              </Button>
            ))}
          </div>

          <div className="md:col-span-4 flex items-center justify-end gap-2">
            <Button
              variant={showPricedOnly ? "secondary" : "outline"}
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={() => {
                setShowPricedOnly((prev) => !prev);
                setOffset(0);
              }}
            >
              <Coins className="h-3.5 w-3.5" />
              Priced only
            </Button>
            <Button
              variant={showBillableOnly ? "secondary" : "outline"}
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={() => {
                setShowBillableOnly((prev) => !prev);
                setOffset(0);
              }}
            >
              <Check className="h-3.5 w-3.5" />
              Billable only
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={modelId}
            onValueChange={(next) => {
              setModelId(next);
              setOffset(0);
            }}
          >
            <SelectTrigger className="h-8 w-full text-xs sm:w-[180px] [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:truncate">
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Models</SelectItem>
              {models.map((model) => (
                <SelectItem key={model.model_id} value={model.model_id}>
                  {model.display_name || model.model_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ProviderSelect
            value={providerType}
            onValueChange={(next) => {
              setProviderType(next);
              setOffset(0);
            }}
            className="h-8 w-full text-xs sm:w-[150px] [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:truncate"
          />

          <Select
            value={connectionId}
            onValueChange={(next) => {
              setConnectionId(next);
              setOffset(0);
            }}
          >
            <SelectTrigger className="h-8 w-full text-xs sm:w-[180px] [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:truncate">
              <SelectValue placeholder="Connection" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Connections</SelectItem>
              {connections.map((connection) => (
                <SelectItem key={connection.id} value={String(connection.id)}>
                  {getConnectionLabel(connection)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={endpointId}
            onValueChange={(next) => {
              setEndpointId(next);
              setOffset(0);
            }}
          >
            <SelectTrigger className="h-8 w-full text-xs sm:w-[180px] [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:truncate">
              <SelectValue placeholder="Endpoint" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Endpoints</SelectItem>
              {endpoints.map((endpoint) => (
                <SelectItem key={endpoint.id} value={String(endpoint.id)}>
                  {endpoint.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={outcomeFilter}
            onValueChange={(next) => {
              setOutcomeFilter(next as OutcomeFilter);
              setOffset(0);
            }}
          >
            <SelectTrigger className="h-8 w-full text-xs sm:w-[130px] [&_[data-slot=select-value]]:truncate">
              <SelectValue placeholder="Outcome" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Outcomes</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={streamFilter}
            onValueChange={(next) => {
              setStreamFilter(next as StreamFilter);
              setOffset(0);
            }}
          >
            <SelectTrigger className="h-8 w-full text-xs sm:w-[150px] [&_[data-slot=select-value]]:truncate">
              <SelectValue placeholder="Stream" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stream Types</SelectItem>
              <SelectItem value="stream">Streaming</SelectItem>
              <SelectItem value="non_stream">Non-streaming</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={latencyBucket}
            onValueChange={(next) => {
              setLatencyBucket(next as LatencyBucket);
              setOffset(0);
            }}
          >
            <SelectTrigger className="h-8 w-full text-xs sm:w-[140px] [&_[data-slot=select-value]]:truncate">
              <SelectValue placeholder="Latency" />
            </SelectTrigger>
            <SelectContent>
              {LATENCY_BUCKETS.map((bucket) => (
                <SelectItem key={bucket.value} value={bucket.value}>
                  {bucket.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={specialTokenFilter}
            onValueChange={(next) => {
              setSpecialTokenFilter(next as SpecialTokenFilter);
              setOffset(0);
            }}
          >
            <SelectTrigger className="h-8 w-full text-xs sm:w-[190px] [&_[data-slot=select-value]]:truncate">
              <SelectValue placeholder="Special Tokens" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All token rows</SelectItem>
              <SelectItem value="has_cached">Has cached tokens</SelectItem>
              <SelectItem value="has_reasoning">Has reasoning tokens</SelectItem>
              <SelectItem value="has_any_special">Has any special token</SelectItem>
              <SelectItem value="missing_special">Missing special tokens</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Token min</span>
            <Input
              value={tokenMinInput}
              onChange={(event) => setTokenMinInput(event.target.value)}
              onBlur={() => {
                setTokenMin(parseTokenInputValue(tokenMinInput));
                setTokenMinInput((prev) => {
                  const parsed = parseTokenInputValue(prev);
                  return parsed === null ? "" : String(parsed);
                });
                setOffset(0);
              }}
              placeholder="optional"
              inputMode="numeric"
              className="h-8 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Token max</span>
            <Input
              value={tokenMaxInput}
              onChange={(event) => setTokenMaxInput(event.target.value)}
              onBlur={() => {
                setTokenMax(parseTokenInputValue(tokenMaxInput));
                setTokenMaxInput((prev) => {
                  const parsed = parseTokenInputValue(prev);
                  return parsed === null ? "" : String(parsed);
                });
                setOffset(0);
              }}
              placeholder="optional"
              inputMode="numeric"
              className="h-8 text-xs"
            />
          </div>

          <div className="flex justify-start sm:justify-end">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={clearAllFilters}>
              Clear Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
