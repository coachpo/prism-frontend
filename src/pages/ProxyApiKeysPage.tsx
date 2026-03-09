import { useEffect, useState, type FormEvent } from "react";
import { RotateCcw, ShieldAlert, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { CopyButton } from "@/components/CopyButton";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { AuthSettings, ProxyApiKey } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProxyApiKeysPage() {
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

  const displayedProxyKeys = [...proxyKeys].sort((left, right) => right.id - left.id);
  const proxyKeyLimit = authSettings?.proxy_key_limit ?? 10;
  const remainingKeys = authSettings
    ? Math.max(proxyKeyLimit - proxyKeys.length, 0)
    : 0;
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

  function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void handleCreateProxyKey();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Proxy API Keys"
        description="Manage machine credentials used by upstream clients to access the Prism proxy."
      >
        <Badge variant="outline" className={authStatusTone}>
          {authStatusLabel}
        </Badge>
      </PageHeader>

      {pageLoading ? (
        <ProxyApiKeysPageSkeleton />
      ) : (
        <>
          <form onSubmit={handleCreateSubmit}>
            <Card>
              <CardHeader className="pb-3">
                <div className="space-y-1">
                  <CardTitle className="text-base">Create proxy key</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Add a name and optional note, then create a new client credential.
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {latestGeneratedKey ? (
                  <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
                          New secret
                        </p>
                        <p className="text-sm text-muted-foreground">
                          This full key is shown once. Store it before leaving the page.
                        </p>
                      </div>
                      <CopyButton
                        value={latestGeneratedKey}
                        label="Copy key"
                        targetLabel="API key"
                        variant="outline"
                      />
                    </div>
                    <div className="mt-4 rounded-md border bg-background px-3 py-3">
                      <p className="break-all font-mono text-sm">{latestGeneratedKey}</p>
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-end gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="proxy-key-name" className="text-xs text-muted-foreground">
                      Name
                    </Label>
                    <Input
                      id="proxy-key-name"
                      value={proxyKeyName}
                      onChange={(event) => setProxyKeyName(event.target.value)}
                      placeholder="Production client"
                      disabled={creatingProxyKey || !authSettings}
                      className="w-56"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="proxy-key-notes" className="text-xs text-muted-foreground">
                      Notes
                    </Label>
                    <Input
                      id="proxy-key-notes"
                      value={proxyKeyNotes}
                      onChange={(event) => setProxyKeyNotes(event.target.value)}
                      placeholder="Used by the main website"
                      disabled={creatingProxyKey || !authSettings}
                      className="w-72"
                    />
                  </div>

                  <Button type="submit" disabled={createDisabled}>
                    {creatingProxyKey
                      ? "Creating..."
                      : remainingKeys === 0
                        ? "Key limit reached"
                        : "Create key"}
                  </Button>

                  <p className="pb-2 text-sm text-muted-foreground">
                    {proxyKeys.length} / {proxyKeyLimit} keys used
                  </p>
                </div>

                <p className="text-xs text-muted-foreground">
                  {remainingKeys} slot{remainingKeys === 1 ? "" : "s"} remaining.
                </p>
              </CardContent>
            </Card>
          </form>

          <div
            className={cn(
              "rounded-lg border p-4",
              authSettings?.auth_enabled
                ? "border-emerald-500/25 bg-emerald-500/10"
                : "border-amber-500/25 bg-amber-500/10"
            )}
          >
            <div className="flex items-start gap-3">
              {authSettings?.auth_enabled ? (
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-300" />
              ) : (
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
              )}
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {authSettings?.auth_enabled
                    ? "Keys are active for protected proxy traffic."
                    : "Keys are prepared but not enforced until authentication is enabled."}
                </p>
                <p className="text-sm text-muted-foreground">
                  {authSettings?.auth_enabled
                    ? "Requests to `/v1/*` and `/v1beta/*` must present a valid key."
                    : "Enable authentication in Settings when you are ready to enforce these keys."}
                </p>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base">Issued keys</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Rotate or delete keys directly from the list below.
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {displayedProxyKeys.length} key{displayedProxyKeys.length === 1 ? "" : "s"}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              {displayedProxyKeys.length === 0 ? (
                <div className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                  No proxy keys created yet.
                </div>
              ) : (
                <div className="grid gap-4">
                  {displayedProxyKeys.map((item) => {
                    const rotating = rotatingProxyKeyId === item.id;
                    const deleting = deletingProxyKeyId === item.id;

                    return (
                      <ProxyKeyCard
                        key={item.id}
                        item={item}
                        authEnabled={Boolean(authSettings?.auth_enabled)}
                        rotating={rotating}
                        deleting={deleting}
                        onRotate={() => void handleRotateProxyKey(item.id)}
                        onDelete={() => setDeleteConfirm(item)}
                      />
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog
        open={deleteConfirm !== null}
        onOpenChange={(open) => {
          if (!open && deletingProxyKeyId === null) {
            setDeleteConfirm(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Proxy API Key</DialogTitle>
            <DialogDescription>
              Delete the key &quot;{deleteConfirm?.name}&quot;? Requests using this secret will
              stop working immediately.
            </DialogDescription>
          </DialogHeader>

          {deleteConfirm ? (
            <div className="space-y-4 py-2">
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
                <p className="text-sm text-destructive">
                  This action cannot be undone.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Preview
                </p>
                <p className="mt-2 font-mono text-sm">{deleteConfirm.key_preview}</p>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              disabled={deletingProxyKeyId !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDeleteProxyKey()}
              disabled={deletingProxyKeyId !== null}
            >
              {deletingProxyKeyId !== null ? "Deleting..." : "Delete key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProxyKeyCard({
  item,
  authEnabled,
  rotating,
  deleting,
  onRotate,
  onDelete,
}: {
  item: ProxyApiKey;
  authEnabled: boolean;
  rotating: boolean;
  deleting: boolean;
  onRotate: () => void;
  onDelete: () => void;
}) {
  const statusLabel = getRuntimeStatusLabel(item, authEnabled);
  const statusTone = getRuntimeStatusTone(item, authEnabled);

  return (
    <div className="rounded-lg border p-4">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold">{item.name}</p>
              <Badge variant="outline" className={statusTone}>
                {statusLabel}
              </Badge>
              {!item.last_used_at ? (
                <Badge
                  variant="outline"
                  className="border-slate-300/70 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                >
                  Never used
                </Badge>
              ) : null}
            </div>

            <p className="text-sm text-muted-foreground">
              {item.notes?.trim()
                ? item.notes
                : "No operator note recorded for this integration."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onRotate}
              disabled={rotating || deleting}
            >
              <RotateCcw className={cn("h-3.5 w-3.5", rotating ? "animate-spin" : undefined)} />
              {rotating ? "Rotate..." : "Rotate"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={onDelete}
              disabled={rotating || deleting}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <InfoTile
            label="Stored preview"
            value={item.key_preview}
            helper="Prism only stores the preview. Rotate the key to issue a new full secret."
            mono
            className="lg:col-span-2"
          />
          <InfoTile label="Created" value={formatDateTime(item.created_at)} />
          <InfoTile label="Last used" value={formatLastUsed(item.last_used_at)} />
          <InfoTile
            label="Last IP"
            value={item.last_used_ip ?? "No request yet"}
            mono={Boolean(item.last_used_ip)}
          />
          <InfoTile label="Last rotation" value={formatRotation(item.created_at, item.updated_at)} />
        </div>
      </div>
    </div>
  );
}

function ProxyApiKeysPageSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="border-slate-200/80 shadow-none dark:border-slate-800">
        <CardContent className="space-y-5 p-6">
          <Skeleton className="h-5 w-36" />
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-10 rounded-xl md:self-end" />
          </div>
        </CardContent>
      </Card>

      <Skeleton className="h-20 rounded-xl" />

      <div className="grid gap-4">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

function InfoTile({
  label,
  value,
  helper,
  mono = false,
  className,
}: {
  label: string;
  value: string;
  helper?: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200/80 bg-slate-50/70 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/60",
        className
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-3 text-sm text-slate-950 dark:text-slate-50",
          mono ? "break-all font-mono" : undefined
        )}
      >
        {value}
      </p>
      {helper ? <p className="mt-2 text-sm text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

function getAuthStatusTone(authSettings: AuthSettings | null) {
  if (!authSettings) {
    return "border-slate-300/70 bg-slate-100/80 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";
  }

  return authSettings.auth_enabled
    ? "border-emerald-300/60 bg-emerald-100/70 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
    : "border-amber-300/60 bg-amber-100/70 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200";
}

function getRuntimeStatusLabel(item: ProxyApiKey, authEnabled: boolean) {
  if (!item.is_active) {
    return "Disabled";
  }

  return authEnabled ? "Active" : "Prepared";
}

function getRuntimeStatusTone(item: ProxyApiKey, authEnabled: boolean) {
  if (!item.is_active) {
    return "border-slate-300/70 bg-slate-100/80 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";
  }

  return authEnabled
    ? "border-emerald-300/60 bg-emerald-100/70 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
    : "border-sky-300/70 bg-sky-100/80 text-sky-900 dark:border-sky-900/80 dark:bg-sky-950/30 dark:text-sky-200";
}

function formatLastUsed(value: string | null) {
  return formatDateTime(value, "Never");
}

function formatRotation(createdAt: string, updatedAt: string) {
  const created = new Date(createdAt).getTime();
  const updated = new Date(updatedAt).getTime();

  if (Number.isFinite(created) && Number.isFinite(updated) && updated <= created) {
    return "Never rotated";
  }

  if (createdAt === updatedAt) {
    return "Never rotated";
  }

  return formatDateTime(updatedAt);
}

function formatDateTime(value: string | null, fallback = "Unknown") {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
