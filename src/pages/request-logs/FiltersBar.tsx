import type { ConnectionDropdownItem, Endpoint, Provider } from "@/lib/types";
import { PrimaryFiltersGroup } from "./filters-bar/PrimaryFiltersGroup";
import { RequestViewTabs } from "./filters-bar/RequestViewTabs";
import { SearchAndQuickFilters } from "./filters-bar/SearchAndQuickFilters";
import { SecondaryFiltersGroup } from "./filters-bar/SecondaryFiltersGroup";
import { TokenRangeControls } from "./filters-bar/TokenRangeControls";
import { TriageFilterGroup } from "./filters-bar/TriageFilterGroup";
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
  clearAllFilters: () => void;
  connectionId: string;
  connections: ConnectionDropdownItem[];
  endpointId: string;
  endpoints: Endpoint[];
  latencyBucket: LatencyBucket;
  modelId: string;
  models: { model_id: string; display_name: string | null }[];
  outcomeFilter: OutcomeFilter;
  providerType: string;
  providers: Provider[];
  refresh: () => void;
  searchQuery: string;
  setConnectionId: (id: string) => void;
  setEndpointId: (id: string) => void;
  setLatencyBucket: (bucket: LatencyBucket) => void;
  setModelId: (id: string) => void;
  setOutcomeFilter: (filter: OutcomeFilter) => void;
  setProviderType: (type: string) => void;
  setSearchQuery: (query: string) => void;
  setShowBillableOnly: (show: boolean | ((prev: boolean) => boolean)) => void;
  setShowPricedOnly: (show: boolean | ((prev: boolean) => boolean)) => void;
  setSpecialTokenFilter: (filter: SpecialTokenFilter) => void;
  setStreamFilter: (filter: StreamFilter) => void;
  setTimeRange: (range: TimeRange) => void;
  setTokenMax: (val: number | null) => void;
  setTokenMaxInput: (val: string | ((prev: string) => string)) => void;
  setTokenMin: (val: number | null) => void;
  setTokenMinInput: (val: string | ((prev: string) => string)) => void;
  setTriage: (triage: TriageFilter) => void;
  setView: (view: ViewType) => void;
  showBillableOnly: boolean;
  showPricedOnly: boolean;
  specialTokenFilter: SpecialTokenFilter;
  streamFilter: StreamFilter;
  timeRange: TimeRange;
  tokenMaxInput: string;
  tokenMinInput: string;
  triage: TriageFilter;
  view: ViewType;
}

export function FiltersBar({
  clearAllFilters,
  connectionId,
  connections,
  endpointId,
  endpoints,
  latencyBucket,
  modelId,
  models,
  outcomeFilter,
  providerType,
  providers,
  refresh,
  searchQuery,
  setConnectionId,
  setEndpointId,
  setLatencyBucket,
  setModelId,
  setOutcomeFilter,
  setProviderType,
  setSearchQuery,
  setShowBillableOnly,
  setShowPricedOnly,
  setSpecialTokenFilter,
  setStreamFilter,
  setTimeRange,
  setTokenMax,
  setTokenMaxInput,
  setTokenMin,
  setTokenMinInput,
  setTriage,
  setView,
  showBillableOnly,
  showPricedOnly,
  specialTokenFilter,
  streamFilter,
  timeRange,
  tokenMaxInput,
  tokenMinInput,
  triage,
  view,
}: FiltersBarProps) {
  return (
    <div className="sticky top-4 z-20">
      <div className="space-y-3 rounded-lg border border-border/70 bg-background/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <RequestViewTabs view={view} setView={setView} />

        <TriageFilterGroup triage={triage} setTriage={setTriage} />

        <SearchAndQuickFilters
          clearAllFilters={clearAllFilters}
          refresh={refresh}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          showPricedOnly={showPricedOnly}
          setShowPricedOnly={setShowPricedOnly}
          showBillableOnly={showBillableOnly}
          setShowBillableOnly={setShowBillableOnly}
        />

        <div className="flex flex-wrap items-center gap-2">
          <PrimaryFiltersGroup
            modelId={modelId}
            setModelId={setModelId}
            models={models}
            providers={providers}
            providerType={providerType}
            setProviderType={setProviderType}
            connectionId={connectionId}
            setConnectionId={setConnectionId}
            connections={connections}
            endpointId={endpointId}
            setEndpointId={setEndpointId}
            endpoints={endpoints}
          />
          <SecondaryFiltersGroup
            outcomeFilter={outcomeFilter}
            setOutcomeFilter={setOutcomeFilter}
            streamFilter={streamFilter}
            setStreamFilter={setStreamFilter}
            latencyBucket={latencyBucket}
            setLatencyBucket={setLatencyBucket}
            specialTokenFilter={specialTokenFilter}
            setSpecialTokenFilter={setSpecialTokenFilter}
          />
        </div>

        <TokenRangeControls
          tokenMinInput={tokenMinInput}
          setTokenMinInput={setTokenMinInput}
          setTokenMin={setTokenMin}
          tokenMaxInput={tokenMaxInput}
          setTokenMaxInput={setTokenMaxInput}
          setTokenMax={setTokenMax}
          clearAllFilters={clearAllFilters}
        />
      </div>
    </div>
  );
}
