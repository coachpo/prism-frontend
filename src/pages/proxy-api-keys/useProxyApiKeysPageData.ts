import type { ComponentProps } from "react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { getStaticMessages } from "@/i18n/staticMessages";
import type { AuthSettings, ProxyApiKey, ProxyApiKeyUpdate } from "@/lib/types";
import { getAuthStatusTone } from "./proxyKeyFormatting";

type FormSubmitEvent = Parameters<NonNullable<ComponentProps<"form">["onSubmit"]>>[0];

export function useProxyApiKeysPageData() {
  const [authSettings, setAuthSettings] = useState<AuthSettings | null>(null);
  const [proxyKeys, setProxyKeys] = useState<ProxyApiKey[]>([]);
  const [proxyKeyName, setProxyKeyName] = useState("");
  const [proxyKeyNotes, setProxyKeyNotes] = useState("");
  const [creatingProxyKey, setCreatingProxyKey] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [rotatingProxyKeyId, setRotatingProxyKeyId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ProxyApiKey | null>(null);
  const [deletingProxyKeyId, setDeletingProxyKeyId] = useState<number | null>(null);
  const [editingProxyKey, setEditingProxyKey] = useState<ProxyApiKey | null>(null);
  const [editingProxyKeyName, setEditingProxyKeyName] = useState("");
  const [editingProxyKeyNotes, setEditingProxyKeyNotes] = useState("");
  const [editingProxyKeyActive, setEditingProxyKeyActive] = useState(false);
  const [savingEditedProxyKeyId, setSavingEditedProxyKeyId] = useState<number | null>(null);
  const [latestGeneratedKey, setLatestGeneratedKey] = useState<string | null>(null);

  const displayedProxyKeys = useMemo(
    () => [...proxyKeys].sort((left, right) => right.id - left.id),
    [proxyKeys]
  );
  const proxyKeyLimit = authSettings?.proxy_key_limit ?? 100;
  const remainingKeys = authSettings ? Math.max(proxyKeyLimit - proxyKeys.length, 0) : 0;
  const authStatusLabel = authSettings
    ? authSettings.auth_enabled
      ? getStaticMessages().proxyApiKeys.authenticationOn
      : getStaticMessages().proxyApiKeys.authenticationOff
    : getStaticMessages().proxyApiKeys.authenticationUnavailable;
  const authStatusTone = getAuthStatusTone(authSettings);
  const createDisabled = creatingProxyKey || !authSettings || remainingKeys === 0;

  useEffect(() => {
    const messages = getStaticMessages();
    let active = true;

    setPageLoading(true);
    void Promise.allSettled([api.settings.auth.get(), api.settings.auth.proxyKeys.list()])
      .then(([authResult, keysResult]) => {
        if (!active) {
          return;
        }

        if (authResult.status === "fulfilled") {
          setAuthSettings(authResult.value);
        } else {
          toast.error(
            authResult.reason instanceof Error
              ? authResult.reason.message
                : messages.proxyApiKeysData.loadAuthStatusFailed
          );
        }

        if (keysResult.status === "fulfilled") {
          setProxyKeys(keysResult.value);
        } else {
          toast.error(
            keysResult.reason instanceof Error
              ? keysResult.reason.message
                : messages.proxyApiKeysData.loadKeysFailed
          );
        }
      })
      .finally(() => {
        if (active) {
          setPageLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleCreateProxyKey() {
    const messages = getStaticMessages();
    if (!authSettings) {
      toast.error(messages.proxyApiKeysData.settingsUnavailable);
      return;
    }

    if (!proxyKeyName.trim()) {
      toast.error(messages.proxyApiKeysData.keyNameRequired);
      return;
    }

    if (remainingKeys <= 0) {
      toast.error(messages.proxyApiKeysData.maxKeysReached(String(proxyKeyLimit)));
      return;
    }

    setCreatingProxyKey(true);
    try {
      const created = await api.settings.auth.proxyKeys.create({
        name: proxyKeyName.trim(),
        notes: proxyKeyNotes.trim() || null,
      });
      setLatestGeneratedKey(created.key);
      setProxyKeyName("");
      setProxyKeyNotes("");
      setProxyKeys((current) => [created.item, ...current]);
      toast.success(messages.proxyApiKeysData.created);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : messages.proxyApiKeysData.createFailed);
    } finally {
      setCreatingProxyKey(false);
    }
  }

  async function handleRotateProxyKey(keyId: number) {
    const messages = getStaticMessages();
    setRotatingProxyKeyId(keyId);
    try {
      const rotated = await api.settings.auth.proxyKeys.rotate(keyId);
      setLatestGeneratedKey(rotated.key);
      setProxyKeys((current) =>
        current.map((key) => (key.id === keyId ? rotated.item : key))
      );
      toast.success(messages.proxyApiKeysData.rotated);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : messages.proxyApiKeysData.rotateFailed);
    } finally {
      setRotatingProxyKeyId(null);
    }
  }

  async function handleDeleteProxyKey() {
    const messages = getStaticMessages();
    if (!deleteConfirm) {
      return;
    }

    setDeletingProxyKeyId(deleteConfirm.id);
    try {
      await api.settings.auth.proxyKeys.delete(deleteConfirm.id);
      setProxyKeys((current) => current.filter((key) => key.id !== deleteConfirm.id));
      setDeleteConfirm(null);
      toast.success(messages.proxyApiKeysData.deleted);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : messages.proxyApiKeysData.deleteFailed);
    } finally {
      setDeletingProxyKeyId(null);
    }
  }

  const startEditingProxyKey = (item: ProxyApiKey) => {
    setEditingProxyKey(item);
    setEditingProxyKeyName(item.name);
    setEditingProxyKeyNotes(item.notes ?? "");
    setEditingProxyKeyActive(item.is_active);
  };

  const resetEditProxyKeyDialog = () => {
    setEditingProxyKey(null);
    setEditingProxyKeyName("");
    setEditingProxyKeyNotes("");
    setEditingProxyKeyActive(false);
  };

  async function handleSaveEditedProxyKey() {
    const messages = getStaticMessages();
    if (!editingProxyKey) {
      return;
    }

    const nextName = editingProxyKeyName.trim();
    if (!nextName) {
      toast.error(messages.proxyApiKeysData.keyNameRequired);
      return;
    }

    setSavingEditedProxyKeyId(editingProxyKey.id);
    try {
      const payload: ProxyApiKeyUpdate = {
        name: nextName,
        notes: editingProxyKeyNotes.trim() || null,
        is_active: editingProxyKeyActive,
      };
      const updated = await api.settings.auth.proxyKeys.update(editingProxyKey.id, payload);
      setProxyKeys((current) =>
        current.map((key) => (key.id === updated.id ? updated : key))
      );
      resetEditProxyKeyDialog();
      toast.success(messages.proxyApiKeysData.updated);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : messages.proxyApiKeysData.updateFailed);
    } finally {
      setSavingEditedProxyKeyId(null);
    }
  }

  const handleCreateSubmit = (event: FormSubmitEvent) => {
    event.preventDefault();
    void handleCreateProxyKey();
  };

  const handleEditSubmit = (event: FormSubmitEvent) => {
    event.preventDefault();
    void handleSaveEditedProxyKey();
  };

  const handleDeleteDialogOpenChange = (open: boolean) => {
    if (!open && deletingProxyKeyId === null) {
      setDeleteConfirm(null);
    }
  };

  const handleEditDialogOpenChange = (open: boolean) => {
    if (!open && savingEditedProxyKeyId === null) {
      resetEditProxyKeyDialog();
    }
  };

  return {
    authSettings,
    authStatusLabel,
    authStatusTone,
    createDisabled,
    creatingProxyKey,
    deleteConfirm,
    deletingProxyKeyId,
    editingProxyKey,
    editingProxyKeyActive,
    editingProxyKeyName,
    editingProxyKeyNotes,
    displayedProxyKeys,
    handleCreateSubmit,
    handleDeleteDialogOpenChange,
    handleDeleteProxyKey,
    handleEditDialogOpenChange,
    handleEditSubmit,
    handleRotateProxyKey,
    latestGeneratedKey,
    pageLoading,
    proxyKeyLimit,
    proxyKeyName,
    proxyKeyNotes,
    proxyKeys,
    remainingKeys,
    rotatingProxyKeyId,
    savingEditedProxyKeyId,
    setDeleteConfirm,
    setDeletingProxyKeyId,
    setEditingProxyKeyActive,
    setEditingProxyKeyName,
    setEditingProxyKeyNotes,
    setProxyKeyName,
    setProxyKeyNotes,
    startEditingProxyKey,
  };
}
