import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useTimezone } from "@/hooks/useTimezone";
import { api } from "@/lib/api";
import type { Endpoint } from "@/lib/types";
import { useProfileContext } from "@/context/ProfileContext";
import type { EndpointFormValues } from "./EndpointDialog";
import { useEndpointBootstrapData } from "./useEndpointBootstrapData";
import { useEndpointReorder } from "./useEndpointReorder";

export function useEndpointsPageData() {
  const [isDeletingEndpoint, setIsDeletingEndpoint] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<Endpoint | null>(null);
  const [duplicatingEndpointId, setDuplicatingEndpointId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Endpoint | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { revision } = useProfileContext();
  const { format: formatTime } = useTimezone();
  const { commitEndpoints, endpointModels, endpoints, isLoading, setEndpoints } =
    useEndpointBootstrapData(revision);
  const reorder = useEndpointReorder({ endpoints, revision, setEndpoints });

  const handleCreate = async (values: EndpointFormValues) => {
    try {
      const created = await api.endpoints.create(values);
      toast.success("Endpoint created");
      setIsCreateOpen(false);
      commitEndpoints(
        (current) => [...current, created].sort((left, right) => left.position - right.position),
        (current) => ({ ...current, [created.id]: [] }),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create endpoint");
    }
  };

  const handleUpdate = async (values: EndpointFormValues) => {
    if (!editingEndpoint) {
      return;
    }

    try {
      const updated = await api.endpoints.update(editingEndpoint.id, {
        name: values.name,
        base_url: values.base_url,
        ...(values.api_key.trim() ? { api_key: values.api_key } : {}),
      });
      toast.success("Endpoint updated");
      setEditingEndpoint(null);
      commitEndpoints((current) =>
        current.map((endpoint) => (endpoint.id === updated.id ? updated : endpoint)),
      );
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
      commitEndpoints(
        (current) => current.filter((endpoint) => endpoint.id !== id),
        (current) => {
          const next = { ...current };
          delete next[id];
          return next;
        },
      );
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
      commitEndpoints(
        (current) => [...current, duplicate].sort((left, right) => left.position - right.position),
        (current) => ({ ...current, [duplicate.id]: [] }),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to duplicate endpoint");
    } finally {
      setDuplicatingEndpointId(null);
    }
  };

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

  const handleDeleteDialogOpenChange = (open: boolean) => {
    if (!open && !isDeletingEndpoint) {
      setDeleteTarget(null);
    }
  };

  return {
    deleteError,
    deleteTarget,
    duplicatingEndpointId,
    editingEndpoint,
    endpointModels,
    endpoints,
    endpointsInUse,
    formatTime,
    handleCreate,
    handleDelete,
    handleDeleteDialogOpenChange,
    handleDuplicateEndpoint,
    handleUpdate,
    isCreateOpen,
    isDeletingEndpoint,
    isLoading,
    setDeleteError,
    setDeleteTarget,
    setEditingEndpoint,
    setIsCreateOpen,
    ...reorder,
    totalAttachedModels,
    uniqueAttachedModels,
  };
}
