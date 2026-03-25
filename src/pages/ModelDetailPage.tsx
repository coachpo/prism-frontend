import { useParams, useNavigate } from "react-router-dom";
import { CopyButton } from "@/components/CopyButton";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge, TypeBadge } from "@/components/StatusBadge";
import { ArrowLeft, Pencil } from "lucide-react";
import { useModelDetailData } from "./model-detail/useModelDetailData";
import { useModelDetailPageShell } from "./model-detail/useModelDetailPageShell";
import { LoadbalanceEventsTab } from "./model-detail/LoadbalanceEventsTab";
import { OverviewCards } from "./model-detail/OverviewCards";
import { ConnectionsList } from "./model-detail/ConnectionsList";
import { ConnectionDialog } from "./model-detail/ConnectionDialog";
import { ModelSettingsDialog } from "./model-detail/ModelSettingsDialog";

export function ModelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeTab, navigateBackToModels, navigateToRequestLogs, setActiveTab } =
    useModelDetailPageShell(navigate);

  const {
    model,
    loading,
    loadbalanceStrategies,
    isEditModelDialogOpen,
    setIsEditModelDialogOpen,
    editLoadbalanceStrategyId,
    setEditLoadbalanceStrategyId,
    editRedirectTo,
    setEditRedirectTo,
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
    redirectTargetOptions,
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

  return (
    <div className="space-y-[var(--density-page-gap)] pb-2">
      <div className="rounded-2xl border bg-card p-4 sm:p-5">
        <div className="relative flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-md" onClick={navigateBackToModels}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold tracking-tight truncate">
                {model.display_name || model.model_id}
              </h1>
              {!model.display_name ? (
                <CopyButton
                  value={model.model_id}
                  label=""
                  targetLabel="Model ID"
                  aria-label={`Copy model ID ${model.model_id}`}
                  variant="ghost"
                  size="icon-xs"
                  className="h-7 w-7 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
                />
              ) : null}
              <TypeBadge
                label={model.model_type}
                intent={model.model_type === "proxy" ? "accent" : "info"}
              />
              <StatusBadge
                label={model.is_enabled ? "Enabled" : "Disabled"}
                intent={model.is_enabled ? "success" : "muted"}
              />
            </div>
            {model.display_name ? (
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <span className="font-mono">{model.model_id}</span>
                <CopyButton
                  value={model.model_id}
                  label=""
                  targetLabel="Model ID"
                  aria-label={`Copy model ID ${model.model_id}`}
                  variant="ghost"
                  size="icon-xs"
                  className="h-7 w-7 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
                />
              </div>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">Model configuration and connection routing</p>
            )}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            aria-label="Edit Model"
            onClick={() => setIsEditModelDialogOpen(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <OverviewCards
        model={model}
        spending={spending}
        spendingLoading={spendingLoading}
        spendingCurrencySymbol={spendingCurrencySymbol}
        spendingCurrencyCode={spendingCurrencyCode}
        metrics24hLoading={metrics24hLoading}
        modelKpis={modelKpis}
        onViewRequestLogs={() => navigateToRequestLogs(model.model_id)}
      />

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "connections" | "events")} className="space-y-4">
        <TabsList className="grid h-11 w-full max-w-md grid-cols-2 rounded-xl bg-muted/70 p-1">
          <TabsTrigger value="connections" className="rounded-lg text-sm font-medium">
            Connections
          </TabsTrigger>
          <TabsTrigger value="events" className="rounded-lg text-sm font-medium">
            Loadbalance Events
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="mt-0 space-y-4">
          <ConnectionsList
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
        </TabsContent>

        <TabsContent value="events" className="mt-0 space-y-4">
          <LoadbalanceEventsTab modelId={model.model_id} />
        </TabsContent>
      </Tabs>

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
        pricingTemplates={pricingTemplates}
      />

      <ModelSettingsDialog
        editLoadbalanceStrategyId={editLoadbalanceStrategyId}
        isOpen={isEditModelDialogOpen}
        loadbalanceStrategies={loadbalanceStrategies}
        onOpenChange={setIsEditModelDialogOpen}
        model={model}
        editRedirectTo={editRedirectTo}
        setEditLoadbalanceStrategyId={setEditLoadbalanceStrategyId}
        setEditRedirectTo={setEditRedirectTo}
        handleEditModelSubmit={handleEditModelSubmit}
        redirectTargetOptions={redirectTargetOptions}
      />
    </div>
  );
}
