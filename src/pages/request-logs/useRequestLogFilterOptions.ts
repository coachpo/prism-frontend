import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ConnectionDropdownItem, Endpoint } from "@/lib/types";

type ModelOption = { model_id: string; display_name: string | null };

export function useRequestLogFilterOptions(revision: number) {
  const [models, setModels] = useState<ModelOption[]>([]);
  const [connections, setConnections] = useState<ConnectionDropdownItem[]>([]);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [modelsData, connectionsData, endpointsData] = await Promise.all([
          api.models.list(),
          api.endpoints.connections(),
          api.endpoints.list(),
        ]);
        setModels(
          modelsData.map((model) => ({
            model_id: model.model_id,
            display_name: model.display_name,
          }))
        );
        setConnections(connectionsData.items);
        setEndpoints(endpointsData);
      } catch (error) {
        console.error("Failed to load request-log filters", error);
      }
    };

    void fetchFilters();
  }, [revision]);

  return { connections, endpoints, models };
}
