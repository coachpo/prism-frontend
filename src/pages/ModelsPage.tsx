import { Plus } from "lucide-react";
import { useProfileContext } from "@/context/ProfileContext";
import { useLocale } from "@/i18n/useLocale";
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
  const { locale } = useLocale();
  const data = useModelsPageData(revision);

  if (data.loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Card className="gap-0">
          <CardHeader className="border-b">
            <Skeleton className="h-9 w-full xl:max-w-sm" />
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
      <PageHeader
        title={locale === "zh-CN" ? "模型" : "Models"}
        description={
          locale === "zh-CN"
            ? `${data.models.length} 个模型配置`
            : `${data.models.length} model configurations`
        }
      >
        <Button size="sm" onClick={() => data.handleOpenDialog()}>
          <Plus className="mr-1.5 h-4 w-4" />
          {locale === "zh-CN" ? "新建模型" : "New Model"}
        </Button>
      </PageHeader>

      <div className="space-y-4">
        <ModelsToolbar
          search={data.search}
          setSearch={data.setSearch}
        />
        <ModelsTable
          filtered={data.filtered}
          handleOpenDialog={data.handleOpenDialog}
          metricsLoading={data.metricsLoading}
          modelMetrics24h={data.modelMetrics24h}
          modelSpend30dMicros={data.modelSpend30dMicros}
          search={data.search}
          setDeleteTarget={data.setDeleteTarget}
        />
      </div>

      <ModelDialog
        editingModel={data.editingModel}
        formData={data.formData}
        isDialogOpen={data.isDialogOpen}
        loadbalanceStrategies={data.loadbalanceStrategies}
        nativeModelsForProvider={data.nativeModelsForProvider}
        providers={data.providers}
        selectedProvider={data.selectedProvider}
        setFormData={data.setFormData}
        setIsDialogOpen={data.setIsDialogOpen}
        setLoadbalanceStrategyId={data.setLoadbalanceStrategyId}
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
