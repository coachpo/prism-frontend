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
import { api, ApiError } from "@/lib/api";
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
  PricingTemplate,
  PricingTemplateConnectionUsageItem,
  PricingTemplateCreate,
  PricingTemplateUpdate,
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
  { id: "pricing-templates", label: "Pricing Templates" },
  { id: "billing-currency", label: "Billing & Currency" },
  { id: "timezone", label: "Timezone" },
  { id: "audit-configuration", label: "Audit & Privacy" },
  { id: "retention-deletion", label: "Retention & Deletion" },
] as const;
const SETTINGS_SECTION_IDS = new Set<string>(SETTINGS_SECTIONS.map((section) => section.id));

const DELETE_CONFIRM_KEYWORD = "DELETE";
const FX_RATE_MAX_DECIMALS = 6;
const TIMEZONE_PREVIEW_SOURCE = new Date("2026-02-27T21:39:00Z");

const DEFAULT_COSTING_FORM: CostingSettingsUpdate = {
  report_currency_code: "USD",
  report_currency_symbol: "$",
  timezone_preference: null,
  endpoint_fx_mappings: [],
};

type PricingTemplateFormState = {
  name: string;
  description: string;
  pricing_currency_code: string;
  input_price: string;
  output_price: string;
  cached_input_price: string;
  cache_creation_price: string;
  reasoning_price: string;
  missing_special_token_price_policy: "MAP_TO_OUTPUT" | "ZERO_COST";
};

const DEFAULT_PRICING_TEMPLATE_FORM: PricingTemplateFormState = {
  name: "",
  description: "",
  pricing_currency_code: "USD",
  input_price: "",
  output_price: "",
  cached_input_price: "",
  cache_creation_price: "",
  reasoning_price: "",
  missing_special_token_price_policy: "MAP_TO_OUTPUT",
};

const normalizeOptionalTemplatePrice = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const isNonNegativeDecimalString = (value: string): boolean => {
  const trimmed = value.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return false;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0;
};

const parsePricingTemplateUsageRows = (
  detail: unknown
): PricingTemplateConnectionUsageItem[] => {
  if (!detail || typeof detail !== "object") {
    return [];
  }
  const payload = detail as { connections?: unknown; detail?: unknown };
  const maybeConnections =
    payload.connections ??
    (
      payload.detail &&
      typeof payload.detail === "object" &&
      "connections" in payload.detail
        ? (payload.detail as { connections?: unknown }).connections
        : undefined
    );
  if (!Array.isArray(maybeConnections)) {
    return [];
  }

  const rows: PricingTemplateConnectionUsageItem[] = [];
  for (const connection of maybeConnections) {
    if (!connection || typeof connection !== "object") {
      continue;
    }

    const entry = connection as Record<string, unknown>;
    const connectionId =
      typeof entry.connection_id === "number" ? entry.connection_id : null;
    const modelConfigId =
      typeof entry.model_config_id === "number" ? entry.model_config_id : null;
    const endpointId =
      typeof entry.endpoint_id === "number" ? entry.endpoint_id : null;
    if (connectionId === null || modelConfigId === null || endpointId === null) {
      continue;
    }

    const modelId =
      typeof entry.model_id === "string" && entry.model_id.trim().length > 0
        ? entry.model_id
        : "Unknown model";
    const endpointName =
      typeof entry.endpoint_name === "string" && entry.endpoint_name.trim().length > 0
        ? entry.endpoint_name
        : `Endpoint #${endpointId}`;

    rows.push({
      connection_id: connectionId,
      connection_name:
        typeof entry.connection_name === "string" ? entry.connection_name : null,
      model_config_id: modelConfigId,
      model_id: modelId,
      endpoint_id: endpointId,
      endpoint_name: endpointName,
    });
  }

  return rows;
};

