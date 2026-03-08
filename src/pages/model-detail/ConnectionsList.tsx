import { useMemo, useState, type ButtonHTMLAttributes } from "react";
import { Link } from "react-router-dom";
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
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { StatusBadge, ValueBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import {
  Search,
  Plus,
  Pencil,
  Activity,
  Trash2,
  Loader2,
  Info,
  Route,
  Shield,
  MoreHorizontal,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTimezone } from "@/hooks/useTimezone";
import { getConnectionName, buildLogsDeepLink, formatLatencyForDisplay } from "./modelDetailMetricsAndPaths";
import type { ConnectionDerivedMetrics } from "./modelDetailMetricsAndPaths";
import type { Connection, ModelConfig } from "@/lib/types";

interface ConnectionsListProps {
  model: ModelConfig;
  connections: Connection[];
  connectionSearch: string;
  setConnectionSearch: (search: string) => void;
  openConnectionDialog: (connection?: Connection) => void;
  handleDeleteConnection: (id: number) => void;
  handleHealthCheck: (id: number) => void;
  handleToggleActive: (connection: Connection) => void;
  handleReorderConnections: (connectionId: number, toIndex: number) => Promise<void>;
  connectionMetrics24h: Map<number, ConnectionDerivedMetrics>;
  healthCheckingIds: Set<number>;
  focusedConnectionId: number | null;
  connectionCardRefs: Map<number, HTMLDivElement>;
  reorderInFlight: boolean;
}

interface ConnectionCardViewProps {
  connection: Connection;
  model: ModelConfig;
  metrics24h: ConnectionDerivedMetrics | undefined;
  isChecking: boolean;
  isFocused: boolean;
  formatTime: (isoString: string, options?: Intl.DateTimeFormatOptions) => string;
  reorderDisabled: boolean;
  isDragging?: boolean;
  isOverlay?: boolean;
  dragHandleAttributes?: ButtonHTMLAttributes<HTMLButtonElement>;
  dragHandleListeners?: ButtonHTMLAttributes<HTMLButtonElement>;
  dragHandleRef?: ((node: HTMLButtonElement | null) => void) | null;
  cardRef?: (node: HTMLDivElement | null) => void;
  onEdit: (connection: Connection) => void;
  onDelete: (id: number) => void;
  onHealthCheck: (id: number) => void;
  onToggleActive: (connection: Connection) => void;
}

type SortableConnectionCardProps = ConnectionCardViewProps;

function ConnectionCardView({
  connection,
  model,
  metrics24h,
  isChecking,
  isFocused,
  formatTime,
  reorderDisabled,
  isDragging = false,
  isOverlay = false,
  dragHandleAttributes,
  dragHandleListeners,
  dragHandleRef,
  cardRef,
  onEdit,
  onDelete,
  onHealthCheck,
  onToggleActive,
}: ConnectionCardViewProps) {
  const successRate = metrics24h?.success_rate_24h ?? null;
  const endpoint = connection.endpoint;
  const connectionName = getConnectionName(connection);
  const maskedKey = endpoint?.api_key && endpoint.api_key.length > 8
    ? `${endpoint.api_key.slice(0, 4)}••••••${endpoint.api_key.slice(-4)}`
    : "••••••";

  return (
    <div
      ref={cardRef}
      tabIndex={cardRef ? -1 : undefined}
      className={cn(
        "group rounded-xl border bg-card p-4 transition-[border-color,box-shadow,opacity,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        isFocused && "border-primary/30 bg-muted/20 ring-2 ring-primary/40",
        !isFocused && !isDragging && "hover:border-border",
        isDragging && "border-dashed border-primary/40 bg-muted/30 opacity-30",
        isOverlay && "scale-[1.02] cursor-grabbing border-primary/50 opacity-95 shadow-2xl ring-2 ring-primary/30"
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <button
            type="button"
            ref={dragHandleRef ?? undefined}
            disabled={reorderDisabled || isOverlay}
            className={cn(
              "mt-0.5 flex h-11 w-11 shrink-0 touch-none items-center justify-center rounded-lg border border-transparent text-muted-foreground/60 transition-colors sm:h-9 sm:w-9",
              !reorderDisabled && !isOverlay && "cursor-grab hover:text-foreground active:cursor-grabbing",
              (reorderDisabled || isOverlay) && "cursor-default opacity-30",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
            aria-label={`Drag to reorder connection ${connectionName}`}
            {...(dragHandleAttributes ?? {})}
            {...(dragHandleListeners ?? {})}
          >
            <GripVertical className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn(
                "inline-flex h-2.5 w-2.5 shrink-0 rounded-full",
                isChecking
                  ? "animate-pulse bg-primary/70"
                  : connection.health_status === "healthy"
                    ? "bg-emerald-500"
                    : connection.health_status === "unhealthy"
                      ? "bg-destructive"
                      : "bg-muted-foreground/50"
              )} />
              <span className="truncate text-sm font-medium">{connectionName}</span>
              <StatusBadge
                label={
                  isChecking
                    ? "Checking"
                    : connection.health_status === "healthy"
                      ? "Healthy"
                      : connection.health_status === "unhealthy"
                        ? "Unhealthy"
                        : "Unknown"
                }
                intent={
                  isChecking
                    ? "info"
                    : connection.health_status === "healthy"
                      ? "success"
                      : connection.health_status === "unhealthy"
                        ? "danger"
                        : "muted"
                }
              />
              <ValueBadge
                label={`P${connection.priority}`}
                intent={connection.priority === 0 ? "success" : connection.priority >= 10 ? "warning" : "muted"}
                className="tabular-nums"
              />
              <StatusBadge
                label={connection.pricing_template ? "Pricing On" : "Pricing Off"}
                intent={connection.pricing_template ? "success" : "muted"}
              />
              {connection.pricing_template ? (
                <div className="flex items-center gap-1">
                  <ValueBadge label={connection.pricing_template.name} intent="info" />
                  <ValueBadge label={`v${connection.pricing_template.version}`} intent="muted" />
                  <ValueBadge label={connection.pricing_template.pricing_currency_code} intent="accent" />
                </div>
              ) : null}
              {!connection.is_active ? <StatusBadge label="Inactive" intent="muted" /> : null}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="truncate font-medium">{endpoint?.name ?? "Unknown endpoint"}</span>
              <span className="text-muted-foreground/70">•</span>
              <span className="font-mono break-all">{endpoint?.base_url}</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>Key: {maskedKey}</span>
              {isChecking ? (
                <span className="inline-flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Checking now...
                </span>
              ) : connection.last_health_check ? (
                <span>
                  Checked {formatTime(connection.last_health_check, { hour: "numeric", minute: "numeric", second: "numeric", hour12: true })}
                </span>
              ) : (
                <span>Not checked yet</span>
              )}
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <span>Success rate (24h)</span>
                <span className="text-[10px]">n={(metrics24h?.request_count_24h ?? 0).toLocaleString()}</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5" />
                    </TooltipTrigger>
                    <TooltipContent className="pointer-events-none">
                      <p className="text-xs">
                        Success rate = successful requests / total requests for this connection in the last 24 hours. n = total requests counted in that 24h window.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <Link
                to={buildLogsDeepLink({
                  modelId: model.model_id,
                  connectionId: connection.id,
                  timeRange: "24h",
                  status: "all",
                })}
                className="block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-center gap-2 pt-0.5 hover:opacity-90">
                  <Progress
                    value={successRate ?? 0}
                    className={cn(
                      "h-1.5",
                      successRate === null
                        ? "[&>[data-slot=progress-indicator]]:bg-muted-foreground/40"
                        : successRate >= 95
                          ? "[&>[data-slot=progress-indicator]]:bg-emerald-500"
                          : successRate >= 80
                            ? "[&>[data-slot=progress-indicator]]:bg-amber-500"
                            : "[&>[data-slot=progress-indicator]]:bg-red-500"
                    )}
                  />
                  <span className={cn(
                    "shrink-0 text-[10px] font-medium tabular-nums",
                    successRate === null
                      ? "text-muted-foreground"
                      : successRate >= 95
                        ? "text-emerald-600 dark:text-emerald-400"
                        : successRate >= 80
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-red-600 dark:text-red-400"
                  )}>
                    {successRate === null ? "-" : `${successRate.toFixed(1)}%`}
                  </span>
                </div>
              </Link>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded border px-2 py-1.5">
                  <p className="text-muted-foreground">P95 latency (24h)</p>
                  <p className="font-medium tabular-nums">
                    {formatLatencyForDisplay(metrics24h?.p95_latency_ms ?? null)}
                  </p>
                </div>
                <div className="rounded border px-2 py-1.5">
                  <p className="text-muted-foreground">5xx rate (sampled)</p>
                  <p className="font-medium tabular-nums">
                    {metrics24h?.five_xx_rate === null || metrics24h?.five_xx_rate === undefined
                      ? "-"
                      : `${metrics24h.five_xx_rate.toFixed(1)}%`}
                  </p>
                </div>
              </div>

              <div className="rounded border border-dashed px-2 py-1.5 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Route className="h-3.5 w-3.5" />
                  Failover-like signals (derived from 5xx)
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <span>Events: {metrics24h?.heuristic_failover_events ?? 0}</span>
                  <span>
                    Last: {metrics24h?.last_failover_like_at ? formatTime(metrics24h.last_failover_like_at) : "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!isOverlay ? (
          <div className="flex shrink-0 items-center gap-2">
            <Switch
              checked={connection.is_active}
              onCheckedChange={() => onToggleActive(connection)}
              className="scale-90 data-[state=checked]:bg-emerald-500"
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(connection)}>
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onHealthCheck(connection.id)} disabled={isChecking}>
                  {isChecking ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Activity className="mr-2 h-3.5 w-3.5" />
                  )}
                  Health Check
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(connection.id)}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SortableConnectionCard({ connection, reorderDisabled = false, ...props }: SortableConnectionCardProps) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: connection.id,
    disabled: reorderDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ConnectionCardView
        {...props}
        connection={connection}
        isDragging={isDragging}
        reorderDisabled={reorderDisabled}
        dragHandleAttributes={attributes as ButtonHTMLAttributes<HTMLButtonElement>}
        dragHandleListeners={listeners as ButtonHTMLAttributes<HTMLButtonElement> | undefined}
        dragHandleRef={setActivatorNodeRef}
      />
    </div>
  );
}

export function ConnectionsList({
  model,
  connections,
  connectionSearch,
  setConnectionSearch,
  openConnectionDialog,
  handleDeleteConnection,
  handleHealthCheck,
  handleToggleActive,
  handleReorderConnections,
  connectionMetrics24h,
  healthCheckingIds,
  focusedConnectionId,
  connectionCardRefs,
  reorderInFlight,
}: ConnectionsListProps) {
  const { format: formatTime } = useTimezone();
  const [activeDragId, setActiveDragId] = useState<UniqueIdentifier | null>(null);

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

  const normalizedSearch = connectionSearch.trim().toLowerCase();
  const hasActiveFilter = normalizedSearch.length > 0;

  const filteredConnections = useMemo(() => {
    const visibleConnections = hasActiveFilter
      ? connections.filter((connection) => (
          getConnectionName(connection).toLowerCase().includes(normalizedSearch) ||
          (connection.endpoint?.name || "").toLowerCase().includes(normalizedSearch) ||
          (connection.endpoint?.base_url || "").toLowerCase().includes(normalizedSearch)
        ))
      : connections;

    return [...visibleConnections].sort((left, right) => left.priority - right.priority || left.id - right.id);
  }, [connections, hasActiveFilter, normalizedSearch]);

  const connectionIds = useMemo(
    () => filteredConnections.map((connection) => connection.id),
    [filteredConnections]
  );

  const activeDragConnection = useMemo(
    () => connections.find((connection) => connection.id === activeDragId) ?? null,
    [activeDragId, connections]
  );

  const canReorder = connections.length > 1 && !hasActiveFilter && !reorderInFlight;

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

    if (!canReorder) {
      return;
    }

    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const fromIndex = connections.findIndex((connection) => connection.id === active.id);
    const toIndex = connections.findIndex((connection) => connection.id === over.id);

    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
      return;
    }

    await handleReorderConnections(Number(active.id), toIndex);
  };

  const helperText = reorderInFlight
    ? "Saving your new connection order. Drag handles are temporarily disabled until the update finishes."
    : hasActiveFilter
      ? "Reordering is disabled while filters are active. Clear the filter to adjust routing priority."
      : connections.length > 1
        ? "Drag cards by the handle to change routing priority. Keyboard users can focus a handle, press Space, move with arrow keys, and press Space again to drop."
        : "Add at least two connections to enable drag-and-drop ordering.";

  return (
    <>
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">
            Connections
            <span className="ml-2 text-xs font-normal text-muted-foreground">({connections.length})</span>
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Health checks run automatically when this page opens. Use manual check for spot validation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {connections.length > 3 ? (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Filter connections..."
                value={connectionSearch}
                onChange={(event) => setConnectionSearch(event.target.value)}
                className="h-8 w-48 pl-8 text-xs"
              />
            </div>
          ) : null}
          <Button size="sm" onClick={() => openConnectionDialog()}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Connection
          </Button>
        </div>
      </div>

      {connections.length > 0 ? (
        <div className="flex items-start gap-2 rounded-xl border border-border/70 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          {reorderInFlight ? (
            <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary" />
          ) : (
            <GripVertical className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <span>{helperText}</span>
            {hasActiveFilter ? (
              <Button
                type="button"
                variant="link"
                size="xs"
                className="h-auto p-0 text-xs"
                onClick={() => setConnectionSearch("")}
              >
                Clear filter
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {filteredConnections.length === 0 ? (
        <EmptyState
          icon={<Shield className="h-6 w-6" />}
          title={connectionSearch ? "No connections match your filter" : "No connections configured"}
          description={connectionSearch ? "Try a different search term" : "Add a connection to start routing requests"}
          action={!connectionSearch ? (
            <Button size="sm" onClick={() => openConnectionDialog()}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Connection
            </Button>
          ) : undefined}
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
          <SortableContext items={connectionIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {filteredConnections.map((connection) => {
                const metrics24h = connectionMetrics24h.get(connection.id);
                const isChecking = healthCheckingIds.has(connection.id);
                const isFocused = focusedConnectionId === connection.id;

                return (
                  <SortableConnectionCard
                    key={connection.id}
                    connection={connection}
                    model={model}
                    metrics24h={metrics24h}
                    isChecking={isChecking}
                    isFocused={isFocused}
                    formatTime={formatTime}
                    reorderDisabled={!canReorder}
                    cardRef={(node) => {
                      if (node) {
                        connectionCardRefs.set(connection.id, node);
                      } else {
                        connectionCardRefs.delete(connection.id);
                      }
                    }}
                    onEdit={openConnectionDialog}
                    onDelete={handleDeleteConnection}
                    onHealthCheck={handleHealthCheck}
                    onToggleActive={handleToggleActive}
                  />
                );
              })}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeDragConnection ? (
              <div className="w-full">
                <ConnectionCardView
                  connection={activeDragConnection}
                  model={model}
                  metrics24h={connectionMetrics24h.get(activeDragConnection.id)}
                  isChecking={healthCheckingIds.has(activeDragConnection.id)}
                  isFocused={false}
                  formatTime={formatTime}
                  reorderDisabled
                  isOverlay
                  onEdit={openConnectionDialog}
                  onDelete={handleDeleteConnection}
                  onHealthCheck={handleHealthCheck}
                  onToggleActive={handleToggleActive}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </>
  );
}
