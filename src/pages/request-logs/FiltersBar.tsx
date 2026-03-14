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
  providers: Provider[];
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
  providers,
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
  const resetOffset = () => {
    setOffset(0);
  };

  return (
    <div className="sticky top-4 z-20">
      <div className="space-y-3 rounded-lg border border-border/70 bg-background/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <RequestViewTabs view={view} setView={setView} />

        <TriageFilterGroup triage={triage} setTriage={setTriage} resetOffset={resetOffset} />

        <SearchAndQuickFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          showPricedOnly={showPricedOnly}
          setShowPricedOnly={setShowPricedOnly}
          showBillableOnly={showBillableOnly}
          setShowBillableOnly={setShowBillableOnly}
          resetOffset={resetOffset}
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
            resetOffset={resetOffset}
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
            resetOffset={resetOffset}
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
          resetOffset={resetOffset}
        />
      </div>
    </div>
  );
}
