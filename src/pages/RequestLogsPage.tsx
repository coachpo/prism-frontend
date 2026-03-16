import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useProfileContext } from "@/context/ProfileContext";
import { useTimezone } from "@/hooks/useTimezone";
import { useConnectionNavigation } from "@/hooks/useConnectionNavigation";
import { useRequestLogPageState } from "./request-logs/useRequestLogPageState";
import { useRequestLogsPageData } from "./request-logs/useRequestLogsPageData";
import { applyClientFilters } from "./request-logs/clientFilters";
import { RequestFocusBanner } from "./request-logs/RequestFocusBanner";
import { FiltersBar } from "./request-logs/FiltersBar";
import { RequestLogsTable } from "./request-logs/RequestLogsTable";
import { RequestLogDetailSheet } from "./request-logs/RequestLogDetailSheet";
import { SearchX, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DetailTab } from "./request-logs/queryParams";

export function RequestLogsPage() {
  const { revision } = useProfileContext();
  const { format } = useTimezone();
  const { navigateToConnection } = useConnectionNavigation();
  const [tableSelectedRequestId, setTableSelectedRequestId] = useState<number | null>(null);
  const [tableSelectedTab, setTableSelectedTab] = useState<DetailTab>("overview");
  const actions = useRequestLogPageState();
  const { state, isExactMode } = actions;

  const { items, total, loading, error, filterOptions, filterOptionsLoaded, refresh } =
    useRequestLogsPageData({ revision, state });

  const filteredItems = useMemo(
    () =>
      applyClientFilters(items, {
        search: state.search,
        outcome_filter: state.outcome_filter,
        stream_filter: state.stream_filter,
        latency_bucket: state.latency_bucket,
        token_min: state.token_min,
        token_max: state.token_max,
        priced_only: state.priced_only,
        billable_only: state.billable_only,
        special_token_filter: state.special_token_filter,
        triage: state.triage,
      }),
    [items, state.search, state.outcome_filter, state.stream_filter, state.latency_bucket, state.token_min, state.token_max, state.priced_only, state.billable_only, state.special_token_filter, state.triage]
  );

  const exactRequest = useMemo(() => {
    if (!state.request_id) return null;
    const id = parseInt(state.request_id, 10);
    return items.find((r) => r.id === id) ?? null;
  }, [items, state.request_id]);

  const tableSelectedRequest = useMemo(
    () => items.find((r) => r.id === tableSelectedRequestId) ?? null,
    [items, tableSelectedRequestId]
  );

  const selectedRequest = isExactMode ? exactRequest : tableSelectedRequest;
  const activeTab = isExactMode ? state.detail_tab : tableSelectedTab;
  const modelLabelById = useMemo(
    () => new Map(filterOptions.models.map((model) => [model.model_id, model.display_name || model.model_id])),
    [filterOptions.models]
  );

  const resolveModelLabel = (modelId: string) => modelLabelById.get(modelId) ?? modelId;

  const sheetOpen = selectedRequest !== null;

  const handleSelectRequest = (id: number) => {
    setTableSelectedRequestId(id);
    setTableSelectedTab("overview");
  };

  const handleCloseRequest = () => {
    if (isExactMode) {
      actions.clearRequest();
      return;
    }

    setTableSelectedRequestId(null);
    setTableSelectedTab("overview");
  };

  const handleTabChange = (tab: DetailTab) => {
    if (isExactMode) {
      actions.setDetailTab(tab);
      return;
    }

    setTableSelectedTab(tab);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6 pb-8">
        <PageHeader
          title="Request Logs"
          description="Browse and investigate proxied request history"
        />

        {isExactMode && (
          <RequestFocusBanner
            requestId={state.request_id}
            onExit={actions.clearRequest}
          />
        )}

        {!isExactMode && (
          <FiltersBar
            actions={actions}
            filterOptions={filterOptions}
            filterOptionsLoaded={filterOptionsLoaded}
            onRefresh={refresh}
            isRefreshing={loading}
          />
        )}

        {error && (
          <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {isExactMode && !loading && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border bg-card py-24 text-center shadow-sm">
            <div className="rounded-full bg-muted p-4 mb-2">
              <SearchX className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">Request Not Found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Request #{state.request_id} could not be found. It may have been deleted or you might not have access to it.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={actions.clearRequest}
            >
              Return to request list
            </Button>
          </div>
        ) : (
          <RequestLogsTable
            items={filteredItems}
            total={total}
            loading={loading}
            view={state.view}
            limit={state.limit}
            offset={state.offset}
            activeRequestId={selectedRequest?.id ?? null}
            onSelectRequest={handleSelectRequest}
            onSetLimit={actions.setLimit}
            onNextPage={() => actions.goToNextPage(total)}
            onPreviousPage={actions.goToPreviousPage}
            formatTimestamp={format}
            resolveModelLabel={resolveModelLabel}
          />
        )}

        <RequestLogDetailSheet
          request={selectedRequest}
          open={sheetOpen}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onClose={handleCloseRequest}
          onNavigateToConnection={navigateToConnection}
          formatTimestamp={format}
          resolveModelLabel={resolveModelLabel}
        />
      </div>
    </TooltipProvider>
  );
}
