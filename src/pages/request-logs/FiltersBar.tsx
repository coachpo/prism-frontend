import { useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/i18n/useLocale";
import type { FilterOptions } from "./useRequestLogsPageData";
import type { RequestLogPageActions } from "./useRequestLogPageState";
import { FiltersBarPrimaryFilters } from "./FiltersBarPrimaryFilters";
import { FiltersBarSecondaryFilters } from "./FiltersBarSecondaryFilters";

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
  const [localRefinementOpen, setLocalRefinementOpen] = useState(false);

  return (
    <Card className="border-border/70 bg-card/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/85">
      <CardContent className="space-y-4 p-4">
        <FiltersBarPrimaryFilters
          actions={actions}
          filterOptions={filterOptions}
          filterOptionsLoaded={filterOptionsLoaded}
          state={state}
        />

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

        <FiltersBarSecondaryFilters
          actions={actions}
          localRefinementOpen={localRefinementOpen}
          onLocalRefinementOpenChange={setLocalRefinementOpen}
          state={state}
        />
      </CardContent>
    </Card>
  );
}
