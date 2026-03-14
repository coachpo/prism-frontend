import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { CostingSettingsUpdate, ModelConfigListItem } from "@/lib/types";
import { toast } from "sonner";
import { DEFAULT_COSTING_FORM, normalizeCostingForm } from "../settingsPageHelpers";

export function useCostingSettingsBootstrap(revision: number) {
  const [costingUnavailable, setCostingUnavailable] = useState(false);
  const [costingLoading, setCostingLoading] = useState(false);
  const [savedCostingForm, setSavedCostingForm] = useState<CostingSettingsUpdate | null>(null);
  const [costingForm, setCostingForm] = useState<CostingSettingsUpdate>(DEFAULT_COSTING_FORM);
  const [models, setModels] = useState<ModelConfigListItem[]>([]);

  const fetchModels = useCallback(async () => {
    try {
      const data = await api.models.list();
      setModels(data);
    } catch {
      toast.error("Failed to load models for FX mapping");
    }
  }, []);

  const fetchCostingSettings = useCallback(async () => {
    setCostingLoading(true);
    try {
      const data = await api.settings.costing.get();
      const normalized = normalizeCostingForm(data);
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
  }, []);

  useEffect(() => {
    void fetchCostingSettings();
    void fetchModels();
  }, [fetchCostingSettings, fetchModels, revision]);

  return {
    costingForm,
    costingLoading,
    costingUnavailable,
    models,
    savedCostingForm,
    setCostingForm,
    setCostingUnavailable,
    setSavedCostingForm,
  };
}
