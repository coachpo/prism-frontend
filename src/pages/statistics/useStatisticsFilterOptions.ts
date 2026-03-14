import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ConnectionDropdownItem } from "@/lib/types";

export type StatisticsModelOption = {
  model_id: string;
  display_name: string | null;
};

export function useStatisticsFilterOptions(revision: number) {
  const [models, setModels] = useState<StatisticsModelOption[]>([]);
  const [connections, setConnections] = useState<ConnectionDropdownItem[]>([]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [modelsData, connectionsData] = await Promise.all([
          api.models.list(),
          api.endpoints.connections(),
        ]);
        setModels(
          modelsData.map((model) => ({
            model_id: model.model_id,
            display_name: model.display_name,
          }))
        );
        setConnections(connectionsData.items);
      } catch (error) {
        console.error("Failed to fetch filter options:", error);
      }
    };

    void fetchFilters();
  }, [revision]);

  return { connections, models };
}
