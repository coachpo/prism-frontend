import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { z } from "zod";
import {
  AlertTriangle,
  Ban,
  Check,
  ChevronRight,
  Coins,
  Download,
  Globe,
  Info,
  Lock,
  Pencil,
  Plus,
  Shield,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useProfileContext } from "@/context/ProfileContext";
import { api } from "@/lib/api";
import { isValidCurrencyCode, isValidPositiveDecimalString } from "@/lib/costing";
import { cn } from "@/lib/utils";
import type {
  ConfigImportRequest,
  Connection,
  CostingSettingsUpdate,
  EndpointFxMapping,
  HeaderBlocklistRule,
  HeaderBlocklistRuleCreate,
  ModelConfigListItem,
  Provider,
} from "@/lib/types";
import { ConfigImportSchema } from "@/lib/configImportValidation";
import { PageHeader } from "@/components/PageHeader";
import { ProviderIcon } from "@/components/ProviderIcon";
import { StatusBadge, TypeBadge } from "@/components/StatusBadge";
import { SwitchController } from "@/components/SwitchController";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

const SETTINGS_SECTIONS = [
  { id: "backup", label: "Backup" },
  { id: "billing-currency", label: "Billing & Currency" },
  { id: "timezone", label: "Timezone" },
  { id: "audit-configuration", label: "Audit & Privacy" },
  { id: "retention-deletion", label: "Retention & Deletion" },
] as const;

const IMPORT_CONFIRM_KEYWORDS = new Set(["IMPORT", "RESTORE"]);
const DELETE_CONFIRM_KEYWORD = "DELETE";
const FX_RATE_MAX_DECIMALS = 6;
const TIMEZONE_PREVIEW_SOURCE = new Date("2026-02-27T21:39:00Z");

const DEFAULT_COSTING_FORM: CostingSettingsUpdate = {
  report_currency_code: "USD",
  report_currency_symbol: "$",
  timezone_preference: null,
  endpoint_fx_mappings: [],
};

const getConnectionName = (connection: Pick<Connection, "name" | "description">): string =>
  connection.name || connection.description || "";

const getMappingKey = (mapping: EndpointFxMapping): string =>
  `${mapping.model_id}::${mapping.endpoint_id}`;

const normalizeMappings = (mappings: EndpointFxMapping[]): EndpointFxMapping[] =>
  [...mappings]
    .map((mapping) => ({
      ...mapping,
      fx_rate: mapping.fx_rate.trim(),
    }))
    .sort((a, b) => {
      if (a.model_id === b.model_id) {
        return a.endpoint_id - b.endpoint_id;
      }
      return a.model_id.localeCompare(b.model_id);
    });

const normalizeCostingForm = (form: CostingSettingsUpdate): CostingSettingsUpdate => ({
  report_currency_code: form.report_currency_code.trim().toUpperCase(),
  report_currency_symbol: form.report_currency_symbol.trim(),
  timezone_preference: form.timezone_preference ?? null,
  endpoint_fx_mappings: normalizeMappings(form.endpoint_fx_mappings),
});

const areMappingsEqual = (left: EndpointFxMapping[], right: EndpointFxMapping[]): boolean => {
  if (left.length !== right.length) {
    return false;
  }
  for (let index = 0; index < left.length; index += 1) {
    if (
      left[index].model_id !== right[index].model_id ||
      left[index].endpoint_id !== right[index].endpoint_id ||
      left[index].fx_rate !== right[index].fx_rate
    ) {
      return false;
    }
  }
  return true;
};

const validateFxRate = (rawValue: string): string | null => {
  const value = rawValue.trim();
  if (!value) {
    return "FX rate is required";
  }
  if (!isValidPositiveDecimalString(value)) {
    return "FX rate must be greater than zero";
  }
  const [, decimals = ""] = value.split(".");
  if (decimals.length > FX_RATE_MAX_DECIMALS) {
    return `Use up to ${FX_RATE_MAX_DECIMALS} decimal places`;
  }
  return null;
};

const validateMappings = (mappings: EndpointFxMapping[]): string | null => {
  const seen = new Set<string>();
  for (const mapping of mappings) {
    const key = getMappingKey(mapping);
    if (seen.has(key)) {
      return `Duplicate FX mapping detected for ${mapping.model_id} #${mapping.endpoint_id}`;
    }
    seen.add(key);

    const fxRateError = validateFxRate(mapping.fx_rate);
    if (fxRateError) {
      return `FX rate for ${mapping.model_id} #${mapping.endpoint_id}: ${fxRateError}`;
    }
  }
  return null;
};

const formatFxRateDisplay = (value: string): string => {
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) {
    return value;
  }
  return numeric.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: FX_RATE_MAX_DECIMALS,
  });
};

