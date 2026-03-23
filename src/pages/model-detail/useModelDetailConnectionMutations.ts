import { useCallback } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { clearSharedReferenceData } from "@/lib/referenceData";
import type {
  Connection,
  ConnectionCreate,
  Endpoint,
  EndpointCreate,
  ModelConfig,
  ModelConfigListItem,
} from "@/lib/types";
import type { HeaderRow } from "./useModelDetailDialogState";
import {
  patchModelListConnectionCounts,
  removeConnectionFromList,
  upsertConnectionInList,
  upsertEndpointInList,
} from "./useModelDetailDataSupport";

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
  refreshCurrentState: () => void | Promise<void>;
  setIsConnectionDialogOpen: (open: boolean) => void;
  setAllModels: React.Dispatch<React.SetStateAction<ModelConfigListItem[]>>;
  setConnections: React.Dispatch<React.SetStateAction<Connection[]>>;
  setGlobalEndpoints: React.Dispatch<React.SetStateAction<Endpoint[]>>;
  setModel: React.Dispatch<React.SetStateAction<ModelConfig | null>>;
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
  refreshCurrentState,
  setIsConnectionDialogOpen,
  setAllModels,
  setConnections,
  setGlobalEndpoints,
  setModel,
}: UseModelDetailConnectionMutationsInput) {
  const modelConfigId = id ? Number.parseInt(id, 10) : NaN;

  const commitConnections = useCallback(
    (updater: (current: Connection[]) => Connection[]) => {
      setConnections((current) => {
        const next = updater(current);
        setModel((previousModel) => (
          previousModel ? { ...previousModel, connections: next } : previousModel
        ));
        if (Number.isFinite(modelConfigId)) {
          setAllModels((currentModels) => patchModelListConnectionCounts(currentModels, modelConfigId, next));
        }
        return next;
      });
    },
    [modelConfigId, setAllModels, setConnections, setModel],
  );

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
        const savedConnection = editingConnection
          ? await api.connections.update(editingConnection.id, { ...payload })
          : await api.connections.create(Number.parseInt(id, 10), payload);

        if (editingConnection) {
          toast.success("Connection updated");
        } else {
          toast.success("Connection created");
        }

        clearSharedReferenceData(undefined, revision);
        setGlobalEndpoints((current) => upsertEndpointInList(current, savedConnection.endpoint));
        commitConnections((current) => upsertConnectionInList(current, savedConnection));
        setIsConnectionDialogOpen(false);
        void refreshCurrentState();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to save connection");
      }
    },
    [
      connectionForm,
      createMode,
      editingConnection,
      endpointSourceDefaultName,
      headerRows,
      id,
      newEndpointForm,
      refreshCurrentState,
      revision,
      selectedEndpointId,
      commitConnections,
      setGlobalEndpoints,
      setIsConnectionDialogOpen,
    ],
  );

  const handleDeleteConnection = useCallback(
    async (connectionId: number) => {
      try {
        await api.connections.delete(connectionId);
        clearSharedReferenceData(undefined, revision);
        commitConnections((current) => removeConnectionFromList(current, connectionId));
        void refreshCurrentState();
        toast.success("Connection deleted");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to delete connection");
      }
    },
    [commitConnections, refreshCurrentState, revision],
  );

  const handleToggleActive = useCallback(
    async (connection: Connection) => {
      try {
        const updatedConnection = await api.connections.update(connection.id, {
          is_active: !connection.is_active,
        });
        clearSharedReferenceData(undefined, revision);
        setGlobalEndpoints((current) => upsertEndpointInList(current, updatedConnection.endpoint));
        commitConnections((current) => upsertConnectionInList(current, updatedConnection));
        void refreshCurrentState();
      } catch {
        toast.error("Failed to toggle connection");
      }
    },
    [commitConnections, refreshCurrentState, revision, setGlobalEndpoints],
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
