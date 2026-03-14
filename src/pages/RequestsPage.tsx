import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WebSocketStatusIndicator } from "@/components/WebSocketStatusIndicator";
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
  const { revision, selectedProfile } = useProfileContext();
  const state = useRequestLogPageState();
  const data = useRequestLogsPageData({
    connectionId: state.connectionId,
    detailTab: state.detailTab,
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
    selectedProfileId: selectedProfile?.id ?? null,
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
        >
          <WebSocketStatusIndicator
            connectionState={data.connectionState}
            isSyncing={data.isSyncing}
          />
        </PageHeader>

        {state.requestId !== null ? (
          <RequestFocusBanner
            requestId={state.requestId}
            detailTab={state.detailTab}
            onClear={state.clearRequestFocus}
          />
        ) : null}

        <FiltersBar
          view={state.view}
          setView={state.setView}
          triage={state.triage}
          setTriage={state.setTriage}
          searchQuery={state.searchQuery}
          setSearchQuery={state.setSearchQuery}
          timeRange={state.timeRange}
          setTimeRange={state.setTimeRange}
          showPricedOnly={state.showPricedOnly}
          setShowPricedOnly={state.setShowPricedOnly}
          showBillableOnly={state.showBillableOnly}
          setShowBillableOnly={state.setShowBillableOnly}
          modelId={state.modelId}
          setModelId={state.setModelId}
          models={data.models}
          providerType={state.providerType}
          setProviderType={state.setProviderType}
          connectionId={state.connectionId}
          setConnectionId={state.setConnectionId}
          connections={data.connections}
          endpointId={state.endpointId}
          setEndpointId={state.setEndpointId}
          endpoints={data.endpoints}
          outcomeFilter={state.outcomeFilter}
          setOutcomeFilter={state.setOutcomeFilter}
          streamFilter={state.streamFilter}
          setStreamFilter={state.setStreamFilter}
          latencyBucket={state.latencyBucket}
          setLatencyBucket={state.setLatencyBucket}
          specialTokenFilter={state.specialTokenFilter}
          setSpecialTokenFilter={state.setSpecialTokenFilter}
          tokenMinInput={state.tokenMinInput}
          setTokenMinInput={state.setTokenMinInput}
          setTokenMin={state.setTokenMin}
          tokenMaxInput={state.tokenMaxInput}
          setTokenMaxInput={state.setTokenMaxInput}
          setTokenMax={state.setTokenMax}
          setOffset={state.setOffset}
          clearAllFilters={state.clearAllFilters}
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
          scrollContainerRef={data.tableScrollRef}
          getRowClassName={(row) => (data.newLogIds.has(row.id) ? "ws-new-row" : undefined)}
          onRowAnimationEnd={(row) => data.clearNewLog(row.id)}
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
          auditRefreshKey={data.auditRefreshKey}
          detailTab={state.detailTab}
          setDetailTab={state.setDetailTab}
          clearRequestFocus={state.clearRequestFocus}
        />
      </div>
    </TooltipProvider>
  );
}
