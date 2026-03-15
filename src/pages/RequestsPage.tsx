import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useProfileContext } from "@/context/ProfileContext";
import { useConnectionNavigation } from "@/hooks/useConnectionNavigation";
import { useTimezone } from "@/hooks/useTimezone";
import { FiltersBar } from "@/pages/request-logs/FiltersBar";
import { RequestFocusBanner } from "@/pages/request-logs/RequestFocusBanner";
import { RequestLogDetailSheet } from "@/pages/request-logs/RequestLogDetailSheet";
import { RequestLogsTable } from "@/pages/request-logs/RequestLogsTable";
import { useRequestLogPageState } from "@/pages/request-logs/useRequestLogPageState";
import { useRequestLogsPageData } from "@/pages/request-logs/useRequestLogsPageData";

export function RequestsPage() {
  const { format: formatTime } = useTimezone();
  const { navigateToConnection } = useConnectionNavigation();
  const { revision } = useProfileContext();
  const state = useRequestLogPageState();
  const data = useRequestLogsPageData({
    connectionId: state.connectionId,
    endpointId: state.endpointId,
    latencyBucket: state.latencyBucket,
    limit: state.limit,
    modelId: state.modelId,
    offset: state.offset,
    outcomeFilter: state.outcomeFilter,
    providerType: state.providerType,
    requestId: state.requestId,
    revision,
    searchQuery: state.searchQuery,
    setDetailTab: state.setDetailTab,
    setOffset: state.setOffset,
    showBillableOnly: state.showBillableOnly,
    showPricedOnly: state.showPricedOnly,
    specialTokenFilter: state.specialTokenFilter,
    streamFilter: state.streamFilter,
    timeRange: state.timeRange,
    tokenMax: state.tokenMax,
    tokenMin: state.tokenMin,
    triage: state.triage,
    view: state.view,
  });

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col gap-[var(--density-page-gap)]">
        <PageHeader
          title="Requests"
          description="Review routed requests, then inspect the linked audit capture directly in the side drawer."
        />

        {state.requestId !== null ? (
          <RequestFocusBanner
            requestId={state.requestId}
            detailTab={state.detailTab}
            onClear={state.clearRequestFocus}
          />
        ) : null}

        <FiltersBar
          clearAllFilters={state.clearAllFilters}
          connectionId={state.connectionId}
          connections={data.connections}
          endpointId={state.endpointId}
          endpoints={data.endpoints}
          latencyBucket={state.latencyBucket}
          modelId={state.modelId}
          models={data.models}
          outcomeFilter={state.outcomeFilter}
          providerType={state.providerType}
          providers={data.providers}
          refresh={data.refresh}
          searchQuery={state.searchQuery}
          setConnectionId={state.setConnectionId}
          setEndpointId={state.setEndpointId}
          setLatencyBucket={state.setLatencyBucket}
          setModelId={state.setModelId}
          setOutcomeFilter={state.setOutcomeFilter}
          setProviderType={state.setProviderType}
          setSearchQuery={state.setSearchQuery}
          setShowBillableOnly={state.setShowBillableOnly}
          setShowPricedOnly={state.setShowPricedOnly}
          setSpecialTokenFilter={state.setSpecialTokenFilter}
          setStreamFilter={state.setStreamFilter}
          setTimeRange={state.setTimeRange}
          setTokenMax={state.setTokenMax}
          setTokenMaxInput={state.setTokenMaxInput}
          setTokenMin={state.setTokenMin}
          setTokenMinInput={state.setTokenMinInput}
          setTriage={state.setTriage}
          setView={state.setView}
          showBillableOnly={state.showBillableOnly}
          showPricedOnly={state.showPricedOnly}
          specialTokenFilter={state.specialTokenFilter}
          streamFilter={state.streamFilter}
          timeRange={state.timeRange}
          tokenMaxInput={state.tokenMaxInput}
          tokenMinInput={state.tokenMinInput}
          triage={state.triage}
          view={state.view}
        />

        <RequestLogsTable
          rows={data.displayedRows}
          pageRowCount={data.displayedPageRowCount}
          loading={data.displayedLoading}
          total={data.displayedTotal}
          limit={state.limit}
          offset={state.offset}
          setLimit={state.setLimit}
          setOffset={state.setOffset}
          view={state.view}
          allColumnsMode={data.allColumnsMode}
          openLogDetail={data.openLogDetail}
          clearAllFilters={state.clearAllFilters}
          formatTime={formatTime}
          navigateToConnection={navigateToConnection}
          emptyStateTitle={state.requestId !== null ? `Request #${state.requestId} was not found` : undefined}
          emptyStateDescription={
            state.requestId !== null
              ? "That request is not available in the currently selected profile. Return to the browser to keep investigating nearby traffic."
              : undefined
          }
          emptyStateAction={
            state.requestId !== null ? (
              <Button variant="outline" onClick={state.clearRequestFocus}>
                Return to request browser
              </Button>
            ) : undefined
          }
        />

        <RequestLogDetailSheet
          selectedLog={data.selectedLog}
          setSelectedLog={data.setSelectedLog}
          setModelId={state.setModelId}
          setProviderType={state.setProviderType}
          setConnectionId={state.setConnectionId}
          setOffset={state.setOffset}
          navigateToConnection={navigateToConnection}
          formatTime={formatTime}
          requestId={state.requestId}
          detailTab={state.detailTab}
          setDetailTab={state.setDetailTab}
          clearRequestFocus={state.clearRequestFocus}
        />
      </div>
    </TooltipProvider>
  );
}
