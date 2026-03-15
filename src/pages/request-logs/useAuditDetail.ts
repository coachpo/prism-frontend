import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { AuditLogDetail } from "@/lib/types";

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 1000;

interface UseAuditDetailParams {
  requestLogId: number | null;
  enabled: boolean;
}

export function useAuditDetail({ requestLogId, enabled }: UseAuditDetailParams) {
  const [audits, setAudits] = useState<AuditLogDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeLogIdRef = useRef<number | null>(null);

  const fetchAudits = useCallback(async (logId: number) => {
    activeLogIdRef.current = logId;
    setLoading(true);
    setError(null);
    setAudits([]);

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (activeLogIdRef.current !== logId) return;

      try {
        const listResult = await api.audit.list({
          request_log_id: logId,
          limit: 20,
        });

        if (activeLogIdRef.current !== logId) return;

        if (listResult.items.length === 0) {
          if (attempt < MAX_RETRIES - 1) {
            await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
            continue;
          }
          setError("No audit capture found for this request. Audit logging may be disabled for this provider.");
          setLoading(false);
          return;
        }

        const detailResults = await Promise.allSettled(
          listResult.items.map((item) => api.audit.get(item.id))
        );

        if (activeLogIdRef.current !== logId) return;

        const details = detailResults
          .filter((r): r is PromiseFulfilledResult<AuditLogDetail> => r.status === "fulfilled")
          .map((r) => r.value);

        setAudits(details);
        setLoading(false);
        return;
      } catch {
        if (activeLogIdRef.current !== logId) return;
        if (attempt < MAX_RETRIES - 1) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
          continue;
        }
        setError("Failed to load audit details after multiple attempts.");
        setLoading(false);
        return;
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled || requestLogId === null) {
      activeLogIdRef.current = null;
      setAudits([]);
      setLoading(false);
      setError(null);
      return;
    }

    fetchAudits(requestLogId);

    return () => {
      activeLogIdRef.current = null;
    };
  }, [requestLogId, enabled, fetchAudits]);

  return { audits, loading, error };
}
