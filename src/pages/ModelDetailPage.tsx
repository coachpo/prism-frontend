import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, TypeBadge } from "@/components/StatusBadge";
import { ArrowLeft, Pencil } from "lucide-react";
import { useModelDetailData } from "./model-detail/useModelDetailData";
import { OverviewCards } from "./model-detail/OverviewCards";
import { ConnectionsList } from "./model-detail/ConnectionsList";
import { ConnectionDialog } from "./model-detail/ConnectionDialog";
import { ModelSettingsDialog } from "./model-detail/ModelSettingsDialog";

export function ModelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const {
    model,
    loading,
    isEditModelDialogOpen,
    setIsEditModelDialogOpen,
    editRedirectTo,
    setEditRedirectTo,
    spending,
    spendingLoading,
    spendingCurrencySymbol,
    spendingCurrencyCode,
    metrics24hLoading,
    connections,
    isConnectionDialogOpen,
    setIsConnectionDialogOpen,
    editingConnection,
    connectionSearch,
    setConnectionSearch,
    healthCheckingIds,
    dialogTestingConnection,
    dialogTestResult,
    connectionMetrics24h,
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
    handleDialogTestConnection,
    handleToggleActive,
    handleEditModelSubmit,
    pricingTemplates,
    reorderInFlight,
    handleReorderConnections,
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
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-md" onClick={() => navigate("/models")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold tracking-tight truncate">
                {model.display_name || model.model_id}
              </h1>
              <TypeBadge
                label={model.model_type}
                intent={model.model_type === "proxy" ? "accent" : "info"}
              />
              <StatusBadge
                label={model.is_enabled ? "Enabled" : "Disabled"}
                intent={model.is_enabled ? "success" : "muted"}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground font-mono">
              {model.display_name ? model.model_id : "Model configuration and connection routing"}
            </p>
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
      />

      <ConnectionsList
        model={model}
        connections={connections}
        connectionSearch={connectionSearch}
        setConnectionSearch={setConnectionSearch}
        openConnectionDialog={openConnectionDialog}
        handleDeleteConnection={handleDeleteConnection}
        handleHealthCheck={handleHealthCheck}
        handleToggleActive={handleToggleActive}
        handleReorderConnections={handleReorderConnections}
        connectionMetrics24h={connectionMetrics24h}
        healthCheckingIds={healthCheckingIds}
        focusedConnectionId={focusedConnectionId}
        connectionCardRefs={connectionCardRefs}
        reorderInFlight={reorderInFlight}
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
        pricingTemplates={pricingTemplates}
      />

      <ModelSettingsDialog
        isOpen={isEditModelDialogOpen}
        onOpenChange={setIsEditModelDialogOpen}
        model={model}
        editRedirectTo={editRedirectTo}
        setEditRedirectTo={setEditRedirectTo}
        handleEditModelSubmit={handleEditModelSubmit}
        redirectTargetOptions={redirectTargetOptions}
      />
    </div>
  );
}
