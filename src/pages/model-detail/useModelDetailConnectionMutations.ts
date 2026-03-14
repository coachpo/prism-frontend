import { useCallback } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { clearSharedReferenceData } from "@/lib/referenceData";
import type {
  Connection,
  ConnectionCreate,
  ConnectionUpdate,
  EndpointCreate,
} from "@/lib/types";
import type { HeaderRow } from "./useModelDetailDialogState";

interface UseModelDetailConnectionMutationsInput {
  id: string | undefined;
  revision: number;
  createMode: "select" | "new";
  selectedEndpointId: string;
  newEndpointForm: EndpointCreate;
  connectionForm: ConnectionCreate;
  headerRows: HeaderRow[];
  editingConnection: Connection | null;
  endpointSourceDefaultName: string | null;
  setIsConnectionDialogOpen: (open: boolean) => void;
  fetchModel: () => Promise<void>;
}

export function useModelDetailConnectionMutations({
  id,
  revision,
  createMode,
  selectedEndpointId,
  newEndpointForm,
  connectionForm,
  headerRows,
  editingConnection,
  endpointSourceDefaultName,
  setIsConnectionDialogOpen,
  fetchModel,
}: UseModelDetailConnectionMutationsInput) {
  const handleConnectionSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (!id) {
        return;
      }

      const payload = buildConnectionPayload({
        createMode,
        selectedEndpointId,
        newEndpointForm,
        connectionForm,
        headerRows,
        editingConnection,
        endpointSourceDefaultName,
      });

      if (!payload) {
        return;
      }

      try {
        if (editingConnection) {
          const updateData: ConnectionUpdate = { ...payload };
          await api.connections.update(editingConnection.id, updateData);
          toast.success("Connection updated");
        } else {
          await api.connections.create(Number.parseInt(id, 10), payload);
          toast.success("Connection created");
        }
        clearSharedReferenceData(undefined, revision);
        setIsConnectionDialogOpen(false);
        void fetchModel();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to save connection");
      }
    },
    [
      connectionForm,
      createMode,
      editingConnection,
      endpointSourceDefaultName,
      fetchModel,
      headerRows,
      id,
      newEndpointForm,
      revision,
      selectedEndpointId,
      setIsConnectionDialogOpen,
    ],
  );

  const handleDeleteConnection = useCallback(
    async (connectionId: number) => {
      try {
        await api.connections.delete(connectionId);
        clearSharedReferenceData(undefined, revision);
        toast.success("Connection deleted");
        void fetchModel();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to delete connection");
      }
    },
    [fetchModel, revision],
  );

  const handleToggleActive = useCallback(
    async (connection: Connection) => {
      try {
        await api.connections.update(connection.id, { is_active: !connection.is_active });
        clearSharedReferenceData(undefined, revision);
        void fetchModel();
      } catch {
        toast.error("Failed to toggle connection");
      }
    },
    [fetchModel, revision],
  );

  return {
    handleConnectionSubmit,
    handleDeleteConnection,
    handleToggleActive,
  };
}

interface BuildConnectionPayloadInput {
  createMode: "select" | "new";
  selectedEndpointId: string;
  newEndpointForm: EndpointCreate;
  connectionForm: ConnectionCreate;
  headerRows: HeaderRow[];
  editingConnection: Connection | null;
  endpointSourceDefaultName: string | null;
}

function buildConnectionPayload({
  createMode,
  selectedEndpointId,
  newEndpointForm,
  connectionForm,
  headerRows,
  editingConnection,
  endpointSourceDefaultName,
}: BuildConnectionPayloadInput): ConnectionCreate | null {
  const customHeaders =
    headerRows.length > 0
      ? Object.fromEntries(
          headerRows.filter((row) => row.key.trim()).map((row) => [row.key.trim(), row.value]),
        )
      : null;

  const typedConnectionName = (connectionForm.name ?? "").trim();
  const resolvedConnectionName =
    typedConnectionName.length > 0
      ? typedConnectionName
      : !editingConnection
        ? endpointSourceDefaultName
        : null;

  const payload: ConnectionCreate = {
    ...connectionForm,
    name: resolvedConnectionName,
    custom_headers: customHeaders,
    pricing_template_id: connectionForm.pricing_template_id,
  };

  if (createMode === "select") {
    if (!selectedEndpointId) {
      toast.error("Please select an endpoint");
      return null;
    }
    payload.endpoint_id = Number.parseInt(selectedEndpointId, 10);
    delete payload.endpoint_create;
    return payload;
  }

  if (!newEndpointForm.name || !newEndpointForm.base_url || !newEndpointForm.api_key) {
    toast.error("Please fill in all endpoint fields");
    return null;
  }

  payload.endpoint_create = newEndpointForm;
  delete payload.endpoint_id;
  return payload;
}
