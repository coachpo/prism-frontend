import { Plus } from "lucide-react";
import { useProfileContext } from "@/context/ProfileContext";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteModelDialog } from "./models/DeleteModelDialog";
import { ModelDialog } from "./models/ModelDialog";
import { ModelsTable } from "./models/ModelsTable";
import { ModelsToolbar } from "./models/ModelsToolbar";
import { useModelsPageData } from "./models/useModelsPageData";

export function ModelsPage() {
  const { revision } = useProfileContext();
  const data = useModelsPageData(revision);

  if (data.loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Card className="gap-0">
          <CardHeader className="border-b">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <Skeleton className="h-9 w-full xl:max-w-sm" />
              <div className="flex flex-wrap items-center gap-3">
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-9 w-28" />
                <Skeleton className="h-9 w-28" />
                <Skeleton className="h-9 w-28" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Skeleton className="h-[500px] rounded-none border-0" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Models" description={`${data.models.length} model configurations`}>
        <Button size="sm" onClick={() => data.handleOpenDialog()}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Model
        </Button>
      </PageHeader>

      <Card className="gap-0">
        <CardHeader className="border-b">
          <ModelsToolbar
            providerFilter={data.providerFilter}
            providers={data.providers}
            resetVisibleColumns={data.resetVisibleColumns}
            search={data.search}
            setProviderFilter={data.setProviderFilter}
            setSearch={data.setSearch}
            setStatusFilter={data.setStatusFilter}
            setTypeFilter={data.setTypeFilter}
            statusFilter={data.statusFilter}
            typeFilter={data.typeFilter}
            updateColumnVisibility={data.updateColumnVisibility}
            visibleColumns={data.visibleColumns}
          />
        </CardHeader>
        <CardContent className="p-0">
          <ModelsTable
            activeColumns={data.activeColumns}
            filtered={data.filtered}
            handleOpenDialog={data.handleOpenDialog}
            hasActiveFilters={data.hasActiveFilters}
            metricsLoading={data.metricsLoading}
            modelMetrics24h={data.modelMetrics24h}
            modelSpend30dMicros={data.modelSpend30dMicros}
            search={data.search}
            setDeleteTarget={data.setDeleteTarget}
          />
        </CardContent>
      </Card>

      <ModelDialog
        editingModel={data.editingModel}
        formData={data.formData}
        isDialogOpen={data.isDialogOpen}
        nativeModelsForProvider={data.nativeModelsForProvider}
        providers={data.providers}
        selectedProvider={data.selectedProvider}
        setFormData={data.setFormData}
        setIsDialogOpen={data.setIsDialogOpen}
        setLoadBalancingStrategy={data.setLoadBalancingStrategy}
        setModelType={data.setModelType}
        onSubmit={data.handleSubmit}
      />

      <DeleteModelDialog
        deleteTarget={data.deleteTarget}
        onDelete={data.handleDelete}
        setDeleteTarget={data.setDeleteTarget}
      />
    </div>
  );
}
