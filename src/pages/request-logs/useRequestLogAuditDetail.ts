import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AuditLogDetail } from "@/lib/types";
import type { RequestDetailTab } from "./queryParams";

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

  useEffect(() => {
    setAuditDetail(null);
    setAuditError(null);
    setAuditChecked(false);
    setAuditLoading(false);
  }, [selectedLogId]);

  useEffect(() => {
    if (selectedLogId === null || detailTab !== "audit") {
      return;
    }

    let cancelled = false;

    const loadAuditDetail = async () => {
      setAuditLoading(true);
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
    };
  }, [detailTab, selectedLogId]);

  return {
    auditDetail,
    auditLoading,
    auditError,
    auditChecked,
  };
}
