import { useMemo, useState } from "react";
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
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/EmptyState";
import { useLocale } from "@/i18n/useLocale";
import { Activity, Loader2, Plus, Search, Shield } from "lucide-react";
import { useTimezone } from "@/hooks/useTimezone";
import type { LoadbalanceCurrentStateItem } from "@/lib/types";
import { ConnectionCard } from "./connections-list/ConnectionCard";
import { SortableConnectionCard } from "./connections-list/SortableConnectionCard";
import {
  filterAndSortConnections,
  normalizeConnectionSearch,
} from "./connections-list/connectionListUtils";
import type { ConnectionDerivedMetrics } from "./modelDetailMetricsAndPaths";
import type { Connection, ModelConfig } from "@/lib/types";

interface ConnectionsListProps {
  model: ModelConfig;
  connections: Connection[];
  connectionSearch: string;
  setConnectionSearch: (search: string) => void;
  setConnectionMetricsEnabled: (enabled: boolean) => void;
  openConnectionDialog: (connection?: Connection) => void;
  handleDeleteConnection: (id: number) => void;
  handleHealthCheck: (id: number) => void;
  handleHealthCheckAll: () => void;
  handleToggleActive: (connection: Connection) => void;
  handleReorderConnections: (connectionId: number, toIndex: number) => Promise<void>;
  connectionMetricsEnabled: boolean;
  connectionMetricsLoading: boolean;
  connectionMetrics24h: Map<number, ConnectionDerivedMetrics>;
  currentStateByConnectionId: Map<number, LoadbalanceCurrentStateItem>;
  resettingConnectionIds: Set<number>;
  healthCheckingIds: Set<number>;
  focusedConnectionId: number | null;
  connectionCardRefs: Map<number, HTMLDivElement>;
  reorderInFlight: boolean;
  handleResetCooldown: (connectionId: number) => void;
}

export function ConnectionsList({
  model,
  connections,
  connectionSearch,
  setConnectionSearch,
  setConnectionMetricsEnabled,
  openConnectionDialog,
  handleDeleteConnection,
  handleHealthCheck,
  handleHealthCheckAll,
  handleToggleActive,
  handleReorderConnections,
  connectionMetricsEnabled,
  connectionMetricsLoading,
  connectionMetrics24h,
  currentStateByConnectionId,
  resettingConnectionIds,
  healthCheckingIds,
  focusedConnectionId,
  connectionCardRefs,
  reorderInFlight,
  handleResetCooldown,
}: ConnectionsListProps) {
  const { messages } = useLocale();
  const copy = messages.modelDetail;
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

  const normalizedSearch = normalizeConnectionSearch(connectionSearch);
  const hasActiveFilter = normalizedSearch.length > 0;

  const filteredConnections = useMemo(() => {
    return filterAndSortConnections(connections, normalizedSearch);
  }, [connections, normalizedSearch]);

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

  return (
    <>
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">
            {copy.connections}
            <span className="ml-2 text-xs font-normal text-muted-foreground">({connections.length})</span>
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {copy.connectionsLoadOnDemandDescription}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setConnectionMetricsEnabled(true)}
            disabled={connectionMetricsEnabled || connectionMetricsLoading}
          >
            {connectionMetricsLoading ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : null}
            {connectionMetricsEnabled ? copy.metricsLoaded : copy.loadMetrics}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void handleHealthCheckAll()}
            disabled={connections.length === 0 || healthCheckingIds.size > 0}
          >
            {healthCheckingIds.size > 0 ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Activity className="mr-1.5 h-3.5 w-3.5" />
            )}
            {copy.checkAll}
          </Button>
          {connections.length > 3 ? (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={copy.filterConnections}
                value={connectionSearch}
                onChange={(event) => setConnectionSearch(event.target.value)}
                className="h-8 w-48 pl-8 text-xs"
              />
            </div>
          ) : null}
          <Button size="sm" onClick={() => openConnectionDialog()}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {copy.addConnection}
          </Button>
        </div>
      </div>

      {filteredConnections.length === 0 ? (
        <EmptyState
          icon={<Shield className="h-6 w-6" />}
          title={
            connectionSearch
              ? copy.noConnectionsMatchFilter
              : copy.noConnectionsConfigured
          }
          description={
            connectionSearch
              ? copy.tryDifferentSearchTerm
              : copy.addConnectionToStartRouting
          }
          action={!connectionSearch ? (
            <Button size="sm" onClick={() => openConnectionDialog()}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              {copy.addConnection}
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
                const loadbalanceCurrentState = currentStateByConnectionId.get(connection.id);
                const isChecking = healthCheckingIds.has(connection.id);
                const isFocused = focusedConnectionId === connection.id;
                const isResettingCooldown = resettingConnectionIds.has(connection.id);

                return (
                  <SortableConnectionCard
                    key={connection.id}
                    connection={connection}
                    model={model}
                    metrics24h={metrics24h}
                    loadbalanceCurrentState={loadbalanceCurrentState}
                    isChecking={isChecking}
                    isResettingCooldown={isResettingCooldown}
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
                    onResetCooldown={handleResetCooldown}
                    onToggleActive={handleToggleActive}
                  />
                );
              })}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeDragConnection ? (
              <div className="w-full">
                <ConnectionCard
                  connection={activeDragConnection}
                  model={model}
                  metrics24h={connectionMetrics24h.get(activeDragConnection.id)}
                  loadbalanceCurrentState={currentStateByConnectionId.get(activeDragConnection.id)}
                  isChecking={healthCheckingIds.has(activeDragConnection.id)}
                  isResettingCooldown={resettingConnectionIds.has(activeDragConnection.id)}
                  isFocused={false}
                  formatTime={formatTime}
                  reorderDisabled
                  isOverlay
                  onEdit={openConnectionDialog}
                  onDelete={handleDeleteConnection}
                  onHealthCheck={handleHealthCheck}
                  onResetCooldown={handleResetCooldown}
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
