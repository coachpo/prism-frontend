import { useEffect, useState } from "react";
import {
  getSharedConnectionOptions,
  getSharedModels,
  getSharedVendors,
} from "@/lib/referenceData";
import type { ApiFamily, ConnectionDropdownItem, Vendor } from "@/lib/types";

const DEFAULT_API_FAMILIES: ApiFamily[] = ["openai", "anthropic", "gemini"];

export type StatisticsModelOption = {
  model_id: string;
  display_name: string | null;
};

export function useStatisticsFilterOptions(revision: number) {
  const [apiFamilies, setApiFamilies] = useState<ApiFamily[]>(DEFAULT_API_FAMILIES);
  const [models, setModels] = useState<StatisticsModelOption[]>([]);
  const [connections, setConnections] = useState<ConnectionDropdownItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  useEffect(() => {
    let active = true;

    const fetchFilters = async () => {
      const [modelsResult, connectionsResult, vendorsResult] = await Promise.allSettled([
        getSharedModels(revision),
        getSharedConnectionOptions(revision),
        getSharedVendors(revision),
      ]);

      if (!active) {
        return;
      }

      if (modelsResult.status === "fulfilled") {
        const nextApiFamilies = Array.from(
          new Set(modelsResult.value.flatMap((model) => (model.api_family ? [model.api_family] : []))),
        ) as ApiFamily[];

        setModels(
          modelsResult.value.map((model) => ({
            model_id: model.model_id,
            display_name: model.display_name,
          }))
        );
        setApiFamilies(nextApiFamilies.length > 0 ? nextApiFamilies : DEFAULT_API_FAMILIES);
      } else {
        console.error("Failed to fetch statistics models", modelsResult.reason);
      }

      if (connectionsResult.status === "fulfilled") {
        setConnections(connectionsResult.value);
      } else {
        console.error("Failed to fetch statistics connections", connectionsResult.reason);
      }

      if (vendorsResult.status === "fulfilled") {
        setVendors(vendorsResult.value);
      } else {
        console.error("Failed to fetch statistics vendors", vendorsResult.reason);
      }
    };

    void fetchFilters();

    return () => {
      active = false;
    };
  }, [revision]);

  return { apiFamilies, connections, models, vendors };
}
