import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AuditLogDetail } from "@/lib/types";
import type { RequestDetailTab } from "./queryParams";

const AUDIT_LOOKUP_RETRY_DELAY_MS = 1000;
const AUDIT_LOOKUP_MAX_RETRIES = 5;

interface UseRequestLogAuditDetailInput {
  selectedLogId: number | null;
  detailTab: RequestDetailTab;
}

export function useRequestLogAuditDetail({
  selectedLogId,
  detailTab,
}: UseRequestLogAuditDetailInput) {
  const [auditDetail, setAuditDetail] = useState<AuditLogDetail | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditChecked, setAuditChecked] = useState(false);
  const [lookupAttempt, setLookupAttempt] = useState(0);

  useEffect(() => {
    setAuditDetail(null);
    setAuditError(null);
    setAuditChecked(false);
    setAuditLoading(false);
    setLookupAttempt(0);
  }, [selectedLogId]);

  useEffect(() => {
    if (selectedLogId === null || detailTab !== "audit") {
      return;
    }

    let cancelled = false;
    let retryTimer: number | null = null;

    const loadAuditDetail = async () => {
      if (lookupAttempt === 0) {
        setAuditLoading(true);
      }
      setAuditError(null);
      setAuditChecked(true);

      try {
        const auditLookup = await api.audit.list({
          request_log_id: selectedLogId,
          limit: 1,
          offset: 0,
        });

        if (cancelled) {
          return;
        }

        const linkedAudit = auditLookup.items[0];
        if (!linkedAudit) {
          setAuditDetail(null);
          if (lookupAttempt < AUDIT_LOOKUP_MAX_RETRIES) {
            retryTimer = window.setTimeout(() => {
              if (!cancelled) {
                setLookupAttempt((current) => current + 1);
              }
            }, AUDIT_LOOKUP_RETRY_DELAY_MS);
          }
          return;
        }

        const detail = await api.audit.get(linkedAudit.id);
        if (!cancelled) {
          setAuditDetail(detail);
        }
      } catch (error) {
        console.error("Failed to load linked audit detail", error);
        if (!cancelled) {
          setAuditError(error instanceof Error ? error.message : "Failed to load audit detail");
          setAuditDetail(null);
        }
      } finally {
        if (!cancelled) {
          setAuditLoading(false);
        }
      }
    };

    void loadAuditDetail();

    return () => {
      cancelled = true;
      if (retryTimer !== null) {
        window.clearTimeout(retryTimer);
      }
    };
  }, [detailTab, lookupAttempt, selectedLogId]);

  return {
    auditDetail,
    auditLoading,
    auditError,
    auditChecked,
  };
}
