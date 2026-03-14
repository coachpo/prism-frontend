import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { AuthSettings, ProxyApiKey } from "@/lib/types";
import { getAuthStatusTone } from "./proxyKeyFormatting";

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
  const [latestGeneratedKey, setLatestGeneratedKey] = useState<string | null>(null);

  const displayedProxyKeys = useMemo(
    () => [...proxyKeys].sort((left, right) => right.id - left.id),
    [proxyKeys]
  );
  const proxyKeyLimit = authSettings?.proxy_key_limit ?? 10;
  const remainingKeys = authSettings ? Math.max(proxyKeyLimit - proxyKeys.length, 0) : 0;
  const authStatusLabel = authSettings
    ? authSettings.auth_enabled
      ? "Authentication On"
      : "Authentication Off"
    : "Authentication Unavailable";
  const authStatusTone = getAuthStatusTone(authSettings);
  const createDisabled = creatingProxyKey || !authSettings || remainingKeys === 0;

  useEffect(() => {
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
              : "Failed to load authentication status"
          );
        }

        if (keysResult.status === "fulfilled") {
          setProxyKeys(keysResult.value);
        } else {
          toast.error(
            keysResult.reason instanceof Error
              ? keysResult.reason.message
              : "Failed to load proxy API keys"
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

  async function fetchProxyKeys() {
    try {
      const data = await api.settings.auth.proxyKeys.list();
      setProxyKeys(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load proxy API keys");
    }
  }

  async function handleCreateProxyKey() {
    if (!authSettings) {
      toast.error("Authentication settings are unavailable");
      return;
    }

    if (!proxyKeyName.trim()) {
      toast.error("Key name is required");
      return;
    }

    if (remainingKeys <= 0) {
      toast.error(`Maximum ${proxyKeyLimit} proxy API keys reached`);
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
      await fetchProxyKeys();
      toast.success("Proxy API key created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create proxy API key");
    } finally {
      setCreatingProxyKey(false);
    }
  }

  async function handleRotateProxyKey(keyId: number) {
    setRotatingProxyKeyId(keyId);
    try {
      const rotated = await api.settings.auth.proxyKeys.rotate(keyId);
      setLatestGeneratedKey(rotated.key);
      await fetchProxyKeys();
      toast.success("Proxy API key rotated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to rotate proxy API key");
    } finally {
      setRotatingProxyKeyId(null);
    }
  }

  async function handleDeleteProxyKey() {
    if (!deleteConfirm) {
      return;
    }

    setDeletingProxyKeyId(deleteConfirm.id);
    try {
      await api.settings.auth.proxyKeys.delete(deleteConfirm.id);
      setDeleteConfirm(null);
      await fetchProxyKeys();
      toast.success("Proxy API key deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete proxy API key");
    } finally {
      setDeletingProxyKeyId(null);
    }
  }

  const handleCreateSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleCreateProxyKey();
  };

  const handleDeleteDialogOpenChange = (open: boolean) => {
    if (!open && deletingProxyKeyId === null) {
      setDeleteConfirm(null);
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
    displayedProxyKeys,
    handleCreateSubmit,
    handleDeleteDialogOpenChange,
    handleDeleteProxyKey,
    handleRotateProxyKey,
    latestGeneratedKey,
    pageLoading,
    proxyKeyLimit,
    proxyKeyName,
    proxyKeyNotes,
    proxyKeys,
    remainingKeys,
    rotatingProxyKeyId,
    setDeleteConfirm,
    setDeletingProxyKeyId,
    setProxyKeyName,
    setProxyKeyNotes,
  };
}
