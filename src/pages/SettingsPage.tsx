import { Globe } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { api } from "@/lib/api";
import { z } from "zod";
import { isValidCurrencyCode, isValidPositiveDecimalString } from "@/lib/costing";
import type {
  ConfigImportRequest,
  Provider,
  HeaderBlocklistRule,
  HeaderBlocklistRuleCreate,
  EndpointFxMapping,
  CostingSettingsUpdate,
  ModelConfigListItem,
  Connection,
} from "@/lib/types";
import { ConfigImportSchema } from "@/lib/configImportValidation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Download, Upload, AlertTriangle, Shield, Trash2, Ban, Lock, Plus, Pencil, ChevronRight, Coins } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ProviderIcon } from "@/components/ProviderIcon";
import { PageHeader } from "@/components/PageHeader";
import { SwitchController } from "@/components/SwitchController";
import { TypeBadge } from "@/components/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

const getConnectionName = (connection: Pick<Connection, "name" | "description">): string =>
  connection.name || connection.description || "";

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
  const [blocklistRules, setBlocklistRules] = useState<HeaderBlocklistRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<HeaderBlocklistRule | null>(null);
  const [ruleForm, setRuleForm] = useState<HeaderBlocklistRuleCreate>({
    name: "",
    match_type: "exact",
    pattern: "",
    enabled: true,
  });
  const [deleteRuleConfirm, setDeleteRuleConfirm] = useState<HeaderBlocklistRule | null>(null);
  const [systemRulesOpen, setSystemRulesOpen] = useState(false);
  const [userRulesOpen, setUserRulesOpen] = useState(true);
  const [costingUnavailable, setCostingUnavailable] = useState(false);
  const [costingLoading, setCostingLoading] = useState(false);
  const [costingSaving, setCostingSaving] = useState(false);
  const [models, setModels] = useState<ModelConfigListItem[]>([]);
  const [mappingConnections, setMappingConnections] = useState<Connection[]>([]);
  const [mappingLoading, setMappingLoading] = useState(false);
  const [mappingModelId, setMappingModelId] = useState("");
  const [mappingEndpointId, setMappingEndpointId] = useState("");
  const [mappingFxRate, setMappingFxRate] = useState("");
  const [costingForm, setCostingForm] = useState<CostingSettingsUpdate>({
    report_currency_code: "USD",
    report_currency_symbol: "$",
    timezone_preference: null,
    endpoint_fx_mappings: [],
  });

  useEffect(() => {
    api.providers.list().then(setProviders).catch(() => toast.error("Failed to load providers"));
    fetchRules();
    fetchCostingSettings();
    fetchModels();
  }, []);

  const fetchRules = async () => {
    setLoadingRules(true);
    try {
      const rules = await api.config.headerBlocklistRules.list(true);
      setBlocklistRules(rules);
    } catch {
      toast.error("Failed to load header blocklist rules");
    } finally {
      setLoadingRules(false);
    }
  };

  const fetchModels = async () => {
    try {
      const data = await api.models.list();
      setModels(data);
    } catch {
      toast.error("Failed to load models for FX mapping");
    }
  };

  const fetchCostingSettings = async () => {
    setCostingLoading(true);
    try {
      const data = await api.settings.costing.get();
      setCostingForm({
        report_currency_code: data.report_currency_code,
        report_currency_symbol: data.report_currency_symbol,
        timezone_preference: data.timezone_preference,
        endpoint_fx_mappings: data.endpoint_fx_mappings,
      });
      setCostingUnavailable(false);
    } catch (error) {
      if (error instanceof Error && /not found/i.test(error.message)) {
        setCostingUnavailable(true);
      } else {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load costing settings"
        );
      }
    } finally {
      setCostingLoading(false);
    }
  };

  const loadMappingConnections = async (modelConfigId: number) => {
    setMappingLoading(true);
    setMappingEndpointId("");
    try {
      const model = await api.models.get(modelConfigId);
      setMappingConnections(model.connections ?? []);
    } catch {
      setMappingConnections([]);
      toast.error("Failed to load connections for selected model");
    } finally {
      setMappingLoading(false);
    }
  };

  const handleAddFxMapping = () => {
    if (!mappingModelId || !mappingEndpointId || !mappingFxRate.trim()) {
      toast.error("Model, endpoint, and FX rate are required");
      return;
    }
    if (!isValidPositiveDecimalString(mappingFxRate)) {
      toast.error("FX rate must be a valid decimal greater than zero");
      return;
    }

    const endpointId = Number.parseInt(mappingEndpointId, 10);
    if (Number.isNaN(endpointId)) {
      toast.error("Invalid endpoint selection");
      return;
    }

    const duplicate = costingForm.endpoint_fx_mappings.some(
      (row) => row.model_id === mappingModelId && row.endpoint_id === endpointId
    );
    if (duplicate) {
      toast.error("Duplicate FX mapping for selected model and endpoint");
      return;
    }

    const nextMappings = [
      ...costingForm.endpoint_fx_mappings,
      {
        model_id: mappingModelId,
        endpoint_id: endpointId,
        fx_rate: mappingFxRate.trim(),
      },
    ].sort((a, b) => {
      if (a.model_id === b.model_id) {
        return a.endpoint_id - b.endpoint_id;
      }
      return a.model_id.localeCompare(b.model_id);
    });

    setCostingForm({ ...costingForm, endpoint_fx_mappings: nextMappings });
    setMappingEndpointId("");
    setMappingFxRate("");
  };

  const handleDeleteFxMapping = (mapping: EndpointFxMapping) => {
    setCostingForm({
      ...costingForm,
      endpoint_fx_mappings: costingForm.endpoint_fx_mappings.filter(
        (row) =>
          !(
            row.model_id === mapping.model_id &&
            row.endpoint_id === mapping.endpoint_id
          )
      ),
    });
  };

  const handleSaveCostingSettings = async () => {
    const normalizedCode = costingForm.report_currency_code.trim().toUpperCase();
    const normalizedSymbol = costingForm.report_currency_symbol.trim();

    if (!isValidCurrencyCode(normalizedCode)) {
      toast.error("Report currency must be a valid 3-letter code (for example, USD)");
      return;
    }
    if (!normalizedSymbol) {
      toast.error("Report currency symbol is required");
      return;
    }
    if (normalizedSymbol.length > 5) {
      toast.error("Report currency symbol must be 5 characters or fewer");
      return;
    }

    const seen = new Set<string>();
    for (const mapping of costingForm.endpoint_fx_mappings) {
      const key = `${mapping.model_id}::${mapping.endpoint_id}`;
      if (seen.has(key)) {
        toast.error(`Duplicate mapping detected: ${mapping.model_id} #${mapping.endpoint_id}`);
        return;
      }
      seen.add(key);
      if (!isValidPositiveDecimalString(mapping.fx_rate)) {
        toast.error(
          `FX rate for ${mapping.model_id} #${mapping.endpoint_id} must be greater than zero`
        );
        return;
      }
    }

    const payload: CostingSettingsUpdate = {
      report_currency_code: normalizedCode,
      report_currency_symbol: normalizedSymbol,
      endpoint_fx_mappings: costingForm.endpoint_fx_mappings,
      timezone_preference: costingForm.timezone_preference,
    };

    setCostingSaving(true);
    try {
      const saved = await api.settings.costing.update(payload);
      setCostingForm({
        report_currency_code: saved.report_currency_code,
        report_currency_symbol: saved.report_currency_symbol,
        timezone_preference: saved.timezone_preference,
        endpoint_fx_mappings: saved.endpoint_fx_mappings,
      });
      toast.success("Costing settings saved");
      setCostingUnavailable(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save costing settings"
      );
    } finally {
      setCostingSaving(false);
    }
  };

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
      const parsed = JSON.parse(text);
      
      const validation = ConfigImportSchema.safeParse(parsed);
      if (!validation.success) {
        const errors = validation.error.issues.map((e: z.ZodIssue) => `${e.path.join(".")}: ${e.message}`).join(", ");
        throw new Error(`Invalid configuration: ${errors}`);
      }
      
      setParsedConfig(validation.data as ConfigImportRequest);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid JSON file");
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
        `Imported ${result.providers_imported} providers, ${result.endpoints_imported} endpoints, ${result.models_imported} models, ${result.connections_imported} connections`
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

  const handleToggleRule = async (rule: HeaderBlocklistRule, checked: boolean) => {
    setBlocklistRules((prev) =>
      prev.map((r) => (r.id === rule.id ? { ...r, enabled: checked } : r))
    );
    try {
      await api.config.headerBlocklistRules.update(rule.id, { enabled: checked });
    } catch {
      setBlocklistRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, enabled: !checked } : r))
      );
      toast.error("Failed to update rule");
    }
  };

  const openAddRuleDialog = () => {
    setEditingRule(null);
    setRuleForm({ name: "", match_type: "exact", pattern: "", enabled: true });
    setRuleDialogOpen(true);
  };

  const openEditRuleDialog = (rule: HeaderBlocklistRule) => {
    setEditingRule(rule);
    setRuleForm({
      name: rule.name,
      match_type: rule.match_type,
      pattern: rule.pattern,
      enabled: rule.enabled,
    });
    setRuleDialogOpen(true);
  };

  const handleSaveRule = async () => {
    if (!ruleForm.name || !ruleForm.pattern) {
      toast.error("Name and pattern are required");
      return;
    }

    if (ruleForm.match_type === "prefix" && !ruleForm.pattern.endsWith("-")) {
      toast.error("Prefix patterns must end with a hyphen (-)");
      return;
    }

    try {
      if (editingRule) {
        await api.config.headerBlocklistRules.update(editingRule.id, ruleForm);
        toast.success("Rule updated successfully");
      } else {
        await api.config.headerBlocklistRules.create(ruleForm);
        toast.success("Rule created successfully");
      }
      setRuleDialogOpen(false);
      fetchRules();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save rule");
    }
  };

  const handleDeleteRule = async () => {
    if (!deleteRuleConfirm) return;
    try {
      await api.config.headerBlocklistRules.delete(deleteRuleConfirm.id);
      toast.success("Rule deleted successfully");
      setDeleteRuleConfirm(null);
      fetchRules();
    } catch {
      toast.error("Failed to delete rule");
    }
  };

  const nativeModels = models
    .filter((model) => model.model_type === "native")
    .sort((a, b) => a.model_id.localeCompare(b.model_id));
  const modelLabelMap = new Map(
    nativeModels.map((model) => [model.model_id, model.display_name || model.model_id])
  );
  const mappingEndpointOptions = Array.from(
    new Map(
      mappingConnections.map((connection) => [
        connection.endpoint_id,
        {
          endpointId: connection.endpoint_id,
          label:
            connection.endpoint?.name ||
            connection.endpoint?.base_url ||
            getConnectionName(connection) ||
            `Endpoint #${connection.endpoint_id}`,
        },
      ])
    ).values()
  ).sort((a, b) => a.endpointId - b.endpointId);

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage providers, backups, costing settings, and data retention" />

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
              Download providers, models, endpoints, blocklist rules, and costing settings as JSON.
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
              existing providers, models, endpoints, and user-defined settings.
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
              <Coins className="h-4 w-4" />
              Costing and Currency
            </CardTitle>
            <CardDescription className="text-xs">
              Configure report currency and endpoint FX mappings used by spending reports. Unmapped endpoints use default 1:1 conversion.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {costingUnavailable ? (
              <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
                Costing settings API is currently unavailable. Upgrade the backend to enable this feature.
              </div>
            ) : costingLoading ? (
              <div className="space-y-2">
                <div className="h-9 animate-pulse rounded bg-muted" />
                <div className="h-9 animate-pulse rounded bg-muted" />
                <div className="h-24 animate-pulse rounded bg-muted" />
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="report-currency-code">Report Currency Code</Label>
                    <Input
                      id="report-currency-code"
                      maxLength={3}
                      value={costingForm.report_currency_code}
                      onChange={(e) =>
                        setCostingForm({
                          ...costingForm,
                          report_currency_code: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="USD"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="report-currency-symbol">Report Currency Symbol</Label>
                    <Input
                      id="report-currency-symbol"
                      maxLength={5}
                      value={costingForm.report_currency_symbol}
                      onChange={(e) =>
                        setCostingForm({
                          ...costingForm,
                          report_currency_symbol: e.target.value,
                        })
                      }
                      placeholder="$"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleSaveCostingSettings}
                      disabled={costingSaving}
                      className="w-full"
                    >
                      {costingSaving ? "Saving..." : "Save Costing Settings"}
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border p-3">
                  <div className="space-y-1 pb-3">
                    <h4 className="text-sm font-medium">Endpoint FX Mappings</h4>
                    <p className="text-xs text-muted-foreground">
                      Each mapping is scoped by model and endpoint. Endpoint-specific rates override default 1:1 conversion.
                    </p>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-4">
                    <div className="space-y-2">
                      <Label>Model</Label>
                      <Select
                        value={mappingModelId}
                        onValueChange={(value) => {
                          setMappingModelId(value);
                          const selectedModel = nativeModels.find(
                            (model) => model.model_id === value
                          );
                          if (selectedModel) {
                            loadMappingConnections(selectedModel.id);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          {nativeModels.map((model) => (
                            <SelectItem key={model.id} value={model.model_id}>
                              {model.display_name || model.model_id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Endpoint</Label>
                      <Select
                        value={mappingEndpointId}
                        onValueChange={setMappingEndpointId}
                        disabled={!mappingModelId || mappingLoading}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={mappingLoading ? "Loading endpoints..." : "Select endpoint"}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {mappingEndpointOptions.map((endpoint) => (
                            <SelectItem
                              key={endpoint.endpointId}
                              value={String(endpoint.endpointId)}
                            >
                              #{endpoint.endpointId} {endpoint.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mapping-fx-rate">FX Rate</Label>
                      <Input
                        id="mapping-fx-rate"
                        value={mappingFxRate}
                        onChange={(e) => setMappingFxRate(e.target.value)}
                        placeholder="1.000000"
                        inputMode="decimal"
                      />
                    </div>

                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={handleAddFxMapping}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Mapping
                      </Button>
                    </div>
                  </div>

                  {costingForm.endpoint_fx_mappings.length === 0 ? (
                    <div className="mt-3 rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">
                      No endpoint FX mappings configured.
                    </div>
                  ) : (
                    <div className="mt-3 rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Model</TableHead>
                            <TableHead>Endpoint</TableHead>
                            <TableHead>FX Rate</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {costingForm.endpoint_fx_mappings.map((mapping) => (
                            <TableRow key={`${mapping.model_id}-${mapping.endpoint_id}`}>
                              <TableCell className="font-medium">
                                {modelLabelMap.get(mapping.model_id) || mapping.model_id}
                              </TableCell>
                              <TableCell>#{mapping.endpoint_id}</TableCell>
                              <TableCell>{mapping.fx_rate}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteFxMapping(mapping)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4" />
              Timezone
            </CardTitle>
            <CardDescription className="text-xs">
              Set the timezone for displaying timestamps across the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {costingUnavailable ? (
              <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
                Settings API is currently unavailable.
              </div>
            ) : costingLoading ? (
              <div className="space-y-2">
                <div className="h-9 animate-pulse rounded bg-muted" />
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 items-end">
                <div className="space-y-2">
                  <Label>Timezone Preference</Label>
                  <Select
                    value={costingForm.timezone_preference || "auto"}
                    onValueChange={(value) =>
                      setCostingForm({
                        ...costingForm,
                        timezone_preference: value === "auto" ? null : value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">
                        Auto (Browser: {Intl.DateTimeFormat().resolvedOptions().timeZone})
                      </SelectItem>
                      {Intl.supportedValuesOf("timeZone").map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleSaveCostingSettings}
                  disabled={costingSaving}
                  className="w-full sm:w-auto"
                >
                  {costingSaving ? "Saving..." : "Save Timezone"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>


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
                         className="data-[state=checked]:bg-emerald-500"
                       />
                       <Label htmlFor={`audit-${provider.id}`} className="text-xs">Audit</Label>
                     </div>
                     <div className="flex items-center gap-2">
                       <Switch
                         id={`bodies-${provider.id}`}
                         checked={provider.audit_capture_bodies}
                         onCheckedChange={(checked) => toggleBodies(provider.id, checked)}
                         disabled={!provider.audit_enabled}
                         className="data-[state=checked]:bg-emerald-500"
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
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Ban className="h-4 w-4" />
                  Header Blocklist
                </CardTitle>
                <CardDescription className="text-xs">
                  Manage headers stripped from upstream requests. System rules protect against Cloudflare tunnel metadata leaking to providers.
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={openAddRuleDialog}>
                <Plus className="mr-2 h-3.5 w-3.5" />
                Add Rule
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingRules ? (
              <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">
                Loading rules...
              </div>
            ) : blocklistRules.length === 0 ? (
              <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">
                No rules found.
              </div>
            ) : (
              <>
                {blocklistRules.filter((r) => r.is_system).length > 0 && (
                  <Collapsible open={systemRulesOpen} onOpenChange={setSystemRulesOpen}>
                    <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-muted/50 transition-colors">
                      <ChevronRight className={`h-4 w-4 transition-transform ${systemRulesOpen ? "rotate-90" : ""}`} />
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      System Rules
                      <span className="text-xs text-muted-foreground">
                        ({blocklistRules.filter((r) => r.is_system).length})
                      </span>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="rounded-md border mt-1.5">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[80px]">Enabled</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Pattern</TableHead>
                              <TableHead className="w-[100px] text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {blocklistRules.filter((r) => r.is_system).map((rule) => (
                              <TableRow key={rule.id}>
                                <TableCell>
                                  <Switch
                                    checked={rule.enabled}
                                    onCheckedChange={(checked) => handleToggleRule(rule, checked)}
                                    className="data-[state=checked]:bg-emerald-500"
                                  />
                                </TableCell>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    {rule.name}
                                    <Lock className="h-3 w-3 text-muted-foreground" />
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <TypeBadge
                                    label={rule.match_type}
                                    intent={rule.match_type === "exact" ? "info" : "accent"}
                                  />
                                </TableCell>
                                <TableCell>
                                  <code className="rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                                    {rule.pattern}
                                  </code>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => openEditRuleDialog(rule)}
                                      disabled
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:text-destructive"
                                      onClick={() => setDeleteRuleConfirm(rule)}
                                      disabled
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {blocklistRules.filter((r) => !r.is_system).length > 0 && (
                  <Collapsible open={userRulesOpen} onOpenChange={setUserRulesOpen}>
                    <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-muted/50 transition-colors">
                      <ChevronRight className={`h-4 w-4 transition-transform ${userRulesOpen ? "rotate-90" : ""}`} />
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      User Rules
                      <span className="text-xs text-muted-foreground">
                        ({blocklistRules.filter((r) => !r.is_system).length})
                      </span>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="rounded-md border mt-1.5">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[80px]">Enabled</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Pattern</TableHead>
                              <TableHead className="w-[100px] text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {blocklistRules.filter((r) => !r.is_system).map((rule) => (
                              <TableRow key={rule.id}>
                                <TableCell>
                                  <Switch
                                    checked={rule.enabled}
                                    onCheckedChange={(checked) => handleToggleRule(rule, checked)}
                                    className="data-[state=checked]:bg-emerald-500"
                                  />
                                </TableCell>
                                <TableCell className="font-medium">
                                  {rule.name}
                                </TableCell>
                                <TableCell>
                                  <TypeBadge
                                    label={rule.match_type}
                                    intent={rule.match_type === "exact" ? "info" : "accent"}
                                  />
                                </TableCell>
                                <TableCell>
                                  <code className="rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                                    {rule.pattern}
                                  </code>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => openEditRuleDialog(rule)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:text-destructive"
                                      onClick={() => setDeleteRuleConfirm(rule)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </>
            )}
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

      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRule ? "Edit Rule" : "Add Rule"}</DialogTitle>
            <DialogDescription>
              {editingRule
                ? "Modify an existing header blocklist rule."
                : "Create a new rule to block specific headers from being sent upstream."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rule-name" className="text-right">
                Name
              </Label>
              <Input
                id="rule-name"
                value={ruleForm.name}
                onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                className="col-span-3"
                placeholder="e.g. Cloudflare Headers"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rule-type" className="text-right">
                Type
              </Label>
              <Select
                value={ruleForm.match_type}
                onValueChange={(v) =>
                  setRuleForm({ ...ruleForm, match_type: v as "exact" | "prefix" })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exact">Exact Match</SelectItem>
                  <SelectItem value="prefix">Prefix Match</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rule-pattern" className="text-right">
                Pattern
              </Label>
              <div className="col-span-3 space-y-1">
                <Input
                  id="rule-pattern"
                  value={ruleForm.pattern}
                  onChange={(e) => setRuleForm({ ...ruleForm, pattern: e.target.value })}
                  className="font-mono"
                  placeholder={ruleForm.match_type === "prefix" ? "cf-" : "x-custom-header"}
                />
                {ruleForm.match_type === "prefix" && (
                  <p className="text-[0.8rem] text-muted-foreground">
                    Prefix patterns must end with a hyphen (-).
                  </p>
                )}
              </div>
            </div>
            <SwitchController
              label="Enabled"
              description="Activate this rule immediately"
              checked={ruleForm.enabled}
              onCheckedChange={(checked) => setRuleForm({ ...ruleForm, enabled: checked })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRule}>Save Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteRuleConfirm}
        onOpenChange={(open) => !open && setDeleteRuleConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Rule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the rule "{deleteRuleConfirm?.name}"? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRuleConfirm(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteRule}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
