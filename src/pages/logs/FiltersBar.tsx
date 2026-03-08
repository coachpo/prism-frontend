import { Check, Coins, Filter, Search, X } from "lucide-react";
import { ProviderSelect } from "@/components/ProviderSelect";
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
import { cn } from "@/lib/utils";
import type { ConnectionDropdownItem, Endpoint, Provider } from "@/lib/types";
import {
  REQUEST_VIEW_OPTIONS,
  SPECIAL_TOKEN_FILTERS,
  TIME_RANGES,
  TRIAGE_OPTIONS,
  type RequestView,
  type SpecialTokenFilter,
  type StatusFamily,
  type StreamFilter,
  type TimeRange,
  type TriageFilter,
  parseTokenInputValue,
} from "./queryParams";
import { getConnectionLabel } from "./formatters";

interface FiltersBarProps {
  billableOnly: boolean;
  clearAllFilters: () => void;
  connectionId: string;
  connections: ConnectionDropdownItem[];
  endpointId: string;
  endpoints: Endpoint[];
  modelId: string;
  models: { display_name: string | null; model_id: string }[];
  pricedOnly: boolean;
  provider: string;
  providers: Provider[];
  range: TimeRange;
  requestView: RequestView;
  resetRequestPagination: () => void;
  resetSharedPagination: () => void;
  search: string;
  setBillableOnly: (value: boolean | ((previous: boolean) => boolean)) => void;
  setConnectionId: (value: string) => void;
  setEndpointId: (value: string) => void;
  setModelId: (value: string) => void;
  setPricedOnly: (value: boolean | ((previous: boolean) => boolean)) => void;
  setProvider: (value: string) => void;
  setRange: (value: TimeRange) => void;
  setRequestView: (value: RequestView) => void;
  setSearch: (value: string) => void;
  setSpecialTokenFilter: (value: SpecialTokenFilter) => void;
  setStatusFamily: (value: StatusFamily) => void;
  setStreamFilter: (value: StreamFilter) => void;
  setTokenMax: (value: number | null) => void;
  setTokenMaxInput: (value: string | ((previous: string) => string)) => void;
  setTokenMin: (value: number | null) => void;
  setTokenMinInput: (value: string | ((previous: string) => string)) => void;
  setTriage: (value: TriageFilter) => void;
  specialTokenFilter: SpecialTokenFilter;
  statusFamily: StatusFamily;
  streamFilter: StreamFilter;
  tokenMaxInput: string;
  tokenMinInput: string;
  triage: TriageFilter;
}

