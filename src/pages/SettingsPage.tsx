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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [customRequestDays, setCustomRequestDays] = useState("");
  const [customAuditDays, setCustomAuditDays] = useState("");

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
    <div className="space-y-8">
      <h2 className="text-3xl font-bold tracking-tight">Settings</h2>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Configuration Backup</h3>
        <p className="text-muted-foreground">
          Manage your gateway configuration. Export all providers, models, and endpoints as a single
          JSON file, or import a previously exported backup.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export
            </CardTitle>
            <CardDescription>
              Download a JSON file containing all providers, models, and endpoint configurations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              API keys are included in plaintext.
            </div>
            <Button onClick={handleExport} disabled={exporting} className="w-full">
              {exporting ? "Exporting..." : "Export Configuration"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import
            </CardTitle>
            <CardDescription>
              Upload a JSON backup file to replace all current configuration. This will DELETE all
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

      <div className="grid gap-6 sm:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Audit Configuration
            </CardTitle>
            <CardDescription>
              Configure audit logging settings for each provider.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {providers.map((provider) => (
                <div key={provider.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="font-medium">{provider.name}</div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`audit-${provider.id}`}
                        checked={provider.audit_enabled}
                        onCheckedChange={(checked) => toggleAudit(provider.id, checked)}
                      />
                      <Label htmlFor={`audit-${provider.id}`}>Audit</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`bodies-${provider.id}`}
                        checked={provider.audit_capture_bodies}
                        onCheckedChange={(checked) => toggleBodies(provider.id, checked)}
                        disabled={!provider.audit_enabled}
                      />
                      <Label htmlFor={`bodies-${provider.id}`}>Bodies</Label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Data Management
            </CardTitle>
            <CardDescription>
              Batch delete old logs to free up space.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Request Logs</h4>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" disabled={deleting} onClick={() => setDeleteConfirm({ type: "requests", days: 7, deleteAll: false })}>
                  Older than 7 days
                </Button>
                <Button variant="outline" disabled={deleting} onClick={() => setDeleteConfirm({ type: "requests", days: 15, deleteAll: false })}>
                  Older than 15 days
                </Button>
                <Button variant="outline" disabled={deleting} onClick={() => setDeleteConfirm({ type: "requests", days: 30, deleteAll: false })}>
                  Older than 30 days
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  step={1}
                  placeholder="Custom days"
                  className="w-32"
                  value={customRequestDays}
                  onChange={(e) => setCustomRequestDays(e.target.value)}
                />
                <Button
                  variant="outline"
                  disabled={deleting || !customRequestDays || Number(customRequestDays) < 1 || !Number.isInteger(Number(customRequestDays))}
                  onClick={() => setDeleteConfirm({ type: "requests", days: Number(customRequestDays), deleteAll: false })}
                >
                  Delete older than custom days
                </Button>
              </div>
              <div>
                <Button variant="destructive" disabled={deleting} onClick={() => setDeleteConfirm({ type: "requests", days: null, deleteAll: true })}>
                  Delete all request logs
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Audit Logs</h4>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" disabled={deleting} onClick={() => setDeleteConfirm({ type: "audits", days: 7, deleteAll: false })}>
                  Older than 7 days
                </Button>
                <Button variant="outline" disabled={deleting} onClick={() => setDeleteConfirm({ type: "audits", days: 15, deleteAll: false })}>
                  Older than 15 days
                </Button>
                <Button variant="outline" disabled={deleting} onClick={() => setDeleteConfirm({ type: "audits", days: 30, deleteAll: false })}>
                  Older than 30 days
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  step={1}
                  placeholder="Custom days"
                  className="w-32"
                  value={customAuditDays}
                  onChange={(e) => setCustomAuditDays(e.target.value)}
                />
                <Button
                  variant="outline"
                  disabled={deleting || !customAuditDays || Number(customAuditDays) < 1 || !Number.isInteger(Number(customAuditDays))}
                  onClick={() => setDeleteConfirm({ type: "audits", days: Number(customAuditDays), deleteAll: false })}
                >
                  Delete older than custom days
                </Button>
              </div>
              <div>
                <Button variant="destructive" disabled={deleting} onClick={() => setDeleteConfirm({ type: "audits", days: null, deleteAll: true })}>
                  Delete all audit logs
                </Button>
              </div>
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
