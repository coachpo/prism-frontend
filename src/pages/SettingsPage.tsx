import { useRef, useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { ConfigImportRequest, Provider } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Download, Upload, AlertTriangle, Shield, Trash2 } from "lucide-react";
import { ProviderIcon } from "@/components/ProviderIcon";
import { PageHeader } from "@/components/PageHeader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SettingsPage() {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedConfig, setParsedConfig] = useState<ConfigImportRequest | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "requests" | "audits"; days: number | null; deleteAll: boolean } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [cleanupType, setCleanupType] = useState<"requests" | "audits">("requests");
  const [retentionPreset, setRetentionPreset] = useState("");
  const [customDays, setCustomDays] = useState("");

  useEffect(() => {
    api.providers.list().then(setProviders).catch(() => toast.error("Failed to load providers"));
  }, []);

  const toggleAudit = async (providerId: number, checked: boolean) => {
    setProviders((prev) =>
      prev.map((p) => (p.id === providerId ? { ...p, audit_enabled: checked } : p))
    );
    try {
      await api.providers.update(providerId, { audit_enabled: checked });
    } catch {
      setProviders((prev) =>
        prev.map((p) => (p.id === providerId ? { ...p, audit_enabled: !checked } : p))
      );
      toast.error("Failed to update provider");
    }
  };

  const toggleBodies = async (providerId: number, checked: boolean) => {
    setProviders((prev) =>
      prev.map((p) => (p.id === providerId ? { ...p, audit_capture_bodies: checked } : p))
    );
    try {
      await api.providers.update(providerId, { audit_capture_bodies: checked });
    } catch {
      setProviders((prev) =>
        prev.map((p) => (p.id === providerId ? { ...p, audit_capture_bodies: !checked } : p))
      );
      toast.error("Failed to update provider");
    }
  };

  const handleBatchDelete = async () => {
    if (!deleteConfirm) return;
    const { type, days, deleteAll } = deleteConfirm;
    setDeleteConfirm(null);
    setDeleting(true);
    try {
      let count = 0;
      if (type === "requests") {
        const res = deleteAll
          ? await api.stats.delete({ delete_all: true })
          : await api.stats.delete({ older_than_days: days! });
        count = res.deleted_count;
        toast.success(`Deleted ${count} request logs`);
      } else {
        const res = deleteAll
          ? await api.audit.delete({ delete_all: true })
          : await api.audit.delete({ older_than_days: days! });
        count = res.deleted_count;
        toast.success(`Deleted ${count} audit logs`);
      }
    } catch {
      toast.error("Deletion failed");
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await api.config.export();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().split("T")[0];
      a.href = url;
      a.download = `gateway-config-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Configuration exported successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as ConfigImportRequest;
      setParsedConfig(parsed);
    } catch {
      toast.error("Invalid JSON file");
      setSelectedFile(null);
      setParsedConfig(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleImport = async () => {
    if (!parsedConfig) return;
    setConfirmOpen(false);
    setImporting(true);
    try {
      const result = await api.config.import(parsedConfig);
      toast.success(
        `Imported ${result.providers_imported} providers, ${result.models_imported} models, ${result.endpoints_imported} endpoints`
      );
      setSelectedFile(null);
      setParsedConfig(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage providers, configuration backups, and data retention" />

      <div className="space-y-1">
        <h3 className="text-base font-semibold">Configuration Backup</h3>
        <p className="text-sm text-muted-foreground">
          Export or import your gateway configuration as JSON.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Download className="h-4 w-4" />
              Export
            </CardTitle>
            <CardDescription className="text-xs">
              Download all providers, models, and endpoint configurations as JSON.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              API keys are included in plaintext.
            </div>
            <Button onClick={handleExport} disabled={exporting} className="w-full">
              {exporting ? "Exporting..." : "Export Configuration"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Upload className="h-4 w-4" />
              Import
            </CardTitle>
            <CardDescription className="text-xs">
              Upload a JSON backup to replace all current configuration. This will DELETE all
              existing providers, models, and endpoints.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              This action is destructive and cannot be undone.
            </div>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
            />
            {selectedFile && parsedConfig && (
              <p className="text-sm text-muted-foreground">
                {parsedConfig.providers?.length ?? 0} providers, {parsedConfig.models?.length ?? 0} models
              </p>
            )}
            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={!parsedConfig || importing}
              variant="destructive"
              className="w-full"
            >
              {importing ? "Importing..." : "Import Configuration"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4" />
              Audit Configuration
            </CardTitle>
            <CardDescription className="text-xs">
              Configure audit logging settings for each provider.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {providers.map((provider) => (
                <div key={provider.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="text-sm font-medium inline-flex items-center gap-2">
                    <ProviderIcon providerType={provider.provider_type} size={14} />
                    {provider.name}
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`audit-${provider.id}`}
                        checked={provider.audit_enabled}
                        onCheckedChange={(checked) => toggleAudit(provider.id, checked)}
                      />
                      <Label htmlFor={`audit-${provider.id}`} className="text-xs">Audit</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`bodies-${provider.id}`}
                        checked={provider.audit_capture_bodies}
                        onCheckedChange={(checked) => toggleBodies(provider.id, checked)}
                        disabled={!provider.audit_enabled}
                      />
                      <Label htmlFor={`bodies-${provider.id}`} className="text-xs">Bodies</Label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Trash2 className="h-4 w-4" />
              Data Management
            </CardTitle>
            <CardDescription className="text-xs">
              Batch delete old logs to free up space.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={cleanupType}
                onValueChange={(v) => setCleanupType(v as "requests" | "audits")}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="requests">Request Logs</SelectItem>
                  <SelectItem value="audits">Audit Logs</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={retentionPreset}
                onValueChange={(v) => {
                  setRetentionPreset(v);
                  if (v !== "custom") setCustomDays("");
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select retention..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Older than 7 days</SelectItem>
                  <SelectItem value="15">Older than 15 days</SelectItem>
                  <SelectItem value="30">Older than 30 days</SelectItem>
                  <SelectItem value="custom">Custom days</SelectItem>
                  <SelectItem value="all" className="text-destructive">Delete all</SelectItem>
                </SelectContent>
              </Select>

              {retentionPreset === "custom" && (
                <Input
                  type="number"
                  min={1}
                  placeholder="Days"
                  className="w-24"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                />
              )}

              <Button
                variant="destructive"
                disabled={
                  deleting ||
                  !retentionPreset ||
                  (retentionPreset === "custom" && (!customDays || parseInt(customDays) < 1))
                }
                onClick={() => {
                  if (retentionPreset === "all") {
                    setDeleteConfirm({ type: cleanupType, days: null, deleteAll: true });
                  } else {
                    const days =
                      retentionPreset === "custom" ? parseInt(customDays) : parseInt(retentionPreset);
                    setDeleteConfirm({ type: cleanupType, days, deleteAll: false });
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Import</DialogTitle>
            <DialogDescription>
              This will replace ALL existing configuration
              ({parsedConfig?.providers?.length ?? 0} providers, {parsedConfig?.models?.length ?? 0} models).
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleImport}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              {deleteConfirm?.deleteAll
                ? `Are you sure you want to delete ALL ${deleteConfirm?.type === "requests" ? "request" : "audit"} logs? This action cannot be undone.`
                : `Are you sure you want to delete ${deleteConfirm?.type === "requests" ? "request" : "audit"} logs older than ${deleteConfirm?.days} days? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBatchDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
