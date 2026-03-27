import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { getCurrentLocale } from "@/i18n/format";
import { getSharedVendors, setSharedVendors } from "@/lib/referenceData";
import type { Vendor, VendorModelUsageItem } from "@/lib/types";
import { toast } from "sonner";
import {
  DEFAULT_VENDOR_FORM,
  normalizeVendorPayload,
  parseVendorUsageRows,
  vendorFormStateFromVendor,
  type VendorFormState,
} from "./vendorManagementFormState";

interface UseVendorManagementDataInput {
  revision: number;
}

export function useVendorManagementData({ revision }: UseVendorManagementDataInput) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [vendorForm, setVendorForm] = useState<VendorFormState>(DEFAULT_VENDOR_FORM);
  const [vendorSaving, setVendorSaving] = useState(false);
  const [deleteVendorConfirm, setDeleteVendorConfirm] = useState<Vendor | null>(null);
  const [deleteVendorConflict, setDeleteVendorConflict] = useState<VendorModelUsageItem[] | null>(null);
  const [vendorDeleting, setVendorDeleting] = useState(false);
  const [vendorUsageLoading, setVendorUsageLoading] = useState(false);
  const [vendorUsageRows, setVendorUsageRows] = useState<VendorModelUsageItem[]>([]);

  const commitVendors = useCallback(
    (updater: (current: Vendor[]) => Vendor[]) => {
      setVendors((current) => {
        const next = updater(current);
        setSharedVendors(revision, next);
        return next;
      });
    },
    [revision],
  );

  const fetchVendors = useCallback(async () => {
    const isChinese = getCurrentLocale() === "zh-CN";
    setVendorsLoading(true);
    try {
      const data = await getSharedVendors(revision);
      setVendors(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : isChinese ? "加载供应商失败" : "Failed to load vendors");
    } finally {
      setVendorsLoading(false);
    }
  }, [revision]);

  useEffect(() => {
    void fetchVendors();
  }, [fetchVendors]);

  const closeVendorDialog = () => {
    setVendorDialogOpen(false);
    setEditingVendor(null);
    setVendorForm(DEFAULT_VENDOR_FORM);
  };

  const closeDeleteVendorDialog = () => {
    setDeleteVendorConfirm(null);
    setDeleteVendorConflict(null);
    setVendorUsageRows([]);
    setVendorUsageLoading(false);
  };

  const openCreateVendorDialog = () => {
    setEditingVendor(null);
    setVendorForm(DEFAULT_VENDOR_FORM);
    setVendorDialogOpen(true);
  };

  const handleEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setVendorForm(vendorFormStateFromVendor(vendor));
    setVendorDialogOpen(true);
  };

  const handleSaveVendor = async () => {
    const isChinese = getCurrentLocale() === "zh-CN";
    const payload = normalizeVendorPayload(vendorForm);

    if (!payload.key) {
      toast.error(isChinese ? "供应商键为必填项" : "Vendor key is required");
      return;
    }

    if (!payload.name) {
      toast.error(isChinese ? "供应商名称为必填项" : "Vendor name is required");
      return;
    }

    setVendorSaving(true);
    try {
      if (editingVendor) {
        const updatedVendor = await api.vendors.update(editingVendor.id, payload);
        commitVendors((current) =>
          current.map((vendor) => (vendor.id === editingVendor.id ? updatedVendor : vendor)),
        );
        toast.success(isChinese ? "供应商已更新" : "Vendor updated");
      } else {
        const createdVendor = await api.vendors.create(payload);
        commitVendors((current) => [createdVendor, ...current]);
        toast.success(isChinese ? "供应商已创建" : "Vendor created");
      }

      closeVendorDialog();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : isChinese ? "保存供应商失败" : "Failed to save vendor");
    } finally {
      setVendorSaving(false);
    }
  };

  const handleDeleteVendorClick = async (vendor: Vendor) => {
    const isChinese = getCurrentLocale() === "zh-CN";
    setDeleteVendorConfirm(vendor);
    setDeleteVendorConflict(null);
    setVendorUsageRows([]);
    setVendorUsageLoading(true);

    try {
      const rows = await api.vendors.models(vendor.id);
      setVendorUsageRows(rows);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : isChinese ? "加载供应商依赖失败" : "Failed to load vendor usage");
      setVendorUsageRows([]);
    } finally {
      setVendorUsageLoading(false);
    }
  };

  const handleDeleteVendor = async () => {
    const isChinese = getCurrentLocale() === "zh-CN";

    if (!deleteVendorConfirm) {
      return;
    }

    setVendorDeleting(true);
    try {
      await api.vendors.delete(deleteVendorConfirm.id);
      commitVendors((current) => current.filter((vendor) => vendor.id !== deleteVendorConfirm.id));
      toast.success(isChinese ? "供应商已删除" : "Vendor deleted");
      closeDeleteVendorDialog();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const conflictRows = parseVendorUsageRows(error.detail);
        setDeleteVendorConflict(conflictRows);
        toast.error(isChinese ? "此供应商仍被模型引用，无法删除" : "Cannot delete this vendor because it is still in use");
      } else {
        toast.error(error instanceof Error ? error.message : isChinese ? "删除供应商失败" : "Failed to delete vendor");
      }
    } finally {
      setVendorDeleting(false);
    }
  };

  return {
    closeDeleteVendorDialog,
    closeVendorDialog,
    deleteVendorConfirm,
    deleteVendorConflict,
    editingVendor,
    handleDeleteVendor,
    handleDeleteVendorClick,
    handleEditVendor,
    handleSaveVendor,
    openCreateVendorDialog,
    setDeleteVendorConfirm,
    setVendorDialogOpen,
    setVendorForm,
    vendorDeleting,
    vendorDialogOpen,
    vendorForm,
    vendorSaving,
    vendorUsageLoading,
    vendorUsageRows,
    vendors,
    vendorsLoading,
  };
}
