import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ConnectionDropdownItem, Provider } from "@/lib/types";

export type StatisticsModelOption = {
  model_id: string;
  display_name: string | null;
};

export function useStatisticsFilterOptions(revision: number) {
  const [models, setModels] = useState<StatisticsModelOption[]>([]);
  const [connections, setConnections] = useState<ConnectionDropdownItem[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);

  useEffect(() => {
    const fetchFilters = async () => {
      const [modelsResult, connectionsResult, providersResult] = await Promise.allSettled([
        api.models.list(),
        api.endpoints.connections(),
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
        console.error("Failed to fetch statistics models", modelsResult.reason);
      }

      if (connectionsResult.status === "fulfilled") {
        setConnections(connectionsResult.value.items);
      } else {
        console.error("Failed to fetch statistics connections", connectionsResult.reason);
      }

      if (providersResult.status === "fulfilled") {
        setProviders(providersResult.value);
      } else {
        console.error("Failed to fetch statistics providers", providersResult.reason);
      }
    };

    void fetchFilters();
  }, [revision]);

  return { connections, models, providers };
}
