import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useProfileContext } from "@/context/ProfileContext";
import { useTimezone } from "@/hooks/useTimezone";
import { useLocale } from "@/i18n/useLocale";
import { useRequestLogPageState } from "./request-logs/useRequestLogPageState";
import { useRequestLogDetail } from "./request-logs/useRequestLogDetail";
import { useRequestLogsPageData } from "./request-logs/useRequestLogsPageData";
import { applyClientFilters } from "./request-logs/clientFilters";
import { createConnectionNavigator } from "./request-logs/connectionNavigation";
import { RequestFocusBanner } from "./request-logs/RequestFocusBanner";
import { FiltersBar } from "./request-logs/FiltersBar";
import { RequestLogsTable } from "./request-logs/RequestLogsTable";
import { RequestLogDetailSheet } from "./request-logs/RequestLogDetailSheet";
import { SearchX, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RequestLogDetail } from "@/lib/types";
import type { DetailTab } from "./request-logs/queryParams";
import type { RequestLogModelResolver } from "./request-logs/columns";

export function RequestLogsPage() {
  const navigate = useNavigate();
  const { revision, selectedProfileId } = useProfileContext();
  const { format } = useTimezone();
  const { messages } = useLocale();
  const [tableSelectedRequestId, setTableSelectedRequestId] = useState<number | null>(null);
  const [tableSelectedTab, setTableSelectedTab] = useState<DetailTab>("overview");
  const [sheetRequest, setSheetRequest] = useState<RequestLogDetail | null>(null);
  const [sheetActiveTab, setSheetActiveTab] = useState<DetailTab>("overview");
  const actions = useRequestLogPageState();
  const { state, isExactMode } = actions;
  const navigateToConnection = useMemo(
    () => createConnectionNavigator({ navigate, selectedProfileId }),
    [navigate, selectedProfileId]
  );

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
        triage: state.triage,
      }),
    [items, state.search, state.outcome_filter, state.stream_filter, state.latency_bucket, state.token_min, state.token_max, state.triage]
  );

  const selectedRequestId = useMemo(() => {
    if (isExactMode) {
      const parsedRequestId = parseInt(state.request_id, 10);
      return Number.isFinite(parsedRequestId) ? parsedRequestId : null;
    }

    return tableSelectedRequestId;
  }, [isExactMode, state.request_id, tableSelectedRequestId]);

  const {
    request: selectedRequest,
    loading: detailLoading,
    error: detailError,
    notFound: detailNotFound,
  } = useRequestLogDetail({
    requestId: selectedRequestId,
    enabled: selectedRequestId !== null,
  });

  const currentActiveTab = isExactMode ? state.detail_tab : tableSelectedTab;
  const surfaceError = error ?? detailError;
  const showExactNotFound = isExactMode && !detailLoading && detailNotFound;
  const listVisibleRequestId = useMemo(
    () => items.find((item) => item.id === selectedRequestId)?.id ?? selectedRequestId,
    [items, selectedRequestId],
  );
  const modelLabelById = useMemo(
    () => new Map(filterOptions.models.map((model) => [model.model_id, model.display_name || model.model_id])),
    [filterOptions.models]
  );
  const modelMetadataById = useMemo(
    () => new Map(filterOptions.models.map((model) => [model.model_id, model])),
    [filterOptions.models],
  );

  useEffect(() => {
    if (selectedRequest) {
      setSheetRequest(selectedRequest);
      setSheetActiveTab(currentActiveTab);
    }
  }, [currentActiveTab, selectedRequest]);

  const resolveModelLabel = useMemo<RequestLogModelResolver>(() => {
    return Object.assign(
      (modelId: string) => modelLabelById.get(modelId) ?? modelId,
      {
        getModelMetadata: (modelId: string) => modelMetadataById.get(modelId),
      },
    ) as RequestLogModelResolver;
  }, [modelLabelById, modelMetadataById]);

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
          title={messages.requestLogs.requestLogsTitle}
          description={messages.requestLogs.requestLogsDescription}
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

        {surfaceError && (
          <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{surfaceError}</p>
          </div>
        )}

        {showExactNotFound ? (
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-lg border bg-card py-24 text-center shadow-sm"
            data-testid="request-log-not-found"
          >
            <div className="rounded-full bg-muted p-4 mb-2">
              <SearchX className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">{messages.requestLogs.requestNotFound}</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {messages.requestLogs.requestNotFoundDescription(state.request_id)}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={actions.clearRequest}
            >
              {messages.requestLogs.returnToRequestList}
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
            activeRequestId={listVisibleRequestId ?? null}
            onSelectRequest={handleSelectRequest}
            onSetLimit={actions.setLimit}
            onNextPage={() => actions.goToNextPage(total)}
            onPreviousPage={actions.goToPreviousPage}
            formatTimestamp={format}
            resolveModelLabel={resolveModelLabel}
          />
        )}

        <RequestLogDetailSheet
          request={sheetRequest}
          open={sheetOpen}
          activeTab={sheetOpen ? currentActiveTab : sheetActiveTab}
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
