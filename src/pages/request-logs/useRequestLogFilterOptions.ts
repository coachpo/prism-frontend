import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ConnectionDropdownItem, Endpoint, Provider } from "@/lib/types";

type ModelOption = { model_id: string; display_name: string | null };

export function useRequestLogFilterOptions(revision: number) {
  const [models, setModels] = useState<ModelOption[]>([]);
  const [connections, setConnections] = useState<ConnectionDropdownItem[]>([]);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);

  useEffect(() => {
    const fetchFilters = async () => {
      const [modelsResult, connectionsResult, endpointsResult, providersResult] =
        await Promise.allSettled([
          api.models.list(),
          api.endpoints.connections(),
          api.endpoints.list(),
          api.providers.list(),
        ]);

      if (modelsResult.status === "fulfilled") {
        setModels(
          modelsResult.value.map((model) => ({
            model_id: model.model_id,
            display_name: model.display_name,
          }))
        );
      } else {
        console.error("Failed to load request-log models", modelsResult.reason);
      }

      if (connectionsResult.status === "fulfilled") {
        setConnections(connectionsResult.value.items);
      } else {
        console.error("Failed to load request-log connections", connectionsResult.reason);
      }

      if (endpointsResult.status === "fulfilled") {
        setEndpoints(endpointsResult.value);
      } else {
        console.error("Failed to load request-log endpoints", endpointsResult.reason);
      }

      if (providersResult.status === "fulfilled") {
        setProviders(providersResult.value);
      } else {
        console.error("Failed to load request-log providers", providersResult.reason);
      }
    };

    void fetchFilters();
  }, [revision]);

  return { connections, endpoints, models, providers };
}
