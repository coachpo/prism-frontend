import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/context/useAuth";
import { useProfileContext } from "@/context/ProfileContext";
import { api } from "@/lib/api";
import { isValidCurrencyCode } from "@/lib/costing";
import type {
  AuthSettings,
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import { BackupSection } from "./settings/sections/BackupSection";
import { BillingCurrencySection } from "./settings/sections/BillingCurrencySection";
import { TimezoneSection } from "./settings/sections/TimezoneSection";
import { AuditConfigurationSection } from "./settings/sections/AuditConfigurationSection";
import { AuthenticationSection } from "./settings/sections/AuthenticationSection";
import { RetentionDeletionSection } from "./settings/sections/RetentionDeletionSection";
import { DeleteConfirmDialog } from "./settings/dialogs/DeleteConfirmDialog";
import { RuleDialog } from "./settings/dialogs/RuleDialog";
import { DeleteRuleConfirmDialog } from "./settings/dialogs/DeleteRuleConfirmDialog";
import { SettingsSectionsNav } from "./settings/SettingsSectionsNav";
import { renderSectionSaveState } from "./settings/sectionSaveState";
import { useSettingsSectionNavigation } from "./settings/useSettingsSectionNavigation";
import type { SettingsSaveSection } from "./settings/settingsSaveTypes";
import {
  DELETE_CONFIRM_KEYWORD,
  DEFAULT_COSTING_FORM,
  normalizeCostingForm,
  normalizeMappings,
  areMappingsEqual,
  validateFxRate,
  validateMappings,
  getConnectionName,
  getMappingKey,
  formatTimezonePreview,
} from "./settings/settingsPageHelpers";


export function SettingsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshAuth } = useAuth();
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
  const { activeSectionId, setActiveSectionId, isAuditConfigurationFocused } =
    useSettingsSectionNavigation(location);

  const [providers, setProviders] = useState<Provider[]>([]);
  const [bulkAuditSaving, setBulkAuditSaving] = useState(false);
  const [authSettings, setAuthSettings] = useState<AuthSettings | null>(null);
  const [authEnabledInput, setAuthEnabledInput] = useState(false);
  const [authUsername, setAuthUsername] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authPasswordConfirm, setAuthPasswordConfirm] = useState("");
  const [authSaving, setAuthSaving] = useState(false);
  const [emailVerificationOtp, setEmailVerificationOtp] = useState("");
  const [sendingEmailVerification, setSendingEmailVerification] = useState(false);
  const [confirmingEmailVerification, setConfirmingEmailVerification] = useState(false);

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
  const [recentlySavedSection, setRecentlySavedSection] = useState<SettingsSaveSection | null>(null);
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
    void fetchAuthSettings();
  }, [revision]);

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

  const renderSaveStateForSection = (section: SettingsSaveSection, isDirty: boolean) =>
    renderSectionSaveState({
      section,
      isDirty,
      recentlySavedSection,
    });

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

  const fetchAuthSettings = async () => {
    try {
      const data = await api.settings.auth.get();
      setAuthSettings(data);
      setAuthEnabledInput(data.auth_enabled);
      setAuthUsername(data.username ?? "");
      setAuthEmail(data.pending_email ?? data.email ?? "");
      setAuthPassword("");
      setAuthPasswordConfirm("");
      setEmailVerificationOtp("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load authentication settings");
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


  const handleSaveCostingSettings = async (section: SettingsSaveSection) => {
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

  const handleSaveAuthSettings = async (nextEnabled?: boolean) => {
    if (authPassword && authPassword !== authPasswordConfirm) {
      toast.error("Passwords do not match");
      return;
    }
    const targetEnabled = nextEnabled ?? authEnabledInput;
    const wasEnabled = authSettings?.auth_enabled ?? false;
    setAuthEnabledInput(targetEnabled);
    setAuthSaving(true);
    try {
      const saved = await api.settings.auth.update({
        auth_enabled: targetEnabled,
        username: authUsername.trim() || null,
        password: authPassword || null,
      });
      setAuthSettings(saved);
      setAuthEnabledInput(saved.auth_enabled);
      setAuthUsername(saved.username ?? "");
      setAuthEmail(saved.pending_email ?? saved.email ?? "");
      setAuthPassword("");
      setAuthPasswordConfirm("");
      try {
        await refreshAuth();
      } catch {
        // Keep the saved form state even if the follow-up session check fails transiently.
      }
      if (!wasEnabled && saved.auth_enabled) {
        toast.success("Authentication enabled. Sign in to continue.");
        navigate("/login", { replace: true });
        return;
      }
      toast.success("Authentication settings saved");
    } catch (error) {
      setAuthEnabledInput(authSettings?.auth_enabled ?? false);
      toast.error(error instanceof Error ? error.message : "Failed to save authentication settings");
    } finally {
      setAuthSaving(false);
    }
  };

  const handleRequestEmailVerification = async () => {
    if (!authEmail.trim()) {
      toast.error("Email is required");
      return;
    }
    setSendingEmailVerification(true);
    try {
      const result = await api.settings.auth.requestEmailVerification({
        email: authEmail.trim(),
      });
      setAuthSettings((prev) =>
        prev
          ? {
              ...prev,
              email: result.email,
              email_bound_at: result.email_bound_at,
              pending_email: result.pending_email,
              email_verification_required: Boolean(result.pending_email),
            }
          : prev
      );
      toast.success("Verification code sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send verification code");
    } finally {
      setSendingEmailVerification(false);
    }
  };

  const handleConfirmEmailVerification = async () => {
    if (!emailVerificationOtp.trim()) {
      toast.error("Verification code is required");
      return;
    }
    setConfirmingEmailVerification(true);
    try {
      const result = await api.settings.auth.confirmEmailVerification({
        otp_code: emailVerificationOtp.trim(),
      });
      setAuthSettings((prev) =>
        prev
          ? {
              ...prev,
              email: result.email,
              email_bound_at: result.email_bound_at,
              pending_email: result.pending_email,
              email_verification_required: Boolean(result.pending_email),
            }
          : prev
      );
      setAuthEmail(result.email ?? authEmail);
      setEmailVerificationOtp("");
      toast.success("Email verified");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to verify email");
    } finally {
      setConfirmingEmailVerification(false);
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
      toast.error("Acknowledge that endpoint API keys are omitted before exporting.");
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
          <SettingsSectionsNav
            activeSectionId={activeSectionId}
            onJumpToSection={handleJumpToSection}
          />
        </aside>

        <div className="space-y-6">
          <BackupSection
            selectedProfileLabel={selectedProfileLabel}
            exportSecretsAcknowledged={exportSecretsAcknowledged}
            setExportSecretsAcknowledged={setExportSecretsAcknowledged}
            exporting={exporting}
            handleExport={handleExport}
            fileInputRef={fileInputRef}
            handleFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            parsedConfig={parsedConfig}
            importSummary={importSummary}
            importing={importing}
            handleImport={handleImport}
          />

          <AuthenticationSection
            authSettings={authSettings}
            authEnabled={authEnabledInput}
            username={authUsername}
            setUsername={setAuthUsername}
            email={authEmail}
            setEmail={setAuthEmail}
            password={authPassword}
            setPassword={setAuthPassword}
            passwordConfirm={authPasswordConfirm}
            setPasswordConfirm={setAuthPasswordConfirm}
            emailVerificationOtp={emailVerificationOtp}
            setEmailVerificationOtp={setEmailVerificationOtp}
            sendingEmailVerification={sendingEmailVerification}
            confirmingEmailVerification={confirmingEmailVerification}
            onRequestEmailVerification={handleRequestEmailVerification}
            onConfirmEmailVerification={handleConfirmEmailVerification}
            authSaving={authSaving}
            onSaveAuthSettings={handleSaveAuthSettings}
          />

          <BillingCurrencySection
            billingDirty={billingDirty}
            renderSectionSaveState={renderSaveStateForSection}
            handleSaveCostingSettings={handleSaveCostingSettings}
            costingUnavailable={costingUnavailable}
            costingLoading={costingLoading}
            costingSaving={costingSaving}
            costingForm={costingForm}
            setCostingForm={setCostingForm}
            normalizedCurrentCosting={normalizedCurrentCosting}
            nativeModels={nativeModels}
            modelLabelMap={modelLabelMap}
            mappingConnections={mappingConnections}
            mappingLoading={mappingLoading}
            mappingModelId={mappingModelId}
            setMappingModelId={setMappingModelId}
            loadMappingConnections={loadMappingConnections}
            mappingEndpointId={mappingEndpointId}
            setMappingEndpointId={setMappingEndpointId}
            mappingEndpointOptions={mappingEndpointOptions}
            mappingFxRate={mappingFxRate}
            setMappingFxRate={setMappingFxRate}
            addMappingFxError={addMappingFxError}
            handleAddFxMapping={handleAddFxMapping}
            editingMappingKey={editingMappingKey}
            editingMappingFxRate={editingMappingFxRate}
            setEditingMappingFxRate={setEditingMappingFxRate}
            editMappingFxError={editMappingFxError}
            handleSaveEditFxMapping={handleSaveEditFxMapping}
            handleCancelEditFxMapping={handleCancelEditFxMapping}
            handleStartEditFxMapping={handleStartEditFxMapping}
            handleDeleteFxMapping={handleDeleteFxMapping}
          />

          <TimezoneSection
            timezoneDirty={timezoneDirty}
            renderSectionSaveState={renderSaveStateForSection}
            handleSaveCostingSettings={handleSaveCostingSettings}
            costingUnavailable={costingUnavailable}
            costingLoading={costingLoading}
            costingSaving={costingSaving}
            costingForm={costingForm}
            setCostingForm={setCostingForm}
            timezonePreviewText={timezonePreviewText}
            timezonePreviewZone={timezonePreviewZone}
          />

          <AuditConfigurationSection
            auditConfigurationRef={auditConfigurationRef}
            isAuditConfigurationFocused={isAuditConfigurationFocused}
            providers={providers}
            bulkAuditSaving={bulkAuditSaving}
            applyAuditBulkUpdate={applyAuditBulkUpdate}
            toggleAudit={toggleAudit}
            toggleBodies={toggleBodies}
            loadingRules={loadingRules}
            systemRulesOpen={systemRulesOpen}
            setSystemRulesOpen={setSystemRulesOpen}
            systemRules={systemRules}
            userRulesOpen={userRulesOpen}
            setUserRulesOpen={setUserRulesOpen}
            customRules={customRules}
            handleToggleRule={handleToggleRule}
            openAddRuleDialog={openAddRuleDialog}
            openEditRuleDialog={openEditRuleDialog}
            setDeleteRuleConfirm={setDeleteRuleConfirm}
          />

          <RetentionDeletionSection
            selectedProfileLabel={selectedProfileLabel}
            cleanupType={cleanupType}
            setCleanupType={setCleanupType}
            retentionPreset={retentionPreset}
            setRetentionPreset={setRetentionPreset}
            deleting={deleting}
            handleOpenDeleteConfirm={handleOpenDeleteConfirm}
          />
        </div>
      </div>

      <DeleteConfirmDialog
        deleteConfirm={deleteConfirm}
        setDeleteConfirm={setDeleteConfirm}
        selectedProfileLabel={selectedProfileLabel}
        deleteConfirmPhrase={deleteConfirmPhrase}
        setDeleteConfirmPhrase={setDeleteConfirmPhrase}
        handleBatchDelete={handleBatchDelete}
        deleting={deleting}
        isDeletePhraseValid={isDeletePhraseValid}
      />

      <RuleDialog
        ruleDialogOpen={ruleDialogOpen}
        setRuleDialogOpen={setRuleDialogOpen}
        editingRule={editingRule}
        ruleForm={ruleForm}
        setRuleForm={setRuleForm}
        handleSaveRule={handleSaveRule}
      />

      <DeleteRuleConfirmDialog
        deleteRuleConfirm={deleteRuleConfirm}
        setDeleteRuleConfirm={setDeleteRuleConfirm}
        handleDeleteRule={handleDeleteRule}
      />
    </div>
  );
}
