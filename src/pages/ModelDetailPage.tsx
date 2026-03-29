import { Navigate, useParams, useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useModelDetailData } from "./model-detail/useModelDetailData";
import { useModelDetailPageShell } from "./model-detail/useModelDetailPageShell";
import { ModelDetailHeader } from "./model-detail/ModelDetailHeader";
import { ModelDetailTabs } from "./model-detail/ModelDetailTabs";
import { OverviewCards } from "./model-detail/OverviewCards";
import { ConnectionDialog } from "./model-detail/ConnectionDialog";
import { ModelSettingsDialog } from "./model-detail/ModelSettingsDialog";
import { getModelDetailPath } from "./model-detail/modelDetailMetricsAndPaths";

export function ModelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeTab, navigateBackToModels, navigateToRequestLogs, setActiveTab } =
    useModelDetailPageShell(navigate);

  const {
    model,
    loading,
    loadbalanceStrategies,
    vendors,
    isEditModelDialogOpen,
    setIsEditModelDialogOpen,
    editLoadbalanceStrategyId,
    setEditLoadbalanceStrategyId,
    spending,
    spendingLoading,
    spendingCurrencySymbol,
    spendingCurrencyCode,
    metrics24hLoading,
    connectionMetricsEnabled,
    connectionMetricsLoading,
    connections,
    isConnectionDialogOpen,
    setIsConnectionDialogOpen,
    editingConnection,
    connectionSearch,
    setConnectionSearch,
    setConnectionMetricsEnabled,
    healthCheckingIds,
    dialogTestingConnection,
    dialogTestResult,
    connectionMetrics24h,
    currentStateByConnectionId,
    resettingConnectionIds,
    focusedConnectionId,
    connectionCardRefs,
    globalEndpoints,
    createMode,
    setCreateMode,
    selectedEndpointId,
    setSelectedEndpointId,
    newEndpointForm,
    setNewEndpointForm,
    connectionForm,
    setConnectionForm,
    headerRows,
    setHeaderRows,
    modelKpis,
    proxyTargetSummary,
    endpointSourceDefaultName,
    openConnectionDialog,
    handleConnectionSubmit,
    handleDeleteConnection,
    handleHealthCheck,
    handleHealthCheckAll,
    handleDialogTestConnection,
    handleToggleActive,
    handleEditModelSubmit,
    pricingTemplates,
    reorderInFlight,
    handleReorderConnections,
    handleResetCooldown,
  } = useModelDetailData(id);

  if (loading) {
    return (
      <div className="space-y-[var(--density-page-gap)]">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-7 w-48" />
        </div>
        <Skeleton className="h-[120px] rounded-xl" />
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  if (!model) return null;

  if (model.model_type === "proxy") {
    return <Navigate to={getModelDetailPath(model)} replace />;
  }

  return (
    <div className="space-y-[var(--density-page-gap)] pb-2">
      <ModelDetailHeader
        model={model}
        onBack={navigateBackToModels}
        onEditModel={() => setIsEditModelDialogOpen(true)}
      />

      <OverviewCards
        model={model}
        spending={spending}
        spendingLoading={spendingLoading}
        spendingCurrencySymbol={spendingCurrencySymbol}
        spendingCurrencyCode={spendingCurrencyCode}
        metrics24hLoading={metrics24hLoading}
        modelKpis={modelKpis}
        proxyTargetSummary={proxyTargetSummary}
        onViewRequestLogs={() => navigateToRequestLogs(model.model_id)}
      />
      <ModelDetailTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        model={model}
        connections={connections}
        connectionSearch={connectionSearch}
        setConnectionSearch={setConnectionSearch}
        setConnectionMetricsEnabled={setConnectionMetricsEnabled}
        openConnectionDialog={openConnectionDialog}
        handleDeleteConnection={handleDeleteConnection}
        handleHealthCheck={handleHealthCheck}
        handleHealthCheckAll={handleHealthCheckAll}
        handleToggleActive={handleToggleActive}
        handleReorderConnections={handleReorderConnections}
        connectionMetricsEnabled={connectionMetricsEnabled}
        connectionMetricsLoading={connectionMetricsLoading}
        connectionMetrics24h={connectionMetrics24h}
        currentStateByConnectionId={currentStateByConnectionId}
        resettingConnectionIds={resettingConnectionIds}
        healthCheckingIds={healthCheckingIds}
        focusedConnectionId={focusedConnectionId}
        connectionCardRefs={connectionCardRefs}
        reorderInFlight={reorderInFlight}
        handleResetCooldown={handleResetCooldown}
      />

      <ConnectionDialog
        isOpen={isConnectionDialogOpen}
        onOpenChange={setIsConnectionDialogOpen}
        editingConnection={editingConnection}
        connectionForm={connectionForm}
        setConnectionForm={setConnectionForm}
        newEndpointForm={newEndpointForm}
        setNewEndpointForm={setNewEndpointForm}
        createMode={createMode}
        setCreateMode={setCreateMode}
        selectedEndpointId={selectedEndpointId}
        setSelectedEndpointId={setSelectedEndpointId}
        globalEndpoints={globalEndpoints}
        headerRows={headerRows}
        setHeaderRows={setHeaderRows}
        handleConnectionSubmit={handleConnectionSubmit}
        dialogTestingConnection={dialogTestingConnection}
        dialogTestResult={dialogTestResult}
        handleDialogTestConnection={handleDialogTestConnection}
        endpointSourceDefaultName={endpointSourceDefaultName}
        modelApiFamily={model.api_family}
        pricingTemplates={pricingTemplates}
      />

      <ModelSettingsDialog
        editLoadbalanceStrategyId={editLoadbalanceStrategyId}
        isOpen={isEditModelDialogOpen}
        loadbalanceStrategies={loadbalanceStrategies}
        onOpenChange={setIsEditModelDialogOpen}
        model={model}
        vendors={vendors}
        setEditLoadbalanceStrategyId={setEditLoadbalanceStrategyId}
        handleEditModelSubmit={handleEditModelSubmit}
      />
    </div>
  );
}
