import { useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import type { EndpointOwnerResponse } from "@/lib/types";
import { toast } from "sonner";

const ownerCache = new Map<number, EndpointOwnerResponse>();

export function useEndpointNavigation() {
  const navigate = useNavigate();
  const navigatingRef = useRef(false);

  const navigateToEndpoint = useCallback(
    async (endpointId: number) => {
      if (navigatingRef.current) return;
      navigatingRef.current = true;

      try {
        let owner = ownerCache.get(endpointId);
        if (!owner) {
          owner = await api.endpoints.owner(endpointId);
          ownerCache.set(endpointId, owner);
        }
        navigate(`/models/${owner.model_config_id}?focus_endpoint_id=${endpointId}`);
      } catch {
        toast.error("Endpoint not found — it may have been deleted");
      } finally {
        navigatingRef.current = false;
      }
    },
    [navigate]
  );

  return { navigateToEndpoint };
}
