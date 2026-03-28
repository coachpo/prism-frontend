import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { getStaticMessages } from "@/i18n/staticMessages";
import { toast } from "sonner";
import {
  type CleanupType,
  type DeleteCleanupType,
  type RetentionPreset,
  getCleanupTypeLabel,
} from "./settingsPageHelpers";

export function useRetentionDeletionData() {
  const deleteKeyword = getStaticMessages().settingsDialogs.deleteConfirmKeyword;
  const [cleanupType, setCleanupType] = useState<CleanupType>("");
  const [retentionPreset, setRetentionPreset] = useState<RetentionPreset>("");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: DeleteCleanupType;
    days: number | null;
    deleteAll: boolean;
  } | null>(null);
  const [deleteConfirmPhrase, setDeleteConfirmPhrase] = useState("");
  const [deleting, setDeleting] = useState(false);

  const isDeletePhraseValid = useMemo(
    () => deleteConfirmPhrase.trim().toLowerCase() === deleteKeyword.toLowerCase(),
    [deleteConfirmPhrase, deleteKeyword]
  );

  const handleOpenDeleteConfirm = () => {
    const messages = getStaticMessages();
    if (!cleanupType || !retentionPreset) {
      return;
    }

    const deleteAll = retentionPreset === "all";
    const days = deleteAll ? null : Number.parseInt(retentionPreset, 10);
    if (!deleteAll && Number.isNaN(days)) {
      toast.error(messages.settingsRetentionDeletion.invalidRetentionOption);
      return;
    }

    setDeleteConfirm({ type: cleanupType, days, deleteAll });
    setDeleteConfirmPhrase("");
  };

  const handleBatchDelete = async () => {
    const messages = getStaticMessages();
    if (!deleteConfirm || !isDeletePhraseValid) {
      return;
    }

    const { type, days, deleteAll } = deleteConfirm;
    setDeleting(true);
    try {
      if (type === "requests") {
        if (deleteAll) {
          await api.stats.delete({ delete_all: true });
        } else {
          await api.stats.delete({ older_than_days: days! });
        }
      } else if (type === "audits") {
        if (deleteAll) {
          await api.audit.delete({ delete_all: true });
        } else {
          await api.audit.delete({ older_than_days: days! });
        }
      } else {
        if (deleteAll) {
          await api.loadbalance.deleteEvents({ delete_all: true });
        } else {
          await api.loadbalance.deleteEvents({ older_than_days: days! });
        }
      }

      toast.success(
        messages.settingsRetentionDeletion.deletionRequested(getCleanupTypeLabel(type)),
      );

      setDeleteConfirm(null);
      setDeleteConfirmPhrase("");
      setRetentionPreset("");
    } catch {
      toast.error(messages.settingsRetentionDeletion.deletionFailed);
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
