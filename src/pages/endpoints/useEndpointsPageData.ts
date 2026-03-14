import { useCallback, useEffect, useMemo, useState } from "react";
import {
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
import { arrayMove, rectSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { toast } from "sonner";
import { useTimezone } from "@/hooks/useTimezone";
import { api } from "@/lib/api";
import type { Endpoint, ModelConfigListItem } from "@/lib/types";
import { useProfileContext } from "@/context/ProfileContext";
import type { EndpointFormValues } from "./EndpointDialog";

let endpointsPageBootstrapPromise:
  | {
      promise: Promise<{
        endpoints: Endpoint[];
        endpointModels: Record<number, ModelConfigListItem[]>;
      }>;
      revision: number;
    }
  | null = null;

export function useEndpointsPageData() {
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

  const applyBootstrapData = useCallback(
    (data: { endpoints: Endpoint[]; endpointModels: Record<number, ModelConfigListItem[]> }) => {
      setEndpoints(data.endpoints);
      setEndpointModels(data.endpointModels);
    },
    []
  );

  const fetchEndpoints = useCallback(async (currentRevision: number, reuseInFlight = false) => {
    if (reuseInFlight && endpointsPageBootstrapPromise?.revision === currentRevision) {
      return endpointsPageBootstrapPromise.promise;
    }

    const loadPromise = api.endpoints.list().then(async (data) => {
      if (data.length === 0) {
        return { endpointModels: {}, endpoints: data };
      }

      try {
        const response = await api.models.byEndpoints({
          endpoint_ids: data.map((endpoint) => endpoint.id),
        });
        const endpointModels = Object.fromEntries(
          response.items.map((item) => [item.endpoint_id, item.models])
        ) as Record<number, ModelConfigListItem[]>;
        return { endpointModels, endpoints: data };
      } catch (error) {
        console.error("Failed to load endpoint models", error);
        return { endpointModels: {}, endpoints: data };
      }
    });

    if (reuseInFlight) {
      endpointsPageBootstrapPromise = {
        promise: loadPromise,
        revision: currentRevision,
      };
      void loadPromise.finally(() => {
        if (endpointsPageBootstrapPromise?.promise === loadPromise) {
          endpointsPageBootstrapPromise = null;
        }
      });
    }

    return loadPromise;
  }, []);

  useEffect(() => {
    setIsLoading(true);
    let cancelled = false;

    void (async () => {
      try {
        const data = await fetchEndpoints(revision, true);
        if (cancelled) return;
        applyBootstrapData(data);
      } catch {
        if (!cancelled) {
          toast.error("Failed to load endpoints");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applyBootstrapData, fetchEndpoints, revision]);

  const handleCreate = async (values: EndpointFormValues) => {
    try {
      await api.endpoints.create(values);
      toast.success("Endpoint created");
      setIsCreateOpen(false);
      const data = await fetchEndpoints(revision, false);
      applyBootstrapData(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create endpoint");
    }
  };

  const handleUpdate = async (values: EndpointFormValues) => {
    if (!editingEndpoint) {
      return;
    }

    try {
      await api.endpoints.update(editingEndpoint.id, {
        name: values.name,
        base_url: values.base_url,
        ...(values.api_key.trim() ? { api_key: values.api_key } : {}),
      });
      toast.success("Endpoint updated");
      setEditingEndpoint(null);
      const data = await fetchEndpoints(revision, false);
      applyBootstrapData(data);
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
      const data = await fetchEndpoints(revision, false);
      applyBootstrapData(data);
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
      const data = await fetchEndpoints(revision, false);
      applyBootstrapData(data);
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

  const handleDeleteDialogOpenChange = (open: boolean) => {
    if (!open && !isDeletingEndpoint) {
      setDeleteTarget(null);
    }
  };

  return {
    activeDragEndpoint,
    canReorder,
    collisionDetection: closestCenter,
    deleteError,
    deleteTarget,
    duplicatingEndpointId,
    editingEndpoint,
    endpointIds,
    endpointModels,
    endpoints,
    endpointsInUse,
    formatTime,
    handleCreate,
    handleDelete,
    handleDeleteDialogOpenChange,
    handleDragCancel,
    handleDragEnd,
    handleDragStart,
    handleDuplicateEndpoint,
    handleUpdate,
    isCreateOpen,
    isDeletingEndpoint,
    isLoading,
    rectSortingStrategy,
    reorderInFlight,
    sensors,
    setDeleteError,
    setDeleteTarget,
    setEditingEndpoint,
    setIsCreateOpen,
    totalAttachedModels,
    uniqueAttachedModels,
  };
}
