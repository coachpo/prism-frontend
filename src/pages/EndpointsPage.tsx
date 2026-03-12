import { useCallback, useEffect, useMemo, useState, type ButtonHTMLAttributes } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Endpoint, ModelConfigListItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { useProfileContext } from "@/context/ProfileContext";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Pencil,
  Trash2,
  Copy,
  Plug,
  AlertTriangle,
  Boxes,
  Link2,
  Sparkles,
  Loader2,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTimezone } from "@/hooks/useTimezone";
import { EndpointDialog, type EndpointFormValues } from "./endpoints/EndpointDialog";
import {
  getEndpointHost,
  getMaskedApiKey,
  getModelBadgeClass,
} from "./endpoints/endpointCardHelpers";

interface EndpointCardViewProps {
  endpoint: Endpoint;
  formatTime: (isoString: string, options?: Intl.DateTimeFormatOptions) => string;
  models: ModelConfigListItem[];
  isDragging?: boolean;
  isOverlay?: boolean;
  reorderDisabled?: boolean;
  isDuplicating?: boolean;
  dragHandleAttributes?: ButtonHTMLAttributes<HTMLButtonElement>;
  dragHandleListeners?: ButtonHTMLAttributes<HTMLButtonElement>;
  dragHandleRef?: ((node: HTMLButtonElement | null) => void) | null;
  onDelete?: (endpoint: Endpoint) => void | Promise<void>;
  onDuplicate?: (endpoint: Endpoint) => void | Promise<void>;
  onEdit?: (endpoint: Endpoint) => void | Promise<void>;
}

type SortableEndpointCardProps = EndpointCardViewProps;

