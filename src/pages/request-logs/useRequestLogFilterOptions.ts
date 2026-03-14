import { useEffect, useState } from "react";
import {
  getSharedConnectionOptions,
  getSharedEndpoints,
  getSharedModels,
  getSharedProviders,
} from "@/lib/referenceData";
import type { ConnectionDropdownItem, Endpoint, Provider } from "@/lib/types";

type ModelOption = { model_id: string; display_name: string | null };

export function useRequestLogFilterOptions(revision: number) {
  const [models, setModels] = useState<ModelOption[]>([]);
  const [connections, setConnections] = useState<ConnectionDropdownItem[]>([]);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);

  useEffect(() => {
    let active = true;

    const fetchFilters = async () => {
      const [modelsResult, connectionsResult, endpointsResult, providersResult] =
        await Promise.allSettled([
          getSharedModels(revision),
          getSharedConnectionOptions(revision),
          getSharedEndpoints(revision),
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
        console.error("Failed to load request-log models", modelsResult.reason);
      }

      if (connectionsResult.status === "fulfilled") {
        setConnections(connectionsResult.value);
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

    return () => {
      active = false;
    };
  }, [revision]);

  return { connections, endpoints, models, providers };
}
