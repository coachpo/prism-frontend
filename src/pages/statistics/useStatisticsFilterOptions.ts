import { useEffect, useState } from "react";
import {
  getSharedConnectionOptions,
  getSharedModels,
  getSharedProviders,
} from "@/lib/referenceData";
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
    let active = true;

    const fetchFilters = async () => {
      const [modelsResult, connectionsResult, providersResult] = await Promise.allSettled([
        getSharedModels(revision),
        getSharedConnectionOptions(revision),
        getSharedProviders(revision),
      ]);

      if (!active) {
        return;
      }

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
        setConnections(connectionsResult.value);
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

    return () => {
      active = false;
    };
  }, [revision]);

  return { connections, models, providers };
}