const getConnectionName = (connection: Pick<Connection, "name">): string =>
  connection.name ?? "";

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

  const [pricingTemplates, setPricingTemplates] = useState<PricingTemplate[]>([]);
  const [pricingTemplatesLoading, setPricingTemplatesLoading] = useState(false);
  const [pricingTemplateDialogOpen, setPricingTemplateDialogOpen] = useState(false);
  const [editingPricingTemplate, setEditingPricingTemplate] = useState<PricingTemplate | null>(null);
  const [pricingTemplateForm, setPricingTemplateForm] = useState<PricingTemplateFormState>(DEFAULT_PRICING_TEMPLATE_FORM);
  const [pricingTemplateSaving, setPricingTemplateSaving] = useState(false);
  const [pricingTemplateUsageDialogOpen, setPricingTemplateUsageDialogOpen] = useState(false);
  const [pricingTemplateUsageRows, setPricingTemplateUsageRows] = useState<PricingTemplateConnectionUsageItem[]>([]);
  const [pricingTemplateUsageLoading, setPricingTemplateUsageLoading] = useState(false);
  const [pricingTemplateUsageTemplate, setPricingTemplateUsageTemplate] = useState<PricingTemplate | null>(null);
  const [deletePricingTemplateConfirm, setDeletePricingTemplateConfirm] = useState<PricingTemplate | null>(null);
  const [deletePricingTemplateConflict, setDeletePricingTemplateConflict] = useState<PricingTemplateConnectionUsageItem[] | null>(null);
  const [pricingTemplateDeleting, setPricingTemplateDeleting] = useState(false);

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
  const [activeSectionId, setActiveSectionId] = useState<string>(() => {
    const hashSection = location.hash.replace("#", "");
    return SETTINGS_SECTION_IDS.has(hashSection) ? hashSection : SETTINGS_SECTIONS[0].id;
  });

  useEffect(() => {
    api.providers.list().then(setProviders).catch(() => toast.error("Failed to load providers"));
    void fetchRules();
    void fetchPricingTemplates();
    void fetchCostingSettings();
    void fetchModels();
  }, [revision]);

  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (!hash) {
      setIsAuditConfigurationFocused(false);
      return;
    }
    if (SETTINGS_SECTION_IDS.has(hash)) {
      setActiveSectionId(hash);
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
    const sections = SETTINGS_SECTIONS.map((section) => document.getElementById(section.id)).filter(
      (section): section is HTMLElement => section instanceof HTMLElement
    );
    if (sections.length === 0) {
      return;
    }

    const scrollContainerCandidate = sections[0]?.closest("main");
    const scrollContainer =
      scrollContainerCandidate instanceof HTMLElement ? scrollContainerCandidate : null;

    const markerOffset = 96;
    const updateActiveSection = () => {
      const markerTop = scrollContainer
        ? scrollContainer.getBoundingClientRect().top + markerOffset
        : markerOffset;

      let nextSectionId = sections[0]?.id ?? "";
      let smallestDistance = Number.POSITIVE_INFINITY;

      for (const section of sections) {
        const distance = Math.abs(section.getBoundingClientRect().top - markerTop);
        if (distance < smallestDistance) {
          smallestDistance = distance;
          nextSectionId = section.id;
        }
      }

      const nearBottom = scrollContainer
        ? scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 4
        : window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (nearBottom) {
        nextSectionId = sections[sections.length - 1].id;
      }

      setActiveSectionId((current) => (current === nextSectionId ? current : nextSectionId));
    };

    updateActiveSection();
    const scrollTarget: EventTarget = scrollContainer ?? window;
    scrollTarget.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      scrollTarget.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, []);

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

  const fetchPricingTemplates = async () => {
    setPricingTemplatesLoading(true);
    try {
      const data = await api.pricingTemplates.list();
      setPricingTemplates(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load pricing templates");
    } finally {
      setPricingTemplatesLoading(false);
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
    const endpointsCount = parsedConfig?.endpoints?.length ?? 0;
    const modelsCount = parsedConfig?.models?.length ?? 0;
    const connectionsCount =
      parsedConfig?.models?.reduce((total, model) => total + (model.connections?.length ?? 0), 0) ??
      0;
    return {
      endpointsCount,
      modelsCount,
      connectionsCount,
    };
  }, [parsedConfig]);

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

    setActiveSectionId(sectionId);
    window.history.replaceState(null, "", `#${sectionId}`);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
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

  const handleEditPricingTemplate = (template: PricingTemplate) => {
    setEditingPricingTemplate(template);
    setPricingTemplateForm({
      name: template.name,
      description: template.description ?? "",
      pricing_currency_code: template.pricing_currency_code,
      input_price: template.input_price,
      output_price: template.output_price,
      cached_input_price: template.cached_input_price ?? "",
      cache_creation_price: template.cache_creation_price ?? "",
      reasoning_price: template.reasoning_price ?? "",
      missing_special_token_price_policy: template.missing_special_token_price_policy,
    });
    setPricingTemplateDialogOpen(true);
  };

  const handleSavePricingTemplate = async () => {
    if (!pricingTemplateForm.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!isValidCurrencyCode(pricingTemplateForm.pricing_currency_code)) {
      toast.error("Pricing currency must be a valid 3-letter code (for example, USD)");
      return;
    }
    if (!isNonNegativeDecimalString(pricingTemplateForm.input_price)) {
      toast.error("Input price must be a non-negative number");
      return;
    }
    if (!isNonNegativeDecimalString(pricingTemplateForm.output_price)) {
      toast.error("Output price must be a non-negative number");
      return;
    }

    const cachedInputPrice = normalizeOptionalTemplatePrice(pricingTemplateForm.cached_input_price);
    if (cachedInputPrice && !isNonNegativeDecimalString(cachedInputPrice)) {
      toast.error("Cached input price must be a non-negative number");
      return;
    }

    const cacheCreationPrice = normalizeOptionalTemplatePrice(pricingTemplateForm.cache_creation_price);
    if (cacheCreationPrice && !isNonNegativeDecimalString(cacheCreationPrice)) {
      toast.error("Cache creation price must be a non-negative number");
      return;
    }

    const reasoningPrice = normalizeOptionalTemplatePrice(pricingTemplateForm.reasoning_price);
    if (reasoningPrice && !isNonNegativeDecimalString(reasoningPrice)) {
      toast.error("Reasoning price must be a non-negative number");
      return;
    }

    setPricingTemplateSaving(true);
    try {
      if (editingPricingTemplate) {
        const payload: PricingTemplateUpdate = {
          name: pricingTemplateForm.name.trim(),
          description: pricingTemplateForm.description.trim() || null,
          pricing_currency_code: pricingTemplateForm.pricing_currency_code.trim().toUpperCase(),
          input_price: pricingTemplateForm.input_price.trim(),
          output_price: pricingTemplateForm.output_price.trim(),
          cached_input_price: cachedInputPrice,
          cache_creation_price: cacheCreationPrice,
          reasoning_price: reasoningPrice,
          missing_special_token_price_policy: pricingTemplateForm.missing_special_token_price_policy,
        };
        await api.pricingTemplates.update(editingPricingTemplate.id, payload);
        toast.success("Pricing template updated");
      } else {
        const payload: PricingTemplateCreate = {
          name: pricingTemplateForm.name.trim(),
          description: pricingTemplateForm.description.trim() || null,
          pricing_currency_code: pricingTemplateForm.pricing_currency_code.trim().toUpperCase(),
          input_price: pricingTemplateForm.input_price.trim(),
          output_price: pricingTemplateForm.output_price.trim(),
          cached_input_price: cachedInputPrice,
          cache_creation_price: cacheCreationPrice,
          reasoning_price: reasoningPrice,
          missing_special_token_price_policy: pricingTemplateForm.missing_special_token_price_policy,
        };
        await api.pricingTemplates.create(payload);
        toast.success("Pricing template created");
      }
      setPricingTemplateDialogOpen(false);
      void fetchPricingTemplates();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save pricing template");
    } finally {
      setPricingTemplateSaving(false);
    }
  };

  const handleViewPricingTemplateUsage = async (template: PricingTemplate) => {
    setPricingTemplateUsageTemplate(template);
    setPricingTemplateUsageDialogOpen(true);
    setPricingTemplateUsageLoading(true);
    try {
      const data = await api.pricingTemplates.connections(template.id);
      setPricingTemplateUsageRows(data.items);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load template usage");
      setPricingTemplateUsageRows([]);
    } finally {
      setPricingTemplateUsageLoading(false);
    }
  };

  const handleDeletePricingTemplateClick = async (template: PricingTemplate) => {
    setDeletePricingTemplateConfirm(template);
    setDeletePricingTemplateConflict(null);
    setPricingTemplateUsageLoading(true);
    try {
      const data = await api.pricingTemplates.connections(template.id);
      setPricingTemplateUsageRows(data.items);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load template usage");
      setPricingTemplateUsageRows([]);
    } finally {
      setPricingTemplateUsageLoading(false);
    }
  };

  const handleDeletePricingTemplate = async () => {
    if (!deletePricingTemplateConfirm) return;
    setPricingTemplateDeleting(true);
    try {
      await api.pricingTemplates.delete(deletePricingTemplateConfirm.id);
      toast.success("Pricing template deleted");
      setDeletePricingTemplateConfirm(null);
      void fetchPricingTemplates();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const conflictRows = parsePricingTemplateUsageRows(error.detail);
        setDeletePricingTemplateConflict(conflictRows);
        toast.error("Cannot delete template because it is in use");
      } else {
        toast.error(error instanceof Error ? error.message : "Failed to delete pricing template");
      }
    } finally {
      setPricingTemplateDeleting(false);
    }
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

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      const validation = ConfigImportSchema.safeParse(parsed);
      if (!validation.success) {
        const errors = validation.error.issues
          .map((issue: z.ZodIssue) => `${issue.path.join(".")}: ${issue.message}`)
          .join(", ");
        throw new Error(
          `Invalid configuration payload: ${errors}`
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
    if (!parsedConfig) {
      return;
    }

    setImporting(true);
    try {
      const result = await api.config.import(parsedConfig);
      toast.success(
        `Imported ${result.endpoints_imported} endpoints, ${result.models_imported} models, ${result.connections_imported} connections`
      );
      setSelectedFile(null);
      setParsedConfig(null);
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
                  variant={activeSectionId === section.id ? "secondary" : "ghost"}
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
                    Download models, endpoints, blocklist rules, and reporting settings.
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
                    Upload a version 2 JSON backup file and restore this profile's configuration.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                  />

                  {selectedFile && parsedConfig && (
                    <p className="text-sm text-muted-foreground">
                      Loaded {selectedFile.name}: {importSummary.endpointsCount} endpoints,{" "}
                      {importSummary.modelsCount} models, {importSummary.connectionsCount} connections.
                    </p>
                  )}

                  <Button
                    onClick={() => void handleImport()}
                    disabled={!parsedConfig || importing}
                    variant="destructive"
                    className="w-full"
                  >
                    {importing ? "Importing..." : "Import Configuration"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>

          <section id="pricing-templates" tabIndex={-1} className="scroll-mt-24">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Coins className="h-4 w-4" />
                      Pricing Templates
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Manage reusable pricing templates for models and endpoints.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setEditingPricingTemplate(null);
                        setPricingTemplateForm(DEFAULT_PRICING_TEMPLATE_FORM);
                        setPricingTemplateDialogOpen(true);
                      }}
                    >
                      <Plus className="mr-2 h-3.5 w-3.5" />
                      Add Template
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {pricingTemplatesLoading ? (
                  <div className="space-y-2">
                    <div className="h-9 animate-pulse rounded bg-muted" />
                    <div className="h-9 animate-pulse rounded bg-muted" />
                    <div className="h-24 animate-pulse rounded bg-muted" />
                  </div>
                ) : pricingTemplates.length === 0 ? (
                  <div className="rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">
                    No pricing templates configured.
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Currency</TableHead>
                          <TableHead>Version</TableHead>
                          <TableHead>Updated</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pricingTemplates.map((template) => (
                          <TableRow key={template.id}>
                            <TableCell className="font-medium">
                              <div className="flex flex-col">
                                <span>{template.name}</span>
                                {template.description && (
                                  <span className="text-xs text-muted-foreground">
                                    {template.description}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{template.pricing_currency_code}</TableCell>
                            <TableCell>v{template.version}</TableCell>
                            <TableCell>
                              {new Date(template.updated_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleViewPricingTemplateUsage(template)}
                                  title="View Usage"
                                >
                                  <Info className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEditPricingTemplate(template)}
                                  title="Edit Template"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleDeletePricingTemplateClick(template)}
                                  title="Delete Template"
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
              </CardContent>
            </Card>
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
                      Audit & Privacy
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
                                Audit: {auditStatus} · Bodies: {bodiesStatus}
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

      <Dialog open={pricingTemplateDialogOpen} onOpenChange={setPricingTemplateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPricingTemplate ? "Edit Pricing Template" : "Add Pricing Template"}</DialogTitle>
            <DialogDescription>
              Configure token prices to be reused across multiple endpoints.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="template-name" className="text-right">Name</Label>
              <Input
                id="template-name"
                value={pricingTemplateForm.name}
                onChange={(e) => setPricingTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-3"
                placeholder="e.g. GPT-4o Standard"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="template-desc" className="text-right">Description</Label>
              <Input
                id="template-desc"
                value={pricingTemplateForm.description}
                onChange={(e) => setPricingTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-3"
                placeholder="Optional description"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="template-currency" className="text-right">Currency</Label>
              <Input
                id="template-currency"
                value={pricingTemplateForm.pricing_currency_code}
                onChange={(e) => setPricingTemplateForm(prev => ({ ...prev, pricing_currency_code: e.target.value.toUpperCase() }))}
                className="col-span-3"
                maxLength={3}
                placeholder="USD"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="template-input" className="text-right">Input Price</Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="template-input"
                  value={pricingTemplateForm.input_price}
                  onChange={(e) => setPricingTemplateForm(prev => ({ ...prev, input_price: e.target.value }))}
                  placeholder="0.00"
                  inputMode="decimal"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">per 1M tokens</span>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="template-output" className="text-right">Output Price</Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="template-output"
                  value={pricingTemplateForm.output_price}
                  onChange={(e) => setPricingTemplateForm(prev => ({ ...prev, output_price: e.target.value }))}
                  placeholder="0.00"
                  inputMode="decimal"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">per 1M tokens</span>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="template-cached" className="text-right">Cached Input Price</Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="template-cached"
                  value={pricingTemplateForm.cached_input_price}
                  onChange={(e) => setPricingTemplateForm(prev => ({ ...prev, cached_input_price: e.target.value }))}
                  placeholder="Optional"
                  inputMode="decimal"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">per 1M tokens</span>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="template-cache-creation" className="text-right">Cache Creation Price</Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="template-cache-creation"
                  value={pricingTemplateForm.cache_creation_price}
                  onChange={(e) => setPricingTemplateForm(prev => ({ ...prev, cache_creation_price: e.target.value }))}
                  placeholder="Optional"
                  inputMode="decimal"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">per 1M tokens</span>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="template-reasoning" className="text-right">Reasoning Price</Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="template-reasoning"
                  value={pricingTemplateForm.reasoning_price}
                  onChange={(e) => setPricingTemplateForm(prev => ({ ...prev, reasoning_price: e.target.value }))}
                  placeholder="Optional"
                  inputMode="decimal"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">per 1M tokens</span>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="template-policy" className="text-right">Missing Special Token Policy</Label>
              <Select
                value={pricingTemplateForm.missing_special_token_price_policy}
                onValueChange={(value: "MAP_TO_OUTPUT" | "ZERO_COST") => setPricingTemplateForm(prev => ({ ...prev, missing_special_token_price_policy: value }))}
              >
                <SelectTrigger className="col-span-3" id="template-policy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAP_TO_OUTPUT">Map to Output Price</SelectItem>
                  <SelectItem value="ZERO_COST">Zero Cost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPricingTemplateDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => void handleSavePricingTemplate()} disabled={pricingTemplateSaving}>
              {pricingTemplateSaving ? "Saving..." : "Save Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pricingTemplateUsageDialogOpen} onOpenChange={setPricingTemplateUsageDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Template Usage: {pricingTemplateUsageTemplate?.name}</DialogTitle>
            <DialogDescription>
              Connections currently using this pricing template.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {pricingTemplateUsageLoading ? (
              <div className="flex justify-center py-8 text-sm text-muted-foreground">Loading usage...</div>
            ) : pricingTemplateUsageRows.length === 0 ? (
              <div className="rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground text-center">
                This template is not currently used by any connections.
              </div>
            ) : (
              <div className="rounded-md border max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Connection</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Endpoint</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pricingTemplateUsageRows.map((row) => (
                      <TableRow key={row.connection_id}>
                        <TableCell className="font-medium">
                          {row.connection_name || `Connection #${row.connection_id}`}
                        </TableCell>
                        <TableCell>{row.model_id}</TableCell>
                        <TableCell>{row.endpoint_name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setPricingTemplateUsageDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deletePricingTemplateConfirm)} onOpenChange={(open) => { if (!open) { setDeletePricingTemplateConfirm(null); setDeletePricingTemplateConflict(null); } }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Delete Pricing Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the template "{deletePricingTemplateConfirm?.name}"?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {deletePricingTemplateConflict ? (
              <div className="space-y-3">
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  Cannot delete this template because it is currently used by the following connections. Please update these connections to use a different template or custom pricing first.
                </div>
                <div className="rounded-md border max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Connection</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Endpoint</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deletePricingTemplateConflict.map((row) => (
                        <TableRow key={row.connection_id}>
                          <TableCell className="font-medium">
                            {row.connection_name || `Connection #${row.connection_id}`}
                          </TableCell>
                          <TableCell>{row.model_id}</TableCell>
                          <TableCell>{row.endpoint_name}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : pricingTemplateUsageLoading ? (
              <div className="flex justify-center py-4 text-sm text-muted-foreground">Checking usage...</div>
            ) : pricingTemplateUsageRows.length > 0 ? (
              <div className="space-y-3">
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  Warning: This template is currently used by {pricingTemplateUsageRows.length} connection(s). Deleting it will fail unless you update them first.
                </div>
                <div className="rounded-md border max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Connection</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Endpoint</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pricingTemplateUsageRows.map((row) => (
                        <TableRow key={row.connection_id}>
                          <TableCell className="font-medium">
                            {row.connection_name || `Connection #${row.connection_id}`}
                          </TableCell>
                          <TableCell>{row.model_id}</TableCell>
                          <TableCell>{row.endpoint_name}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <p className="text-sm">This template is not currently in use and can be safely deleted.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeletePricingTemplateConfirm(null); setDeletePricingTemplateConflict(null); }}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => void handleDeletePricingTemplate()}
              disabled={pricingTemplateDeleting || pricingTemplateUsageLoading || Boolean(deletePricingTemplateConflict)}
            >
              {pricingTemplateDeleting ? "Deleting..." : "Delete"}
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
