import { Check, Coins, RefreshCw, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { REQUEST_TIME_RANGES } from "../queryParams";
import type { TimeRange } from "../queryParams";

interface SearchAndQuickFiltersProps {
  clearAllFilters: () => void;
  refresh: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setShowBillableOnly: (show: boolean | ((prev: boolean) => boolean)) => void;
  setShowPricedOnly: (show: boolean | ((prev: boolean) => boolean)) => void;
  setTimeRange: (range: TimeRange) => void;
  showBillableOnly: boolean;
  showPricedOnly: boolean;
  timeRange: TimeRange;
}

export function SearchAndQuickFilters({
  clearAllFilters,
  refresh,
  searchQuery,
  setSearchQuery,
  setShowBillableOnly,
  setShowPricedOnly,
  setTimeRange,
  showBillableOnly,
  showPricedOnly,
  timeRange,
}: SearchAndQuickFiltersProps) {
  return (
    <div className="grid gap-2 md:grid-cols-12">
      <div className="relative md:col-span-4">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
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
            onClick={() => setTimeRange(range)}
          >
            {range === "all" ? "All Time" : range}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-2 md:col-span-4">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant={showPricedOnly ? "secondary" : "outline"}
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={() => setShowPricedOnly((prev) => !prev)}
          >
            <Coins className="h-3.5 w-3.5" />
            Priced only
          </Button>
          <Button
            variant={showBillableOnly ? "secondary" : "outline"}
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={() => setShowBillableOnly((prev) => !prev)}
          >
            <Check className="h-3.5 w-3.5" />
            Billable only
          </Button>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={clearAllFilters}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}
