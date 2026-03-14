import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { isValidCurrencyCode } from "@/lib/costing";
import type {
  PricingTemplate,
  PricingTemplateConnectionUsageItem,
  PricingTemplateCreate,
  PricingTemplateUpdate,
} from "@/lib/types";
import { toast } from "sonner";
import {
  DEFAULT_PRICING_TEMPLATE_FORM,
  isNonNegativeDecimalString,
  normalizeOptionalTemplatePrice,
  parsePricingTemplateUsageRows,
  pricingTemplateFormStateFromTemplate,
  type PricingTemplateFormState,
} from "./pricingTemplateFormState";

export function usePricingTemplatesPageData(revision: number) {
  const [pricingTemplates, setPricingTemplates] = useState<PricingTemplate[]>([]);
  const [pricingTemplatesLoading, setPricingTemplatesLoading] = useState(false);
  const [pricingTemplateDialogOpen, setPricingTemplateDialogOpen] = useState(false);
  const [editingPricingTemplate, setEditingPricingTemplate] = useState<PricingTemplate | null>(null);
  const [pricingTemplatePreparingEditId, setPricingTemplatePreparingEditId] = useState<number | null>(null);
  const [pricingTemplateForm, setPricingTemplateForm] = useState<PricingTemplateFormState>(DEFAULT_PRICING_TEMPLATE_FORM);
  const [pricingTemplateSaving, setPricingTemplateSaving] = useState(false);
  const [pricingTemplateUsageDialogOpen, setPricingTemplateUsageDialogOpen] = useState(false);
  const [pricingTemplateUsageRows, setPricingTemplateUsageRows] = useState<PricingTemplateConnectionUsageItem[]>([]);
  const [pricingTemplateUsageLoading, setPricingTemplateUsageLoading] = useState(false);
  const [pricingTemplateUsageTemplate, setPricingTemplateUsageTemplate] = useState<PricingTemplate | null>(null);
  const [deletePricingTemplateConfirm, setDeletePricingTemplateConfirm] = useState<PricingTemplate | null>(null);
  const [deletePricingTemplateConflict, setDeletePricingTemplateConflict] = useState<PricingTemplateConnectionUsageItem[] | null>(null);
  const [pricingTemplateDeleting, setPricingTemplateDeleting] = useState(false);

  const fetchPricingTemplates = useCallback(async () => {
    setPricingTemplatesLoading(true);
    try {
      const data = await api.pricingTemplates.list();
      setPricingTemplates(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load pricing templates");
    } finally {
      setPricingTemplatesLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPricingTemplates();
  }, [fetchPricingTemplates, revision]);

  const closePricingTemplateDialog = () => {
    setPricingTemplateDialogOpen(false);
    setEditingPricingTemplate(null);
    setPricingTemplatePreparingEditId(null);
    setPricingTemplateForm(DEFAULT_PRICING_TEMPLATE_FORM);
  };

  const openCreatePricingTemplateDialog = () => {
    setEditingPricingTemplate(null);
    setPricingTemplatePreparingEditId(null);
    setPricingTemplateForm(DEFAULT_PRICING_TEMPLATE_FORM);
    setPricingTemplateDialogOpen(true);
  };

  const handleEditPricingTemplate = async (templateSummary: PricingTemplate) => {
    setPricingTemplatePreparingEditId(templateSummary.id);
    try {
      const template = await api.pricingTemplates.get(templateSummary.id);
      setEditingPricingTemplate(template);
      setPricingTemplateForm(pricingTemplateFormStateFromTemplate(template));
      setPricingTemplateDialogOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load pricing template");
    } finally {
      setPricingTemplatePreparingEditId(null);
    }
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
          expected_updated_at: editingPricingTemplate.updated_at,
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

      closePricingTemplateDialog();
      await fetchPricingTemplates();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        toast.error("This pricing template changed while you were editing it. Reopen the dialog and try again.");
        await fetchPricingTemplates();
        return;
      }
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
    if (!deletePricingTemplateConfirm) {
      return;
    }

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

  return {
    closePricingTemplateDialog,
    deletePricingTemplateConfirm,
    deletePricingTemplateConflict,
    editingPricingTemplate,
    handleDeletePricingTemplate,
    handleDeletePricingTemplateClick,
    handleEditPricingTemplate,
    handleSavePricingTemplate,
    handleViewPricingTemplateUsage,
    openCreatePricingTemplateDialog,
    pricingTemplateDeleting,
    pricingTemplateDialogOpen,
    pricingTemplateForm,
    pricingTemplatePreparingEditId,
    pricingTemplateSaving,
    pricingTemplateUsageDialogOpen,
    pricingTemplateUsageLoading,
    pricingTemplateUsageRows,
    pricingTemplateUsageTemplate,
    pricingTemplates,
    pricingTemplatesLoading,
    setDeletePricingTemplateConfirm,
    setDeletePricingTemplateConflict,
    setPricingTemplateDialogOpen,
    setPricingTemplateForm,
    setPricingTemplateUsageDialogOpen,
  };
}
