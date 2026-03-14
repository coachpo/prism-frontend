import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { DELETE_CONFIRM_KEYWORD } from "./settingsPageHelpers";

type CleanupType = "" | "requests" | "audits";
type RetentionPreset = "" | "7" | "30" | "90" | "all";

export function useRetentionDeletionData() {
  const [cleanupType, setCleanupType] = useState<CleanupType>("");
  const [retentionPreset, setRetentionPreset] = useState<RetentionPreset>("");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "requests" | "audits";
    days: number | null;
    deleteAll: boolean;
  } | null>(null);
  const [deleteConfirmPhrase, setDeleteConfirmPhrase] = useState("");
  const [deleting, setDeleting] = useState(false);

  const isDeletePhraseValid = useMemo(
    () => deleteConfirmPhrase.trim().toUpperCase() === DELETE_CONFIRM_KEYWORD,
    [deleteConfirmPhrase]
  );

  const handleOpenDeleteConfirm = () => {
    if (!cleanupType || !retentionPreset) {
      return;
    }

    const deleteAll = retentionPreset === "all";
    const days = deleteAll ? null : Number.parseInt(retentionPreset, 10);
    if (!deleteAll && Number.isNaN(days)) {
      toast.error("Select a valid retention option");
      return;
    }

    setDeleteConfirm({ type: cleanupType, days, deleteAll });
    setDeleteConfirmPhrase("");
  };

  const handleBatchDelete = async () => {
    if (!deleteConfirm || !isDeletePhraseValid) {
      return;
    }

    const { type, days, deleteAll } = deleteConfirm;
    setDeleting(true);
    try {
      if (type === "requests") {
        const result = deleteAll
          ? await api.stats.delete({ delete_all: true })
          : await api.stats.delete({ older_than_days: days! });
        toast.success(`Deleted ${result.deleted_count} request logs`);
      } else {
        const result = deleteAll
          ? await api.audit.delete({ delete_all: true })
          : await api.audit.delete({ older_than_days: days! });
        toast.success(`Deleted ${result.deleted_count} audit logs`);
      }

      setDeleteConfirm(null);
      setDeleteConfirmPhrase("");
      setRetentionPreset("");
    } catch {
      toast.error("Deletion failed");
    } finally {
      setDeleting(false);
    }
  };

  return {
    cleanupType,
    deleteConfirm,
    deleteConfirmPhrase,
    deleting,
    handleBatchDelete,
    handleOpenDeleteConfirm,
    isDeletePhraseValid,
    retentionPreset,
    setCleanupType,
    setDeleteConfirm,
    setDeleteConfirmPhrase,
    setRetentionPreset,
  };
}
