import { DragOverlay, DndContext } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Plug, Plus } from "lucide-react";
import { EndpointDialog } from "./endpoints/EndpointDialog";
import { EndpointCardView, SortableEndpointCard } from "./endpoints/EndpointCard";
import { DeleteEndpointDialog } from "./endpoints/DeleteEndpointDialog";
import { EndpointsSummaryCards } from "./endpoints/EndpointsSummaryCards";
import { useEndpointsPageData } from "./endpoints/useEndpointsPageData";

export function EndpointsPage() {
  const data = useEndpointsPageData();

  return (
    <div className="space-y-[var(--density-page-gap)]">
      <PageHeader
        title="Endpoints"
        description="Manage profile-scoped API credentials and model routing targets."
      >
        <Button onClick={() => data.setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Endpoint
        </Button>
      </PageHeader>

      {data.deleteError ? (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <h5 className="font-medium leading-none tracking-tight">Cannot Delete Endpoint</h5>
          </div>
          <div className="mt-2 text-sm opacity-90">{data.deleteError}</div>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 border-destructive/20 hover:bg-destructive/20"
            onClick={() => data.setDeleteError(null)}
          >
            Dismiss
          </Button>
        </div>
      ) : null}

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
          title="No endpoints configured"
          description="Add your first endpoint to start routing requests."
          action={
            <Button onClick={() => data.setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Endpoint
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
        title="Add Endpoint"
        submitLabel="Create Endpoint"
      />

      <EndpointDialog
        open={!!data.editingEndpoint}
        onOpenChange={(open) => !open && data.setEditingEndpoint(null)}
        onSubmit={data.handleUpdate}
        initialValues={data.editingEndpoint || undefined}
        title="Edit Endpoint"
        submitLabel="Save Changes"
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
