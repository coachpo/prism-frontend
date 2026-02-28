import { useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import type { ConnectionOwnerResponse } from "@/lib/types";
import { useProfileContext } from "@/context/ProfileContext";
import { toast } from "sonner";

const ownerCacheByProfile = new Map<number, Map<number, ConnectionOwnerResponse>>();

export function useConnectionNavigation() {
  const navigate = useNavigate();
  const navigatingRef = useRef(false);
  const { selectedProfileId } = useProfileContext();

  const ownerCache = useMemo(() => {
    if (selectedProfileId === null) {
      return new Map<number, ConnectionOwnerResponse>();
    }

    const existing = ownerCacheByProfile.get(selectedProfileId);
    if (existing) return existing;

    const created = new Map<number, ConnectionOwnerResponse>();
    ownerCacheByProfile.set(selectedProfileId, created);
    return created;
  }, [selectedProfileId]);

  const navigateToConnection = useCallback(
    async (connectionId: number) => {
      if (navigatingRef.current) return;
      navigatingRef.current = true;

      try {
        let owner = ownerCache.get(connectionId);
        if (!owner) {
          owner = await api.connections.owner(connectionId);
          ownerCache.set(connectionId, owner);
        }
        navigate(`/models/${owner.model_config_id}?focus_connection_id=${connectionId}`);
      } catch {
        toast.error("Connection not found — it may have been deleted");
      } finally {
        navigatingRef.current = false;
      }
    },
    [navigate, ownerCache]
  );

  return { navigateToConnection };
}
