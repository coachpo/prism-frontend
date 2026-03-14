import { useCallback, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type {
  Connection,
  Endpoint,
  ModelConfig,
  ModelConfigListItem,
  PricingTemplate,
  SpendingSummary,
} from "@/lib/types";

interface UseModelDetailBootstrapInput {
  id: string | undefined;
  revision: number;
  navigate: (to: string) => void;
  setModel: Dispatch<SetStateAction<ModelConfig | null>>;
  setConnections: Dispatch<SetStateAction<Connection[]>>;
  setGlobalEndpoints: Dispatch<SetStateAction<Endpoint[]>>;
  setAllModels: Dispatch<SetStateAction<ModelConfigListItem[]>>;
  setPricingTemplates: Dispatch<SetStateAction<PricingTemplate[]>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setSpending: Dispatch<SetStateAction<SpendingSummary | null>>;
  setSpendingLoading: Dispatch<SetStateAction<boolean>>;
  setSpendingCurrencySymbol: Dispatch<SetStateAction<string>>;
  setSpendingCurrencyCode: Dispatch<SetStateAction<string>>;
}

export function useModelDetailBootstrap({
  id,
  revision,
  navigate,
  setModel,
  setConnections,
  setGlobalEndpoints,
  setAllModels,
  setPricingTemplates,
  setLoading,
  setSpending,
  setSpendingLoading,
  setSpendingCurrencySymbol,
  setSpendingCurrencyCode,
}: UseModelDetailBootstrapInput) {
  const fetchSpending = useCallback(
    async (modelId: string) => {
      setSpendingLoading(true);
      try {
        const data = await api.stats.spending({
          model_id: modelId,
          group_by: "endpoint",
          preset: "all",
        });
        setSpending(data.summary);
        setSpendingCurrencySymbol(data.report_currency_symbol);
        setSpendingCurrencyCode(data.report_currency_code);
      } catch (error) {
        console.error("Failed to fetch spending", error);
      } finally {
        setSpendingLoading(false);
      }
    },
    [setSpending, setSpendingCurrencyCode, setSpendingCurrencySymbol, setSpendingLoading]
  );

  const fetchModel = useCallback(async () => {
    if (!id) return;

    try {
      const [data, endpointsList, modelsList, pricingTemplatesList] = await Promise.all([
        api.models.get(Number.parseInt(id, 10)),
        api.endpoints.list(),
        api.models.list(),
        api.pricingTemplates.list(),
      ]);

      setModel(data);
      setConnections(data.connections || []);
      setGlobalEndpoints(endpointsList);
      setAllModels(modelsList);
      setPricingTemplates(pricingTemplatesList);

      void fetchSpending(data.model_id);
    } catch (error) {
      toast.error("Failed to fetch model details");
      console.error(error);
      navigate("/models");
    } finally {
      setLoading(false);
    }
  }, [
    fetchSpending,
    id,
    navigate,
    setAllModels,
    setConnections,
    setGlobalEndpoints,
    setLoading,
    setModel,
    setPricingTemplates,
  ]);

  useEffect(() => {
    void fetchModel();
  }, [fetchModel, revision]);

  return { fetchModel };
}