const formatTimezonePreview = (timezone: string): string => {
  try {
    const parts = new Intl.DateTimeFormat("sv-SE", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(TIMEZONE_PREVIEW_SOURCE);

    const byType = new Map(parts.map((part) => [part.type, part.value]));
    const year = byType.get("year") ?? "0000";
    const month = byType.get("month") ?? "00";
    const day = byType.get("day") ?? "00";
    const hour = byType.get("hour") ?? "00";
    const minute = byType.get("minute") ?? "00";
    return `${year}-${month}-${day} ${hour}:${minute}`;
  } catch {
    return "Unavailable";
  }
};

export function SettingsPage() {
  const location = useLocation();
  const { selectedProfile, revision, bumpRevision } = useProfileContext();
  const selectedProfileLabel = selectedProfile
    ? `${selectedProfile.name} (#${selectedProfile.id})`
    : "the selected profile";

  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportSecretsAcknowledged, setExportSecretsAcknowledged] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedConfig, setParsedConfig] = useState<ConfigImportRequest | null>(null);
  const [importConfirmPhrase, setImportConfirmPhrase] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const auditConfigurationRef = useRef<HTMLDivElement | null>(null);
  const [isAuditConfigurationFocused, setIsAuditConfigurationFocused] = useState(false);

  const [providers, setProviders] = useState<Provider[]>([]);
  const [bulkAuditSaving, setBulkAuditSaving] = useState(false);

  const [cleanupType, setCleanupType] = useState<"" | "requests" | "audits">("");
  const [retentionPreset, setRetentionPreset] = useState<"" | "7" | "30" | "90" | "all">("");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "requests" | "audits";
    days: number | null;
    deleteAll: boolean;
  } | null>(null);
  const [deleteConfirmPhrase, setDeleteConfirmPhrase] = useState("");
  const [deleting, setDeleting] = useState(false);

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
  const [savedCostingForm, setSavedCostingForm] = useState<CostingSettingsUpdate | null>(null);
  const [recentlySavedSection, setRecentlySavedSection] = useState<"billing" | "timezone" | null>(
    null
  );
  const [models, setModels] = useState<ModelConfigListItem[]>([]);
  const [mappingConnections, setMappingConnections] = useState<Connection[]>([]);
  const [mappingLoading, setMappingLoading] = useState(false);
  const [mappingModelId, setMappingModelId] = useState("");
  const [mappingEndpointId, setMappingEndpointId] = useState("");
  const [mappingFxRate, setMappingFxRate] = useState("");
  const [editingMappingKey, setEditingMappingKey] = useState<string | null>(null);
  const [editingMappingFxRate, setEditingMappingFxRate] = useState("");
  const [costingForm, setCostingForm] = useState<CostingSettingsUpdate>(DEFAULT_COSTING_FORM);

  useEffect(() => {
    api.providers.list().then(setProviders).catch(() => toast.error("Failed to load providers"));
    void fetchRules();
    void fetchCostingSettings();
    void fetchModels();
  }, [revision]);

  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (!hash) {
      setIsAuditConfigurationFocused(false);
      return;
    }

    const target = document.getElementById(hash);
    if (!target) {
      setIsAuditConfigurationFocused(false);
      return;
    }

    if (hash === "audit-configuration") {
      setIsAuditConfigurationFocused(true);
    } else {
      setIsAuditConfigurationFocused(false);
    }

    const frameId = window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      if (target instanceof HTMLElement) {
        target.focus({ preventScroll: true });
      }
    });

    if (hash !== "audit-configuration") {
      return () => {
        window.cancelAnimationFrame(frameId);
      };
    }

    const clearHighlightTimer = window.setTimeout(() => {
      setIsAuditConfigurationFocused(false);
    }, 3000);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(clearHighlightTimer);
    };
  }, [location.hash]);

  useEffect(() => {
    if (!recentlySavedSection) {
      return;
    }
    const timerId = window.setTimeout(() => {
      setRecentlySavedSection(null);
    }, 2500);
    return () => {
      window.clearTimeout(timerId);
    };
  }, [recentlySavedSection]);

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
      const normalized = normalizeCostingForm({
        report_currency_code: data.report_currency_code,
        report_currency_symbol: data.report_currency_symbol,
        timezone_preference: data.timezone_preference,
        endpoint_fx_mappings: data.endpoint_fx_mappings,
      });
      setCostingForm(normalized);
      setSavedCostingForm(normalized);
      setCostingUnavailable(false);
    } catch (error) {
      if (error instanceof Error && /not found/i.test(error.message)) {
        setCostingUnavailable(true);
      } else {
        toast.error(error instanceof Error ? error.message : "Failed to load costing settings");
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

  const normalizedCurrentCosting = useMemo(
    () => normalizeCostingForm(costingForm),
    [costingForm]
  );

  const billingDirty = useMemo(() => {
    if (!savedCostingForm) {
      return false;
    }
    return (
      savedCostingForm.report_currency_code !== normalizedCurrentCosting.report_currency_code ||
      savedCostingForm.report_currency_symbol !== normalizedCurrentCosting.report_currency_symbol ||
      !areMappingsEqual(
        savedCostingForm.endpoint_fx_mappings,
        normalizedCurrentCosting.endpoint_fx_mappings
      )
    );
  }, [normalizedCurrentCosting, savedCostingForm]);

  const timezoneDirty = useMemo(() => {
    if (!savedCostingForm) {
      return false;
    }
    return (
      (savedCostingForm.timezone_preference ?? null) !==
      (normalizedCurrentCosting.timezone_preference ?? null)
    );
  }, [normalizedCurrentCosting.timezone_preference, savedCostingForm]);

  const timezonePreviewZone =
    normalizedCurrentCosting.timezone_preference || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timezonePreviewText = formatTimezonePreview(timezonePreviewZone);

  const importSummary = useMemo(() => {
    const providersCount = parsedConfig?.providers?.length ?? 0;
    const endpointsCount = parsedConfig?.endpoints?.length ?? 0;
    const modelsCount = parsedConfig?.models?.length ?? 0;
    const connectionsCount =
      parsedConfig?.models?.reduce((total, model) => total + (model.connections?.length ?? 0), 0) ??
      0;
    const customRulesCount =
      parsedConfig?.header_blocklist_rules?.filter((rule) => !rule.is_system).length ?? 0;
    return {
      providersCount,
      endpointsCount,
      modelsCount,
      connectionsCount,
      customRulesCount,
    };
  }, [parsedConfig]);

  const importPhraseNormalized = importConfirmPhrase.trim().toUpperCase();
  const isImportPhraseValid = IMPORT_CONFIRM_KEYWORDS.has(importPhraseNormalized);
  const deletePhraseNormalized = deleteConfirmPhrase.trim().toUpperCase();
  const isDeletePhraseValid = deletePhraseNormalized === DELETE_CONFIRM_KEYWORD;

  const nativeModels = useMemo(
    () =>
      models
        .filter((model) => model.model_type === "native")
        .sort((a, b) => a.model_id.localeCompare(b.model_id)),
    [models]
  );

  const modelLabelMap = useMemo(
    () => new Map(nativeModels.map((model) => [model.model_id, model.display_name || model.model_id])),
    [nativeModels]
  );

  const mappingEndpointOptions = useMemo(
    () =>
      Array.from(
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
      ).sort((a, b) => a.endpointId - b.endpointId),
    [mappingConnections]
  );

  const systemRules = useMemo(
    () => blocklistRules.filter((rule) => rule.is_system),
    [blocklistRules]
  );
  const customRules = useMemo(
    () => blocklistRules.filter((rule) => !rule.is_system),
    [blocklistRules]
  );

  const addMappingFxError = mappingFxRate ? validateFxRate(mappingFxRate) : null;
  const editMappingFxError = editingMappingKey ? validateFxRate(editingMappingFxRate) : null;

  const handleJumpToSection = (sectionId: string) => {
    const target = document.getElementById(sectionId);
    if (!target) {
      return;
    }

    window.history.replaceState(null, "", `#${sectionId}`);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    if (target instanceof HTMLElement) {
      target.focus({ preventScroll: true });
    }
  };

  const handleAddFxMapping = () => {
    if (!mappingModelId || !mappingEndpointId || !mappingFxRate.trim()) {
      toast.error("Model, endpoint, and FX rate are required");
      return;
    }

    const fxRateError = validateFxRate(mappingFxRate);
    if (fxRateError) {
      toast.error(fxRateError);
      return;
    }

    const endpointId = Number.parseInt(mappingEndpointId, 10);
    if (Number.isNaN(endpointId)) {
      toast.error("Invalid endpoint selection");
      return;
    }

    const duplicate = normalizedCurrentCosting.endpoint_fx_mappings.some(
      (row) => row.model_id === mappingModelId && row.endpoint_id === endpointId
    );
    if (duplicate) {
      toast.error("Duplicate FX mapping for selected model and endpoint");
      return;
    }

    const nextMappings = normalizeMappings([
      ...normalizedCurrentCosting.endpoint_fx_mappings,
      {
        model_id: mappingModelId,
        endpoint_id: endpointId,
        fx_rate: mappingFxRate.trim(),
      },
    ]);

    setCostingForm((prev) => ({ ...prev, endpoint_fx_mappings: nextMappings }));
    setMappingEndpointId("");
    setMappingFxRate("");
  };

  const handleDeleteFxMapping = (mapping: EndpointFxMapping) => {
    setCostingForm((prev) => ({
      ...prev,
      endpoint_fx_mappings: prev.endpoint_fx_mappings.filter(
        (row) =>
          !(
            row.model_id === mapping.model_id &&
            row.endpoint_id === mapping.endpoint_id
          )
      ),
    }));

    if (editingMappingKey === getMappingKey(mapping)) {
      setEditingMappingKey(null);
      setEditingMappingFxRate("");
    }
  };

  const handleStartEditFxMapping = (mapping: EndpointFxMapping) => {
    setEditingMappingKey(getMappingKey(mapping));
    setEditingMappingFxRate(mapping.fx_rate);
  };

  const handleCancelEditFxMapping = () => {
    setEditingMappingKey(null);
    setEditingMappingFxRate("");
  };

  const handleSaveEditFxMapping = () => {
    if (!editingMappingKey) {
      return;
    }

    const fxRateError = validateFxRate(editingMappingFxRate);
    if (fxRateError) {
      toast.error(fxRateError);
      return;
    }

    setCostingForm((prev) => ({
      ...prev,
      endpoint_fx_mappings: normalizeMappings(
        prev.endpoint_fx_mappings.map((row) =>
          getMappingKey(row) === editingMappingKey
            ? { ...row, fx_rate: editingMappingFxRate.trim() }
            : row
        )
      ),
    }));
    setEditingMappingKey(null);
    setEditingMappingFxRate("");
  };

  const handleSaveCostingSettings = async (section: "billing" | "timezone") => {
    const baseline = savedCostingForm ?? normalizedCurrentCosting;

    const normalizedCode = normalizedCurrentCosting.report_currency_code;
    const normalizedSymbol = normalizedCurrentCosting.report_currency_symbol;
    const normalizedMappings = normalizedCurrentCosting.endpoint_fx_mappings;

    if (section === "billing") {
      if (!isValidCurrencyCode(normalizedCode)) {
        toast.error("Reporting currency must be a valid 3-letter code (for example, USD)");
        return;
      }
      if (!normalizedSymbol) {
        toast.error("Reporting currency symbol is required");
        return;
      }
      if (normalizedSymbol.length > 5) {
        toast.error("Reporting currency symbol must be 5 characters or fewer");
        return;
      }

      const mappingValidationError = validateMappings(normalizedMappings);
      if (mappingValidationError) {
        toast.error(mappingValidationError);
        return;
      }
    } else {
      if (!isValidCurrencyCode(baseline.report_currency_code) || !baseline.report_currency_symbol) {
        toast.error("Save billing and currency settings before saving timezone.");
        return;
      }
      const baselineMappingError = validateMappings(baseline.endpoint_fx_mappings);
      if (baselineMappingError) {
        toast.error("Fix billing and currency mapping errors before saving timezone.");
        return;
      }
    }

    const payload: CostingSettingsUpdate =
      section === "billing"
        ? {
            report_currency_code: normalizedCode,
            report_currency_symbol: normalizedSymbol,
            endpoint_fx_mappings: normalizedMappings,
            timezone_preference: baseline.timezone_preference,
          }
        : {
            report_currency_code: baseline.report_currency_code,
            report_currency_symbol: baseline.report_currency_symbol,
            endpoint_fx_mappings: baseline.endpoint_fx_mappings,
            timezone_preference: normalizedCurrentCosting.timezone_preference,
          };

    setCostingSaving(true);
    try {
      const saved = await api.settings.costing.update(payload);
      const normalizedSaved = normalizeCostingForm({
        report_currency_code: saved.report_currency_code,
        report_currency_symbol: saved.report_currency_symbol,
        timezone_preference: saved.timezone_preference,
        endpoint_fx_mappings: saved.endpoint_fx_mappings,
      });

      if (section === "billing") {
        setCostingForm((prev) => ({
          ...prev,
          report_currency_code: normalizedSaved.report_currency_code,
          report_currency_symbol: normalizedSaved.report_currency_symbol,
          endpoint_fx_mappings: normalizedSaved.endpoint_fx_mappings,
        }));
        setSavedCostingForm((prev) => ({
          report_currency_code: normalizedSaved.report_currency_code,
          report_currency_symbol: normalizedSaved.report_currency_symbol,
          endpoint_fx_mappings: normalizedSaved.endpoint_fx_mappings,
          timezone_preference: prev?.timezone_preference ?? baseline.timezone_preference,
        }));
        setRecentlySavedSection("billing");
        toast.success("Billing and currency settings saved");
      } else {
        setCostingForm((prev) => ({
          ...prev,
          timezone_preference: normalizedSaved.timezone_preference,
        }));
        setSavedCostingForm((prev) => ({
          report_currency_code: prev?.report_currency_code ?? normalizedSaved.report_currency_code,
          report_currency_symbol: prev?.report_currency_symbol ?? normalizedSaved.report_currency_symbol,
          endpoint_fx_mappings: prev?.endpoint_fx_mappings ?? normalizedSaved.endpoint_fx_mappings,
          timezone_preference: normalizedSaved.timezone_preference,
        }));
        setRecentlySavedSection("timezone");
        toast.success("Timezone saved");
      }

      setCostingUnavailable(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setCostingSaving(false);
    }
  };

  const toggleAudit = async (providerId: number, checked: boolean) => {
    setProviders((prev) =>
      prev.map((provider) =>
        provider.id === providerId ? { ...provider, audit_enabled: checked } : provider
      )
    );
    try {
      await api.providers.update(providerId, { audit_enabled: checked });
    } catch {
      setProviders((prev) =>
        prev.map((provider) =>
          provider.id === providerId ? { ...provider, audit_enabled: !checked } : provider
        )
      );
      toast.error("Failed to update provider");
    }
  };

  const toggleBodies = async (providerId: number, checked: boolean) => {
    setProviders((prev) =>
      prev.map((provider) =>
        provider.id === providerId
          ? { ...provider, audit_capture_bodies: checked }
          : provider
      )
    );
    try {
      await api.providers.update(providerId, { audit_capture_bodies: checked });
    } catch {
      setProviders((prev) =>
        prev.map((provider) =>
          provider.id === providerId
            ? { ...provider, audit_capture_bodies: !checked }
            : provider
        )
      );
      toast.error("Failed to update provider");
    }
  };

  const applyAuditBulkUpdate = async (
    getNextProvider: (provider: Provider) => Provider,
    successMessage: string
  ) => {
    const previous = providers;
    const next = providers.map(getNextProvider);
    const changed = next.filter((provider, index) => {
      const before = previous[index];
      return (
        before.audit_enabled !== provider.audit_enabled ||
        before.audit_capture_bodies !== provider.audit_capture_bodies
      );
    });

    if (changed.length === 0) {
      toast.message("No provider updates needed");
      return;
    }

    setProviders(next);
    setBulkAuditSaving(true);
    try {
      await Promise.all(
        changed.map((provider) =>
          api.providers.update(provider.id, {
            audit_enabled: provider.audit_enabled,
            audit_capture_bodies: provider.audit_capture_bodies,
          })
        )
      );
      toast.success(successMessage);
    } catch {
      setProviders(previous);
      toast.error("Failed to apply bulk audit update");
    } finally {
      setBulkAuditSaving(false);
    }
  };

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

  const handleExport = async () => {
    if (!exportSecretsAcknowledged) {
      toast.error("Acknowledge the secrets warning before exporting.");
      return;
    }

    setExporting(true);
    try {
      const data = await api.config.export();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const date = new Date().toISOString().split("T")[0];
      anchor.href = url;
      anchor.download = `gateway-config-${date}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("Configuration exported successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setSelectedFile(file);
    setConfirmOpen(false);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      const validation = ConfigImportSchema.safeParse(parsed);
      if (!validation.success) {
        const errors = validation.error.issues
          .map((issue: z.ZodIssue) => `${issue.path.join(".")}: ${issue.message}`)
          .join(", ");
        throw new Error(
          `Invalid configuration. Only schema version 1 with replace mode is supported: ${errors}`
        );
      }

      setParsedConfig(validation.data as ConfigImportRequest);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid JSON file");
      setSelectedFile(null);
      setParsedConfig(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleImport = async () => {
    if (!parsedConfig || !isImportPhraseValid) {
      return;
    }

    setImporting(true);
    try {
      const result = await api.config.import(parsedConfig);
      toast.success(
        `Imported ${result.providers_imported} providers, ${result.endpoints_imported} endpoints, ${result.models_imported} models, ${result.connections_imported} connections`
      );
      setSelectedFile(null);
      setParsedConfig(null);
      setImportConfirmPhrase("");
      setConfirmOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      bumpRevision();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const handleToggleRule = async (rule: HeaderBlocklistRule, checked: boolean) => {
    setBlocklistRules((prev) =>
      prev.map((row) => (row.id === rule.id ? { ...row, enabled: checked } : row))
    );
    try {
      await api.config.headerBlocklistRules.update(rule.id, { enabled: checked });
    } catch {
      setBlocklistRules((prev) =>
        prev.map((row) => (row.id === rule.id ? { ...row, enabled: !checked } : row))
      );
      toast.error("Failed to update rule");
    }
  };

  const openAddRuleDialog = () => {
    setEditingRule(null);
    setRuleForm({
      name: "",
      match_type: "exact",
      pattern: "",
      enabled: true,
    });
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
      void fetchRules();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save rule");
    }
  };

  const handleDeleteRule = async () => {
    if (!deleteRuleConfirm) {
      return;
    }

    try {
      await api.config.headerBlocklistRules.delete(deleteRuleConfirm.id);
      toast.success("Rule deleted successfully");
      setDeleteRuleConfirm(null);
      void fetchRules();
    } catch {
      toast.error("Failed to delete rule");
    }
  };

  const renderSectionSaveState = (
    section: "billing" | "timezone",
    isDirty: boolean
  ): React.ReactNode => {
    if (isDirty) {
      return <StatusBadge label="Unsaved changes" intent="warning" />;
    }

    if (recentlySavedSection === section) {
      return (
        <Badge
          variant="outline"
          className="text-[10px] border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
        >
          <Check className="h-3 w-3" />
          Saved
        </Badge>
      );
    }

    return null;
  };

  const activeSection = location.hash.replace("#", "");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage profile-scoped backup, reporting, privacy, and retention controls"
      />

      <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Badge
            variant="outline"
            className="w-fit border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300"
          >
            Profile-scoped settings
          </Badge>
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Changes here affect {selectedProfileLabel} and its runtime traffic.
          </p>
        </div>
      </div>

      <div className="space-y-4 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6 lg:space-y-0">
        <aside className="lg:sticky lg:top-4 lg:h-fit">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Settings Sections</CardTitle>
              <CardDescription className="text-xs">
                Use quick jump links to navigate this page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {SETTINGS_SECTIONS.map((section) => (
                <Button
                  key={section.id}
                  type="button"
                  variant={activeSection === section.id ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleJumpToSection(section.id)}
                >
                  {section.label}
                </Button>
              ))}
            </CardContent>
          </Card>
        </aside>

        <div className="space-y-6">
          <section id="backup" tabIndex={-1} className="scroll-mt-24 space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-semibold">Backup</h2>
              <p className="text-sm text-muted-foreground">
                Export or restore configuration snapshots for {selectedProfileLabel}.
              </p>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Download className="h-4 w-4" />
                    Export
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Download providers, models, endpoints, blocklist rules, and reporting settings.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2 rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>Exports may include secrets (API keys) in plaintext.</span>
                  </div>

                  <label className="flex items-start gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-input"
                      checked={exportSecretsAcknowledged}
                      onChange={(event) =>
                        setExportSecretsAcknowledged(event.currentTarget.checked)
                      }
                    />
                    <span>I understand this export may contain secrets.</span>
                  </label>

                  <Button
                    onClick={() => void handleExport()}
                    disabled={!exportSecretsAcknowledged || exporting}
                    className="w-full"
                  >
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
                    Restore configuration from a version 1 JSON backup file.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>This affects {selectedProfileLabel} and its runtime traffic.</span>
                  </div>

                  <div className="rounded-md border px-3 py-3 text-sm">
                    <p className="font-medium">What will be replaced</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                      <li>Provider audit defaults and privacy settings</li>
                      <li>Model, endpoint, and connection routing configuration</li>
                      <li>Header blocklist custom rules and reporting preferences</li>
                    </ul>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => void handleExport()}
                    disabled={!exportSecretsAcknowledged || exporting}
                  >
                    Export Backup First
                  </Button>

                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                  />

                  {selectedFile && parsedConfig && (
                    <p className="text-sm text-muted-foreground">
                      Loaded {selectedFile.name}: {importSummary.providersCount} providers, {" "}
                      {importSummary.modelsCount} models, {importSummary.connectionsCount} connections.
                    </p>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="import-confirm-input">Type IMPORT or RESTORE to continue</Label>
                    <Input
                      id="import-confirm-input"
                      value={importConfirmPhrase}
                      onChange={(event) => setImportConfirmPhrase(event.target.value)}
                      placeholder="IMPORT"
                    />
                  </div>

                  <Button
                    onClick={() => setConfirmOpen(true)}
                    disabled={!parsedConfig || importing || !isImportPhraseValid}
                    variant="destructive"
                    className="w-full"
                  >
                    {importing ? "Importing..." : "Import Configuration"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>

          <section id="billing-currency" tabIndex={-1} className="scroll-mt-24">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Coins className="h-4 w-4" />
                      Billing & Currency
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Configure reporting currency and endpoint FX overrides used by spending dashboards.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderSectionSaveState("billing", billingDirty)}
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => void handleSaveCostingSettings("billing")}
                      disabled={
                        costingUnavailable ||
                        costingLoading ||
                        costingSaving ||
                        !billingDirty
                      }
                    >
                      {costingSaving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {costingUnavailable ? (
                  <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
                    Costing settings API is currently unavailable. Upgrade the backend to enable this
                    feature.
                  </div>
                ) : costingLoading ? (
                  <div className="space-y-2">
                    <div className="h-9 animate-pulse rounded bg-muted" />
                    <div className="h-9 animate-pulse rounded bg-muted" />
                    <div className="h-24 animate-pulse rounded bg-muted" />
                  </div>
                ) : (
                  <>
                    <div className="rounded-lg border p-4">
                      <div className="space-y-3">
                        <Label htmlFor="report-currency-code">Reporting currency</Label>
                        <div className="flex flex-wrap items-end gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="report-currency-code" className="text-xs text-muted-foreground">
                              Code
                            </Label>
                            <Input
                              id="report-currency-code"
                              maxLength={3}
                              value={costingForm.report_currency_code}
                              onChange={(event) =>
                                setCostingForm((prev) => ({
                                  ...prev,
                                  report_currency_code: event.target.value.toUpperCase(),
                                }))
                              }
                              placeholder="USD"
                              className="w-28"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="report-currency-symbol" className="text-xs text-muted-foreground">
                              Symbol
                            </Label>
                            <Input
                              id="report-currency-symbol"
                              maxLength={5}
                              value={costingForm.report_currency_symbol}
                              onChange={(event) =>
                                setCostingForm((prev) => ({
                                  ...prev,
                                  report_currency_symbol: event.target.value,
                                }))
                              }
                              placeholder="$"
                              className="w-24"
                            />
                          </div>
                          <p className="pb-2 text-sm font-medium">
                            Reporting currency: {normalizedCurrentCosting.report_currency_code || "---"} ({" "}
                            {normalizedCurrentCosting.report_currency_symbol || "-"})
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Used for spending reports and dashboards.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm font-medium">FX mappings</h4>
                        <Badge variant="outline">Default FX = 1.0</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Mapping overrides default.
                      </p>

                      {normalizedCurrentCosting.endpoint_fx_mappings.length === 0 ? (
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
                                <TableHead>FX rate</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {normalizedCurrentCosting.endpoint_fx_mappings.map((mapping) => {
                                const mappingKey = getMappingKey(mapping);
                                const isEditing = editingMappingKey === mappingKey;
                                return (
                                  <TableRow key={mappingKey}>
                                    <TableCell className="font-medium">
                                      {modelLabelMap.get(mapping.model_id) || mapping.model_id}
                                    </TableCell>
                                    <TableCell>#{mapping.endpoint_id}</TableCell>
                                    <TableCell>
                                      {isEditing ? (
                                        <div className="space-y-1">
                                          <Input
                                            value={editingMappingFxRate}
                                            onChange={(event) =>
                                              setEditingMappingFxRate(event.target.value)
                                            }
                                            className={cn(
                                              "h-8 w-32",
                                              editMappingFxError && "border-destructive"
                                            )}
                                            inputMode="decimal"
                                            aria-invalid={Boolean(editMappingFxError)}
                                          />
                                          {editMappingFxError && (
                                            <p className="text-xs text-destructive">
                                              {editMappingFxError}
                                            </p>
                                          )}
                                        </div>
                                      ) : (
                                        formatFxRateDisplay(mapping.fx_rate)
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="secondary">Override</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex justify-end gap-1">
                                        {isEditing ? (
                                          <>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8"
                                              onClick={handleSaveEditFxMapping}
                                              disabled={Boolean(editMappingFxError)}
                                              aria-label="Save FX mapping"
                                            >
                                              <Check className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8"
                                              onClick={handleCancelEditFxMapping}
                                              aria-label="Cancel FX mapping edit"
                                            >
                                              <X className="h-4 w-4" />
                                            </Button>
                                          </>
                                        ) : (
                                          <>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8"
                                              onClick={() => handleStartEditFxMapping(mapping)}
                                              aria-label="Edit FX mapping"
                                            >
                                              <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8 text-destructive hover:text-destructive"
                                              onClick={() => handleDeleteFxMapping(mapping)}
                                              aria-label="Delete FX mapping"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      )}

                      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px_auto]">
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
                                void loadMappingConnections(selectedModel.id);
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
                                placeholder={
                                  mappingLoading ? "Loading endpoints..." : "Select endpoint"
                                }
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
                          <Label htmlFor="mapping-fx-rate">FX rate</Label>
                          <Input
                            id="mapping-fx-rate"
                            value={mappingFxRate}
                            onChange={(event) => setMappingFxRate(event.target.value)}
                            placeholder="1.000000"
                            inputMode="decimal"
                            aria-invalid={Boolean(addMappingFxError)}
                            className={cn(addMappingFxError && "border-destructive")}
                          />
                          {addMappingFxError && (
                            <p className="text-xs text-destructive">{addMappingFxError}</p>
                          )}
                        </div>

                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={handleAddFxMapping}
                            disabled={
                              !mappingModelId ||
                              !mappingEndpointId ||
                              !mappingFxRate.trim() ||
                              Boolean(addMappingFxError)
                            }
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Mapping
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </section>

          <section id="timezone" tabIndex={-1} className="scroll-mt-24">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4" />
                      Timezone
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Timezone preference affects timestamp rendering across the dashboard.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderSectionSaveState("timezone", timezoneDirty)}
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => void handleSaveCostingSettings("timezone")}
                      disabled={
                        costingUnavailable ||
                        costingLoading ||
                        costingSaving ||
                        !timezoneDirty
                      }
                    >
                      {costingSaving ? "Saving..." : "Save timezone"}
                    </Button>
                  </div>
                </div>
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
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Timezone preference</Label>
                        <Select
                          value={costingForm.timezone_preference || "auto"}
                          onValueChange={(value) =>
                            setCostingForm((prev) => ({
                              ...prev,
                              timezone_preference: value === "auto" ? null : value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">
                              Auto (Browser: {Intl.DateTimeFormat().resolvedOptions().timeZone})
                            </SelectItem>
                            {Intl.supportedValuesOf("timeZone").map((timezone) => (
                              <SelectItem key={timezone} value={timezone}>
                                {timezone}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Example timestamp: {timezonePreviewText} ({timezonePreviewZone})
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <section id="audit-configuration" tabIndex={-1} className="scroll-mt-24 space-y-4">
            <Card
              ref={auditConfigurationRef}
              tabIndex={-1}
              className={cn(
                "transition-all duration-300",
                isAuditConfigurationFocused && "ring-2 ring-primary/50 bg-primary/5"
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Shield className="h-4 w-4" />
                      Audit Configuration
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Configure provider-level audit capture and privacy defaults.
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        void applyAuditBulkUpdate(
                          (provider) => ({ ...provider, audit_enabled: true }),
                          "Enabled audit for all providers"
                        )
                      }
                      disabled={bulkAuditSaving || providers.length === 0}
                    >
                      Enable audit for all
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        void applyAuditBulkUpdate(
                          (provider) => ({
                            ...provider,
                            audit_enabled: false,
                            audit_capture_bodies: false,
                          }),
                          "Disabled audit for all providers"
                        )
                      }
                      disabled={bulkAuditSaving || providers.length === 0}
                    >
                      Disable audit for all
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        void applyAuditBulkUpdate(
                          (provider) => ({ ...provider, audit_capture_bodies: false }),
                          "Disabled body capture for all providers"
                        )
                      }
                      disabled={bulkAuditSaving || providers.length === 0}
                    >
                      Disable bodies for all
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Audit:</span> Record request/response
                    metadata.
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Bodies:</span> Include request/response
                    bodies (sensitive).
                  </p>
                </div>

                {providers.length === 0 ? (
                  <div className="rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">
                    No providers available.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {providers.map((provider) => {
                      const auditStatus = provider.audit_enabled ? "On" : "Off";
                      const bodiesStatus = provider.audit_capture_bodies ? "On" : "Off";

                      return (
                        <div key={provider.id} className="rounded-lg border p-3">
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="space-y-1">
                              <div className="inline-flex items-center gap-2 text-sm font-medium">
                                <ProviderIcon providerType={provider.provider_type} size={14} />
                                {provider.name}
                              </div>
                            </div>

                            <div className="flex flex-col items-start gap-2 md:items-end">
                              <p className="text-xs text-muted-foreground">
                                Audit: {auditStatus} - Bodies: {bodiesStatus}
                              </p>
                              <div className="flex items-center gap-5">
                                <div className="flex items-center gap-2">
                                  <Switch
                                    id={`audit-${provider.id}`}
                                    checked={provider.audit_enabled}
                                    onCheckedChange={(checked) =>
                                      void toggleAudit(provider.id, checked)
                                    }
                                    className="data-[state=checked]:bg-emerald-500"
                                  />
                                  <Label htmlFor={`audit-${provider.id}`} className="text-xs">
                                    Audit
                                  </Label>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    id={`bodies-${provider.id}`}
                                    checked={provider.audit_capture_bodies}
                                    onCheckedChange={(checked) =>
                                      void toggleBodies(provider.id, checked)
                                    }
                                    disabled={!provider.audit_enabled}
                                    className="data-[state=checked]:bg-emerald-500"
                                  />
                                  <Label htmlFor={`bodies-${provider.id}`} className="text-xs">
                                    Bodies
                                  </Label>
                                </div>
                              </div>
                          </div>
                          </div>
                          {provider.audit_enabled && provider.audit_capture_bodies && (
                            <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                              May capture prompts/outputs.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Ban className="h-4 w-4" />
                      Header Blocklist
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Strips headers before sending upstream.
                    </CardDescription>
                  </div>
                  <Button size="sm" variant="outline" onClick={openAddRuleDialog}>
                    <Plus className="mr-2 h-3.5 w-3.5" />
                    Add Rule
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Use header rules to block privacy, tunnel, and tracing metadata from provider requests.
                </p>

                {loadingRules ? (
                  <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">
                    Loading rules...
                  </div>
                ) : (
                  <>
                    <Collapsible open={systemRulesOpen} onOpenChange={setSystemRulesOpen}>
                      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-muted/50 transition-colors">
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 transition-transform",
                            systemRulesOpen && "rotate-90"
                          )}
                        />
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                        System rules (locked)
                        <span className="text-xs text-muted-foreground">({systemRules.length})</span>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        {systemRules.length === 0 ? (
                          <div className="mt-1.5 rounded-md border px-3 py-3 text-sm text-muted-foreground">
                            No system rules found.
                          </div>
                        ) : (
                          <div className="mt-1.5 rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[90px]">Enabled</TableHead>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Type</TableHead>
                                  <TableHead>Pattern</TableHead>
                                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {systemRules.map((rule) => (
                                  <TableRow key={rule.id}>
                                    <TableCell>
                                      <Switch checked={rule.enabled} disabled />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                      <div className="inline-flex items-center gap-2">
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
                                          disabled
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-destructive hover:text-destructive"
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
                        )}
                      </CollapsibleContent>
                    </Collapsible>

                    <Collapsible open={userRulesOpen} onOpenChange={setUserRulesOpen}>
                      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-muted/50 transition-colors">
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 transition-transform",
                            userRulesOpen && "rotate-90"
                          )}
                        />
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        Custom rules
                        <span className="text-xs text-muted-foreground">({customRules.length})</span>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        {customRules.length === 0 ? (
                          <div className="mt-1.5 rounded-md border px-3 py-3 text-sm text-muted-foreground">
                            No custom rules. Add one to strip private headers before forwarding.
                          </div>
                        ) : (
                          <div className="mt-1.5 rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[90px]">Enabled</TableHead>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Type</TableHead>
                                  <TableHead>Pattern</TableHead>
                                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {customRules.map((rule) => (
                                  <TableRow key={rule.id}>
                                    <TableCell>
                                      <Switch
                                        checked={rule.enabled}
                                        onCheckedChange={(checked) =>
                                          void handleToggleRule(rule, checked)
                                        }
                                        className="data-[state=checked]:bg-emerald-500"
                                      />
                                    </TableCell>
                                    <TableCell className="font-medium">{rule.name}</TableCell>
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
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  </>
                )}
              </CardContent>
            </Card>
          </section>

          <section id="retention-deletion" tabIndex={-1} className="scroll-mt-24">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Trash2 className="h-4 w-4" />
                  Retention & Deletion
                </CardTitle>
                <CardDescription className="text-xs">
                  Delete historical logs in {selectedProfileLabel} with explicit retention and confirmation controls.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Log type</Label>
                    <Select
                      value={cleanupType}
                      onValueChange={(value) =>
                        setCleanupType(value as "requests" | "audits")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select log type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="requests">Request Logs</SelectItem>
                        <SelectItem value="audits">Audit Logs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Delete logs older than</Label>
                    <Select
                      value={retentionPreset}
                      onValueChange={(value) =>
                        setRetentionPreset(value as "7" | "30" | "90" | "all")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select retention" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="all" className="text-destructive">
                          All logs
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="destructive"
                      className="w-full"
                      disabled={deleting || !cleanupType || !retentionPreset}
                      onClick={handleOpenDeleteConfirm}
                    >
                      Delete logs
                    </Button>
                  </div>
                </div>

                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  This deletes data in {selectedProfileLabel} and cannot be undone.
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Import</DialogTitle>
            <DialogDescription>
              Restore configuration for {selectedProfileLabel} from this backup file.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive">
              This affects {selectedProfileLabel} and its runtime traffic.
            </div>

            <div>
              <p className="font-medium">Backup contents</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                <li>{importSummary.providersCount} providers</li>
                <li>{importSummary.endpointsCount} endpoints</li>
                <li>{importSummary.modelsCount} models</li>
                <li>{importSummary.connectionsCount} connections</li>
                <li>{importSummary.customRulesCount} custom blocklist rules</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleImport()}
              disabled={!parsedConfig || importing || !isImportPhraseValid}
            >
              {importing ? "Importing..." : "Restore Configuration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteConfirm)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteConfirm(null);
            setDeleteConfirmPhrase("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              This deletes data in {selectedProfileLabel} and cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <div className="rounded-md border px-3 py-3">
              <p className="font-medium">Deletion summary</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                <li>
                  Log type: {deleteConfirm?.type === "requests" ? "Request Logs" : "Audit Logs"}
                </li>
                <li>
                  Retention:{" "}
                  {deleteConfirm?.deleteAll
                    ? "All logs"
                    : `Older than ${deleteConfirm?.days} days`}
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delete-confirm-phrase">Type DELETE to proceed</Label>
              <Input
                id="delete-confirm-phrase"
                value={deleteConfirmPhrase}
                onChange={(event) => setDeleteConfirmPhrase(event.target.value)}
                placeholder="DELETE"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirm(null);
                setDeleteConfirmPhrase("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleBatchDelete()}
              disabled={deleting || !isDeletePhraseValid}
            >
              {deleting ? "Deleting..." : "Delete"}
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
                ? "Modify an existing custom header blocklist rule."
                : "Create a custom rule to block headers before requests are sent upstream."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" aria-label="Why block headers" className="mt-0.5">
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    Blocklist rules prevent privacy, tunnel, and tracing metadata from reaching
                    upstream providers.
                  </TooltipContent>
                </Tooltip>

                <div className="space-y-1">
                  <p>
                    Examples: <code className="rounded bg-background px-1">cf-</code> (prefix),{" "}
                    <code className="rounded bg-background px-1">x-forwarded-for</code> (exact).
                  </p>
                  <p>Use this to strip sensitive headers before forwarding runtime traffic.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rule-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="rule-name"
                  value={ruleForm.name}
                  onChange={(event) =>
                    setRuleForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  className="col-span-3"
                  placeholder="e.g. Remove Tunnel Headers"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rule-type" className="text-right">
                  Type
                </Label>
                <Select
                  value={ruleForm.match_type}
                  onValueChange={(value) =>
                    setRuleForm((prev) => ({
                      ...prev,
                      match_type: value as "exact" | "prefix",
                    }))
                  }
                >
                  <SelectTrigger className="col-span-3" id="rule-type">
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
                    onChange={(event) =>
                      setRuleForm((prev) => ({ ...prev, pattern: event.target.value }))
                    }
                    className="font-mono"
                    placeholder={
                      ruleForm.match_type === "prefix" ? "cf-" : "x-request-id"
                    }
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
                onCheckedChange={(checked) =>
                  setRuleForm((prev) => ({ ...prev, enabled: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSaveRule()}>Save Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteRuleConfirm)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteRuleConfirm(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Rule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the rule "{deleteRuleConfirm?.name}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRuleConfirm(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleDeleteRule()}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
