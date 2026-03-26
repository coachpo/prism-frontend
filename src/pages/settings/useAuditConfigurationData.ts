import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { getSharedVendors, setSharedVendors } from "@/lib/referenceData";
import type {
  HeaderBlocklistRule,
  HeaderBlocklistRuleCreate,
  Vendor,
} from "@/lib/types";
import { toast } from "sonner";

interface UseAuditConfigurationDataInput {
  revision: number;
}

const DEFAULT_RULE_FORM: HeaderBlocklistRuleCreate = {
  name: "",
  match_type: "exact",
  pattern: "",
  enabled: true,
};

export function useAuditConfigurationData({ revision }: UseAuditConfigurationDataInput) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [blocklistRules, setBlocklistRules] = useState<HeaderBlocklistRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<HeaderBlocklistRule | null>(null);
  const [ruleForm, setRuleForm] = useState<HeaderBlocklistRuleCreate>(DEFAULT_RULE_FORM);
  const [deleteRuleConfirm, setDeleteRuleConfirm] = useState<HeaderBlocklistRule | null>(null);
  const [systemRulesOpen, setSystemRulesOpen] = useState(false);
  const [userRulesOpen, setUserRulesOpen] = useState(true);
  const vendorsRequestIdRef = useRef(0);
  const rulesRequestIdRef = useRef(0);

  const fetchVendors = useCallback(async () => {
    const requestId = ++vendorsRequestIdRef.current;
    try {
      const data = await getSharedVendors(revision);
      if (requestId !== vendorsRequestIdRef.current) {
        return;
      }
      setVendors(data);
    } catch {
      if (requestId !== vendorsRequestIdRef.current) {
        return;
      }
      toast.error("Failed to load vendors");
    }
  }, [revision]);

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

  const fetchRules = useCallback(async () => {
    const requestId = ++rulesRequestIdRef.current;
    setLoadingRules(true);
    try {
      const rules = await api.config.headerBlocklistRules.list(true);
       if (requestId !== rulesRequestIdRef.current) {
        return;
      }
      setBlocklistRules(rules);
    } catch {
      if (requestId !== rulesRequestIdRef.current) {
        return;
      }
      toast.error("Failed to load header blocklist rules");
    } finally {
      if (requestId === rulesRequestIdRef.current) {
        setLoadingRules(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchVendors();
    void fetchRules();
  }, [fetchVendors, fetchRules]);

  const systemRules = useMemo(() => blocklistRules.filter((rule) => rule.is_system), [blocklistRules]);
  const customRules = useMemo(() => blocklistRules.filter((rule) => !rule.is_system), [blocklistRules]);

  const toggleAudit = async (vendorId: number, checked: boolean) => {
    commitVendors((prev) =>
      prev.map((vendor) =>
        vendor.id === vendorId ? { ...vendor, audit_enabled: checked } : vendor
      )
    );

    try {
      await api.vendors.update(vendorId, { audit_enabled: checked });
    } catch {
      commitVendors((prev) =>
        prev.map((vendor) =>
          vendor.id === vendorId ? { ...vendor, audit_enabled: !checked } : vendor
        )
      );
      toast.error("Failed to update vendor");
    }
  };

  const toggleBodies = async (vendorId: number, checked: boolean) => {
    commitVendors((prev) =>
      prev.map((vendor) =>
        vendor.id === vendorId ? { ...vendor, audit_capture_bodies: checked } : vendor
      )
    );

    try {
      await api.vendors.update(vendorId, { audit_capture_bodies: checked });
    } catch {
      commitVendors((prev) =>
        prev.map((vendor) =>
          vendor.id === vendorId ? { ...vendor, audit_capture_bodies: !checked } : vendor
        )
      );
      toast.error("Failed to update vendor");
    }
  };

  const handleToggleRule = async (rule: HeaderBlocklistRule, checked: boolean) => {
    setBlocklistRules((prev) => prev.map((row) => (row.id === rule.id ? { ...row, enabled: checked } : row)));

    try {
      await api.config.headerBlocklistRules.update(rule.id, { enabled: checked });
    } catch {
      setBlocklistRules((prev) => prev.map((row) => (row.id === rule.id ? { ...row, enabled: !checked } : row)));
      toast.error("Failed to update rule");
    }
  };

  const openAddRuleDialog = () => {
    setEditingRule(null);
    setRuleForm(DEFAULT_RULE_FORM);
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
        const updatedRule = await api.config.headerBlocklistRules.update(editingRule.id, ruleForm);
        setBlocklistRules((prev) => prev.map((rule) => (rule.id === updatedRule.id ? updatedRule : rule)));
        toast.success("Rule updated successfully");
      } else {
        const createdRule = await api.config.headerBlocklistRules.create(ruleForm);
        setBlocklistRules((prev) => [...prev, createdRule]);
        toast.success("Rule created successfully");
      }
      setEditingRule(null);
      setRuleForm(DEFAULT_RULE_FORM);
      setRuleDialogOpen(false);
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
      setBlocklistRules((prev) => prev.filter((rule) => rule.id !== deleteRuleConfirm.id));
      toast.success("Rule deleted successfully");
      setDeleteRuleConfirm(null);
    } catch {
      toast.error("Failed to delete rule");
    }
  };

  return {
    customRules,
    deleteRuleConfirm,
    editingRule,
    handleDeleteRule,
    handleSaveRule,
    handleToggleRule,
    loadingRules,
    openAddRuleDialog,
    openEditRuleDialog,
    vendors,
    ruleDialogOpen,
    ruleForm,
    setDeleteRuleConfirm,
    setRuleDialogOpen,
    setRuleForm,
    setSystemRulesOpen,
    setUserRulesOpen,
    systemRules,
    systemRulesOpen,
    toggleAudit,
    toggleBodies,
    userRulesOpen,
  };
}