export function FiltersBar({
  billableOnly,
  clearAllFilters,
  connectionId,
  connections,
  endpointId,
  endpoints,
  modelId,
  models,
  pricedOnly,
  provider,
  providers,
  range,
  requestView,
  resetRequestPagination,
  resetSharedPagination,
  search,
  setBillableOnly,
  setConnectionId,
  setEndpointId,
  setModelId,
  setPricedOnly,
  setProvider,
  setRange,
  setRequestView,
  setSearch,
  setSpecialTokenFilter,
  setStatusFamily,
  setStreamFilter,
  setTokenMax,
  setTokenMaxInput,
  setTokenMin,
  setTokenMinInput,
  setTriage,
  specialTokenFilter,
  statusFamily,
  streamFilter,
  tokenMaxInput,
  tokenMinInput,
  triage,
}: FiltersBarProps) {
  return (
    <div className="sticky top-4 z-20">
      <div className="space-y-3 rounded-xl border bg-card/95 p-3 shadow-sm backdrop-blur">
        <div className="grid gap-2 lg:grid-cols-[minmax(0,1.6fr)_repeat(5,minmax(0,1fr))_auto]">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                resetRequestPagination();
              }}
              placeholder="Search request id, model, endpoint, status, or error..."
              className="h-9 pl-9 text-xs"
            />
          </div>

          <Select
            value={modelId}
            onValueChange={(value) => {
              setModelId(value);
              resetSharedPagination();
            }}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All models</SelectItem>
              {models.map((model) => (
                <SelectItem key={model.model_id} value={model.model_id}>
                  {model.display_name || model.model_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ProviderSelect
            value={provider}
            providers={providers}
            onValueChange={(value) => {
              setProvider(value);
              resetSharedPagination();
            }}
            className="h-9 text-xs"
          />

          <Select
            value={connectionId}
            onValueChange={(value) => {
              setConnectionId(value);
              resetSharedPagination();
            }}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Connection" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All connections</SelectItem>
              {connections.map((connection) => (
                <SelectItem key={connection.id} value={String(connection.id)}>
                  {getConnectionLabel(connection)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={endpointId}
            onValueChange={(value) => {
              setEndpointId(value);
              resetSharedPagination();
            }}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Endpoint" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All endpoints</SelectItem>
              {endpoints.map((endpoint) => (
                <SelectItem key={endpoint.id} value={String(endpoint.id)}>
                  {endpoint.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFamily}
            onValueChange={(value) => {
              setStatusFamily(value as StatusFamily);
              resetSharedPagination();
            }}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="2xx">2xx</SelectItem>
              <SelectItem value="4xx">4xx</SelectItem>
              <SelectItem value="5xx">5xx</SelectItem>
              <SelectItem value="error">Any error</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="h-9 gap-1 text-xs" onClick={clearAllFilters}>
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)] xl:items-start">
          <Tabs value={requestView} onValueChange={(value) => setRequestView(value as RequestView)}>
            <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto p-1">
              {REQUEST_VIEW_OPTIONS.map((option) => (
                <TabsTrigger key={option.value} value={option.value} className="h-8 flex-none gap-1.5 px-3 text-xs">
                  <option.icon className="h-3.5 w-3.5" />
                  <span>{option.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/30 p-1">
            {TIME_RANGES.map((timeOption) => (
              <Button
                key={timeOption}
                type="button"
                variant={range === timeOption ? "secondary" : "ghost"}
                size="sm"
                className={cn("h-7 px-3 text-xs", range === timeOption && "bg-background")}
                onClick={() => {
                  setRange(timeOption);
                  resetSharedPagination();
                }}
              >
                {timeOption === "all" ? "All time" : timeOption}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
          <span className="flex items-center gap-1 whitespace-nowrap text-xs font-medium text-muted-foreground">
            <Filter className="h-3 w-3" />
            Triage:
          </span>
          {TRIAGE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={triage === option.value ? "default" : "outline"}
              size="sm"
              className={cn("h-7 gap-1.5 rounded-full border-dashed text-xs whitespace-nowrap", triage === option.value && "border-solid")}
              onClick={() => {
                setTriage(triage === option.value ? "none" : option.value);
                resetRequestPagination();
              }}
            >
              <option.icon className="h-3 w-3" />
              {option.label}
              {triage === option.value ? <X className="h-3 w-3" /> : null}
            </Button>
          ))}
        </div>

        <div className="grid gap-2 lg:grid-cols-[repeat(5,minmax(0,1fr))_auto_auto]">
          <Select
            value={streamFilter}
            onValueChange={(value) => {
              setStreamFilter(value as StreamFilter);
              resetRequestPagination();
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Stream" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stream modes</SelectItem>
              <SelectItem value="stream">Streaming</SelectItem>
              <SelectItem value="non_stream">Non-stream</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={specialTokenFilter}
            onValueChange={(value) => {
              setSpecialTokenFilter(value as SpecialTokenFilter);
              resetRequestPagination();
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Special tokens" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All token rows</SelectItem>
              {SPECIAL_TOKEN_FILTERS.filter((item) => item !== "all").map((item) => (
                <SelectItem key={item} value={item}>
                  {item.replaceAll("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 rounded-md border bg-background px-2">
            <span className="whitespace-nowrap text-[11px] text-muted-foreground">Token min</span>
            <Input
              value={tokenMinInput}
              onChange={(event) => setTokenMinInput(event.target.value)}
              onBlur={() => {
                setTokenMin(parseTokenInputValue(tokenMinInput));
                setTokenMinInput((previous) => {
                  const parsed = parseTokenInputValue(previous);
                  return parsed === null ? "" : String(parsed);
                });
                resetRequestPagination();
              }}
              className="h-8 border-0 px-0 text-xs shadow-none focus-visible:ring-0"
              inputMode="numeric"
              placeholder="optional"
            />
          </div>

          <div className="flex items-center gap-2 rounded-md border bg-background px-2">
            <span className="whitespace-nowrap text-[11px] text-muted-foreground">Token max</span>
            <Input
              value={tokenMaxInput}
              onChange={(event) => setTokenMaxInput(event.target.value)}
              onBlur={() => {
                setTokenMax(parseTokenInputValue(tokenMaxInput));
                setTokenMaxInput((previous) => {
                  const parsed = parseTokenInputValue(previous);
                  return parsed === null ? "" : String(parsed);
                });
                resetRequestPagination();
              }}
              className="h-8 border-0 px-0 text-xs shadow-none focus-visible:ring-0"
              inputMode="numeric"
              placeholder="optional"
            />
          </div>

          <Button
            type="button"
            variant={pricedOnly ? "secondary" : "outline"}
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={() => {
              setPricedOnly((previous) => !previous);
              resetRequestPagination();
            }}
          >
            <Coins className="h-3.5 w-3.5" />
            Priced only
          </Button>

          <Button
            type="button"
            variant={billableOnly ? "secondary" : "outline"}
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={() => {
              setBillableOnly((previous) => !previous);
              resetRequestPagination();
            }}
          >
            <Check className="h-3.5 w-3.5" />
            Billable only
          </Button>
        </div>
      </div>
    </div>
  );
}
