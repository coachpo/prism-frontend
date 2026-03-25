import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { getCurrentLocale } from "@/i18n/format";
import { toast } from "sonner";
import {
  DELETE_CONFIRM_KEYWORD,
  type CleanupType,
  type DeleteCleanupType,
  type RetentionPreset,
  getCleanupTypeLabel,
} from "./settingsPageHelpers";

export function useRetentionDeletionData() {
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
    () => deleteConfirmPhrase.trim().toUpperCase() === DELETE_CONFIRM_KEYWORD,
    [deleteConfirmPhrase]
  );

  const handleOpenDeleteConfirm = () => {
    const isChinese = getCurrentLocale() === "zh-CN";
    if (!cleanupType || !retentionPreset) {
      return;
    }

    const deleteAll = retentionPreset === "all";
    const days = deleteAll ? null : Number.parseInt(retentionPreset, 10);
    if (!deleteAll && Number.isNaN(days)) {
      toast.error(isChinese ? "请选择有效的保留选项" : "Select a valid retention option");
      return;
    }

    setDeleteConfirm({ type: cleanupType, days, deleteAll });
    setDeleteConfirmPhrase("");
  };

  const handleBatchDelete = async () => {
    const isChinese = getCurrentLocale() === "zh-CN";
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
        isChinese
          ? `已请求删除${getCleanupTypeLabel(type)}`
          : `${getCleanupTypeLabel(type)} deletion requested`,
      );

      setDeleteConfirm(null);
      setDeleteConfirmPhrase("");
      setRetentionPreset("");
    } catch {
      toast.error(isChinese ? "删除失败" : "Deletion failed");
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