function EndpointCardView({
  endpoint,
  formatTime,
  models,
  isDragging = false,
  isOverlay = false,
  reorderDisabled = false,
  isDuplicating = false,
  dragHandleAttributes,
  dragHandleListeners,
  dragHandleRef,
  onDelete,
  onDuplicate,
  onEdit,
}: EndpointCardViewProps) {
  const maskedKey = getMaskedApiKey(endpoint);

  return (
    <Card
      className={cn(
        "group flex h-full flex-col border-border/80 bg-card transition-[border-color,box-shadow,opacity] hover:border-border",
        isDragging && "border-dashed border-primary/40 bg-muted/30 opacity-30",
        isOverlay && "scale-[1.02] cursor-grabbing border-primary/50 shadow-2xl ring-2 ring-primary/30"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <button
            type="button"
            ref={dragHandleRef ?? undefined}
            disabled={reorderDisabled || isOverlay}
            className={cn(
              "mt-0.5 flex h-11 w-11 shrink-0 touch-none items-center justify-center rounded-lg border border-transparent text-muted-foreground/60 transition-colors sm:h-9 sm:w-9",
              !reorderDisabled && !isOverlay && "cursor-grab hover:text-foreground active:cursor-grabbing",
              (reorderDisabled || isOverlay) && "cursor-default opacity-60",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
            aria-label={`Drag to reorder endpoint ${endpoint.name}`}
            {...(dragHandleAttributes ?? {})}
            {...(dragHandleListeners ?? {})}
          >
            <GripVertical className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1 space-y-2">
            <CardTitle className="pr-2 text-base font-semibold whitespace-normal break-words [overflow-wrap:anywhere]">
              {endpoint.name}
            </CardTitle>
            <Badge
              variant="outline"
              className="max-w-full truncate border-border/70 bg-muted/30 px-2 py-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
            >
              {getEndpointHost(endpoint.base_url)}
            </Badge>
          </div>

          {!isOverlay ? (
            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Duplicate endpoint ${endpoint.name}`}
                className="h-9 w-9 rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                disabled={isDuplicating}
                onClick={() => {
                  void onDuplicate?.(endpoint);
                }}
              >
                {isDuplicating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Edit endpoint ${endpoint.name}`}
                className="h-9 w-9 rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                onClick={() => {
                  void onEdit?.(endpoint);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete endpoint ${endpoint.name}`}
                className="h-9 w-9 rounded-md text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => {
                  void onDelete?.(endpoint);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="space-y-2">
          <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Base URL
            </p>
            <p className="mt-1 break-all font-mono text-xs text-foreground/90">{endpoint.base_url}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  API Key
                </p>
                <p className="mt-1 break-all font-mono text-xs text-foreground/90">{maskedKey}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Attached Models
            </p>
            <Badge
              variant="outline"
              className="rounded-full border-border/70 bg-background px-2 py-0 text-[10px] font-medium text-muted-foreground"
            >
              {models.length}
            </Badge>
          </div>
          {models.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {models.slice(0, 5).map((model) => (
                <Badge
                  key={model.id}
                  variant="outline"
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-[10px] font-medium",
                    getModelBadgeClass(model)
                  )}
                >
                  {model.display_name || model.model_id}
                </Badge>
              ))}
              {models.length > 5 ? (
                <Badge
                  variant="outline"
                  className="rounded-full border-border/70 bg-muted/30 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                >
                  +{models.length - 5} more
                </Badge>
              ) : null}
            </div>
          ) : (
            <p className="text-xs italic text-muted-foreground">Not attached to any models</p>
          )}
        </div>

        <div className="mt-auto border-t border-dashed border-border/70 pt-3">
          <p className="text-[11px] text-muted-foreground">
            Created {formatTime(endpoint.created_at, { year: "numeric", month: "short", day: "numeric" })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function SortableEndpointCard({ endpoint, reorderDisabled = false, ...props }: SortableEndpointCardProps) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: endpoint.id,
    disabled: reorderDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="h-full">
      <EndpointCardView
        {...props}
        endpoint={endpoint}
        isDragging={isDragging}
        reorderDisabled={reorderDisabled}
        dragHandleAttributes={attributes as ButtonHTMLAttributes<HTMLButtonElement>}
        dragHandleListeners={listeners as ButtonHTMLAttributes<HTMLButtonElement> | undefined}
        dragHandleRef={setActivatorNodeRef}
      />
    </div>
  );
}

export function EndpointsPage() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [endpointModels, setEndpointModels] = useState<Record<number, ModelConfigListItem[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingEndpoint, setIsDeletingEndpoint] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<Endpoint | null>(null);
  const [duplicatingEndpointId, setDuplicatingEndpointId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Endpoint | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<UniqueIdentifier | null>(null);
  const [reorderInFlight, setReorderInFlight] = useState(false);
  const { revision } = useProfileContext();
  const { format: formatTime } = useTimezone();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchEndpoints = useCallback(async () => {
    try {
      const data = await api.endpoints.list();
      setEndpoints(data);

      const modelsMap: Record<number, ModelConfigListItem[]> = {};
      await Promise.all(
        data.map(async (endpoint) => {
          try {
            const models = await api.models.byEndpoint(endpoint.id);
            modelsMap[endpoint.id] = models;
          } catch (error) {
            console.error(`Failed to fetch models for endpoint ${endpoint.id}`, error);
            modelsMap[endpoint.id] = [];
          }
        })
      );
      setEndpointModels(modelsMap);
    } catch {
      toast.error("Failed to load endpoints");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    void fetchEndpoints();
  }, [fetchEndpoints, revision]);

  const handleCreate = async (values: EndpointFormValues) => {
    try {
      await api.endpoints.create(values);
      toast.success("Endpoint created");
      setIsCreateOpen(false);
      await fetchEndpoints();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create endpoint");
    }
  };

  const handleUpdate = async (values: EndpointFormValues) => {
    if (!editingEndpoint) return;
    try {
      await api.endpoints.update(editingEndpoint.id, {
        name: values.name,
        base_url: values.base_url,
        ...(values.api_key.trim() ? { api_key: values.api_key } : {}),
      });
      toast.success("Endpoint updated");
      setEditingEndpoint(null);
      await fetchEndpoints();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update endpoint");
    }
  };

  const handleDelete = async (id: number) => {
    setIsDeletingEndpoint(true);
    try {
      await api.endpoints.delete(id);
      toast.success("Endpoint deleted");
      setDeleteTarget(null);
      setDeleteError(null);
      await fetchEndpoints();
    } catch (error) {
      setDeleteTarget(null);
      if (error instanceof Error) {
        const normalizedMessage = error.message.toLowerCase();
        if (
          normalizedMessage.includes("dependency") ||
          normalizedMessage.includes("409") ||
          normalizedMessage.includes("cannot delete endpoint") ||
          normalizedMessage.includes("referenced by connections")
        ) {
          setDeleteError(error.message);
          return;
        }
      }
      toast.error(error instanceof Error ? error.message : "Failed to delete endpoint");
    } finally {
      setIsDeletingEndpoint(false);
    }
  };

  const handleDuplicateEndpoint = async (endpoint: Endpoint) => {
    setDuplicatingEndpointId(endpoint.id);
    try {
      const duplicate = await api.endpoints.duplicate(endpoint.id);
      toast.success(`Endpoint duplicated as ${duplicate.name}`);
      await fetchEndpoints();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to duplicate endpoint");
    } finally {
      setDuplicatingEndpointId(null);
    }
  };

  const endpointIds = useMemo(() => endpoints.map((endpoint) => endpoint.id), [endpoints]);

  const activeDragEndpoint = useMemo(
    () => endpoints.find((endpoint) => endpoint.id === activeDragId) ?? null,
    [activeDragId, endpoints]
  );

  const totalAttachedModels = useMemo(
    () => Object.values(endpointModels).reduce((sum, models) => sum + models.length, 0),
    [endpointModels]
  );

  const uniqueAttachedModels = useMemo(() => {
    const ids = new Set<string>();
    Object.values(endpointModels).forEach((models) => {
      models.forEach((model) => {
        ids.add(model.model_id);
      });
    });
    return ids.size;
  }, [endpointModels]);

  const endpointsInUse = useMemo(
    () => endpoints.filter((endpoint) => (endpointModels[endpoint.id] ?? []).length > 0).length,
    [endpoints, endpointModels]
  );

  const canReorder = endpoints.length > 1 && !reorderInFlight;

  const handleDragStart = (event: DragStartEvent) => {
    if (!canReorder) {
      return;
    }
    setActiveDragId(event.active.id);
  };

  const handleDragCancel = () => {
    setActiveDragId(null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragId(null);

    const { active, over } = event;
    if (!over || active.id === over.id || reorderInFlight) {
      return;
    }

    const previousEndpoints = endpoints;
    const fromIndex = previousEndpoints.findIndex((endpoint) => endpoint.id === active.id);
    const toIndex = previousEndpoints.findIndex((endpoint) => endpoint.id === over.id);

    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
      return;
    }

    const nextEndpoints = arrayMove(previousEndpoints, fromIndex, toIndex);
    setEndpoints(nextEndpoints);
    setReorderInFlight(true);

    try {
      const orderedEndpoints = await api.endpoints.movePosition(Number(active.id), toIndex);
      setEndpoints(orderedEndpoints);
    } catch (error) {
      setEndpoints(previousEndpoints);
      toast.error(error instanceof Error ? error.message : "Failed to reorder endpoints");
    } finally {
      setReorderInFlight(false);
    }
  };

  return (
    <div className="space-y-[var(--density-page-gap)]">
      <PageHeader
        title="Endpoints"
        description="Manage profile-scoped API credentials and model routing targets."
      >
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Endpoint
        </Button>
      </PageHeader>

      {!isLoading ? (
        <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          {reorderInFlight ? (
            <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary" />
          ) : (
            <GripVertical className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <p>
            {reorderInFlight
              ? "Saving your new endpoint order. Drag handles are temporarily disabled until the update finishes."
              : endpoints.length > 1
                ? "Drag and drop cards using the handle to reorder your endpoints. Keyboard users can focus a handle, press Space, move with arrow keys, and press Space again to drop."
                : "Add at least two endpoints to enable drag-and-drop ordering."}
          </p>
        </div>
      ) : null}

      {deleteError ? (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <h5 className="font-medium leading-none tracking-tight">Cannot Delete Endpoint</h5>
          </div>
          <div className="mt-2 text-sm opacity-90">{deleteError}</div>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 border-destructive/20 hover:bg-destructive/20"
            onClick={() => setDeleteError(null)}
          >
            Dismiss
          </Button>
        </div>
      ) : null}

      {!isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Configured Endpoints
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums">{endpoints.length}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary">
                <Boxes className="h-4 w-4" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Attached Models
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums">{totalAttachedModels}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary">
                <Link2 className="h-4 w-4" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Unique Models In Use
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums">{uniqueAttachedModels}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {endpointsInUse} of {endpoints.length} endpoints mapped
            </p>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <Skeleton key={index} className="h-[280px] rounded-xl" />
          ))}
        </div>
      ) : endpoints.length === 0 ? (
        <EmptyState
          icon={<Plug className="h-6 w-6" />}
          title="No endpoints configured"
          description="Add your first endpoint to start routing requests."
          action={
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Endpoint
            </Button>
          }
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragCancel={handleDragCancel}
          onDragEnd={(event) => {
            void handleDragEnd(event);
          }}
        >
          <SortableContext items={endpointIds} strategy={rectSortingStrategy}>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {endpoints.map((endpoint) => (
                <SortableEndpointCard
                  key={endpoint.id}
                  endpoint={endpoint}
                  formatTime={formatTime}
                  models={endpointModels[endpoint.id] ?? []}
                  isDuplicating={duplicatingEndpointId === endpoint.id}
                  reorderDisabled={!canReorder}
                  onDuplicate={handleDuplicateEndpoint}
                  onEdit={setEditingEndpoint}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeDragEndpoint ? (
              <div className="h-full">
                <EndpointCardView
                  endpoint={activeDragEndpoint}
                  formatTime={formatTime}
                  models={endpointModels[activeDragEndpoint.id] ?? []}
                  isOverlay
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <EndpointDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreate}
        title="Add Endpoint"
        submitLabel="Create Endpoint"
      />

      <EndpointDialog
        open={!!editingEndpoint}
        onOpenChange={(open) => !open && setEditingEndpoint(null)}
        onSubmit={handleUpdate}
        initialValues={editingEndpoint || undefined}
        title="Edit Endpoint"
        submitLabel="Save Changes"
      />

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !isDeletingEndpoint) {
            setDeleteTarget(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Endpoint</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={isDeletingEndpoint}
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDeletingEndpoint || !deleteTarget}
              onClick={() => {
                if (!deleteTarget) return;
                void handleDelete(deleteTarget.id);
              }}
            >
              {isDeletingEndpoint ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
