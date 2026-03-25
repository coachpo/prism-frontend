import { DragOverlay, DndContext } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { EmptyState } from "@/components/EmptyState";
import { useLocale } from "@/i18n/useLocale";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plug, Plus } from "lucide-react";
import { EndpointDialog } from "./endpoints/EndpointDialog";
import { EndpointCardView, SortableEndpointCard } from "./endpoints/EndpointCard";
import { DeleteEndpointDialog } from "./endpoints/DeleteEndpointDialog";
import { EndpointsSummaryCards } from "./endpoints/EndpointsSummaryCards";
import { useEndpointsPageData } from "./endpoints/useEndpointsPageData";

export function EndpointsPage() {
  const { locale } = useLocale();
  const data = useEndpointsPageData();

  return (
    <div className="space-y-[var(--density-page-gap)]">
      <PageHeader
        title={locale === "zh-CN" ? "端点" : "Endpoints"}
        description={
          locale === "zh-CN"
            ? "管理按配置档案划分的 API 凭证和模型路由目标。"
            : "Manage profile-scoped API credentials and model routing targets."
        }
      >
        <Button onClick={() => data.setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {locale === "zh-CN" ? "新增端点" : "Add Endpoint"}
        </Button>
      </PageHeader>

      {!data.isLoading ? (
        <EndpointsSummaryCards
          endpointsCount={data.endpoints.length}
          totalAttachedModels={data.totalAttachedModels}
          uniqueAttachedModels={data.uniqueAttachedModels}
          endpointsInUse={data.endpointsInUse}
        />
      ) : null}

      {data.isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <Skeleton key={index} className="h-[88px] rounded-xl" />
          ))}
        </div>
      ) : data.endpoints.length === 0 ? (
        <EmptyState
          icon={<Plug className="h-6 w-6" />}
          title={locale === "zh-CN" ? "还没有配置端点" : "No endpoints configured"}
          description={
            locale === "zh-CN"
              ? "新增你的第一个端点以开始路由请求。"
              : "Add your first endpoint to start routing requests."
          }
          action={
            <Button onClick={() => data.setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {locale === "zh-CN" ? "新增端点" : "Add Endpoint"}
            </Button>
          }
        />
      ) : (
        <DndContext
          sensors={data.sensors}
          collisionDetection={data.collisionDetection}
          onDragStart={data.handleDragStart}
          onDragCancel={data.handleDragCancel}
          onDragEnd={(event) => {
            void data.handleDragEnd(event);
          }}
        >
          <SortableContext items={data.endpointIds} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-3">
              {data.endpoints.map((endpoint) => (
                <SortableEndpointCard
                  key={endpoint.id}
                  endpoint={endpoint}
                  formatTime={data.formatTime}
                  models={data.endpointModels[endpoint.id] ?? []}
                  isDuplicating={data.duplicatingEndpointId === endpoint.id}
                  reorderDisabled={!data.canReorder}
                  onDuplicate={data.handleDuplicateEndpoint}
                  onEdit={data.setEditingEndpoint}
                  onDelete={data.setDeleteTarget}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {data.activeDragEndpoint ? (
              <div className="h-full">
                <EndpointCardView
                  endpoint={data.activeDragEndpoint}
                  formatTime={data.formatTime}
                  models={data.endpointModels[data.activeDragEndpoint.id] ?? []}
                  isOverlay
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <EndpointDialog
        open={data.isCreateOpen}
        onOpenChange={data.setIsCreateOpen}
        onSubmit={data.handleCreate}
        title={locale === "zh-CN" ? "新增端点" : "Add Endpoint"}
        submitLabel={locale === "zh-CN" ? "创建端点" : "Create Endpoint"}
      />

      <EndpointDialog
        open={!!data.editingEndpoint}
        onOpenChange={(open) => !open && data.setEditingEndpoint(null)}
        onSubmit={data.handleUpdate}
        initialValues={data.editingEndpoint || undefined}
        title={locale === "zh-CN" ? "编辑端点" : "Edit Endpoint"}
        submitLabel={locale === "zh-CN" ? "保存更改" : "Save Changes"}
      />

      <DeleteEndpointDialog
        deleteTarget={data.deleteTarget}
        isDeletingEndpoint={data.isDeletingEndpoint}
        onOpenChange={data.handleDeleteDialogOpenChange}
        onConfirm={data.handleDelete}
      />
    </div>
  );
}
