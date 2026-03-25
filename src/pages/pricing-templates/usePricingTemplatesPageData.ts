import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { isValidCurrencyCode } from "@/lib/costing";
import { getCurrentLocale } from "@/i18n/format";
import {
  getSharedPricingTemplates,
  setSharedPricingTemplates,
} from "@/lib/referenceData";
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

  const commitPricingTemplates = useCallback(
    (updater: (current: PricingTemplate[]) => PricingTemplate[]) => {
      setPricingTemplates((current) => {
        const next = sortPricingTemplates(updater(current));
        setSharedPricingTemplates(revision, next);
        return next;
      });
    },
    [revision],
  );

  const fetchPricingTemplates = useCallback(async () => {
    const isChinese = getCurrentLocale() === "zh-CN";
    setPricingTemplatesLoading(true);
    try {
      const data = await getSharedPricingTemplates(revision);
      setPricingTemplates(sortPricingTemplates(data));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : isChinese ? "加载价格模板失败" : "Failed to load pricing templates");
    } finally {
      setPricingTemplatesLoading(false);
    }
  }, [revision]);

  useEffect(() => {
    void revision;
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
    const isChinese = getCurrentLocale() === "zh-CN";
    setPricingTemplatePreparingEditId(templateSummary.id);
    try {
      const template = await api.pricingTemplates.get(templateSummary.id);
      setEditingPricingTemplate(template);
      setPricingTemplateForm(pricingTemplateFormStateFromTemplate(template));
      setPricingTemplateDialogOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : isChinese ? "加载价格模板失败" : "Failed to load pricing template");
    } finally {
      setPricingTemplatePreparingEditId(null);
    }
  };

  const handleSavePricingTemplate = async () => {
    const isChinese = getCurrentLocale() === "zh-CN";
    if (!pricingTemplateForm.name.trim()) {
      toast.error(isChinese ? "名称为必填项" : "Name is required");
      return;
    }
    if (!isValidCurrencyCode(pricingTemplateForm.pricing_currency_code)) {
      toast.error(
        isChinese
          ? "价格货币必须是有效的 3 位代码（例如 USD）"
          : "Pricing currency must be a valid 3-letter code (for example, USD)",
      );
      return;
    }
    if (!isNonNegativeDecimalString(pricingTemplateForm.input_price)) {
      toast.error(isChinese ? "输入价格必须为非负数" : "Input price must be a non-negative number");
      return;
    }
    if (!isNonNegativeDecimalString(pricingTemplateForm.output_price)) {
      toast.error(isChinese ? "输出价格必须为非负数" : "Output price must be a non-negative number");
      return;
    }

    const cachedInputPrice = normalizeOptionalTemplatePrice(pricingTemplateForm.cached_input_price);
    if (cachedInputPrice && !isNonNegativeDecimalString(cachedInputPrice)) {
      toast.error(isChinese ? "缓存输入价格必须为非负数" : "Cached input price must be a non-negative number");
      return;
    }

    const cacheCreationPrice = normalizeOptionalTemplatePrice(pricingTemplateForm.cache_creation_price);
    if (cacheCreationPrice && !isNonNegativeDecimalString(cacheCreationPrice)) {
      toast.error(isChinese ? "缓存创建价格必须为非负数" : "Cache creation price must be a non-negative number");
      return;
    }

    const reasoningPrice = normalizeOptionalTemplatePrice(pricingTemplateForm.reasoning_price);
    if (reasoningPrice && !isNonNegativeDecimalString(reasoningPrice)) {
      toast.error(isChinese ? "推理价格必须为非负数" : "Reasoning price must be a non-negative number");
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
        const updated = await api.pricingTemplates.update(editingPricingTemplate.id, payload);
        commitPricingTemplates((current) =>
          current.map((template) =>
            template.id === editingPricingTemplate.id ? updated : template
          )
        );
        toast.success(isChinese ? "价格模板已更新" : "Pricing template updated");
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
        const created = await api.pricingTemplates.create(payload);
        commitPricingTemplates((current) => [created, ...current]);
        toast.success(isChinese ? "价格模板已创建" : "Pricing template created");
      }

      closePricingTemplateDialog();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        toast.error(
          isChinese
            ? "你编辑的价格模板已发生变化。请重新打开对话框后再试。"
            : "This pricing template changed while you were editing it. Reopen the dialog and try again.",
        );
        await fetchPricingTemplates();
        return;
      }
      toast.error(error instanceof Error ? error.message : isChinese ? "保存价格模板失败" : "Failed to save pricing template");
    } finally {
      setPricingTemplateSaving(false);
    }
  };

  const handleViewPricingTemplateUsage = async (template: PricingTemplate) => {
    const isChinese = getCurrentLocale() === "zh-CN";
    setPricingTemplateUsageTemplate(template);
    setPricingTemplateUsageDialogOpen(true);
    setPricingTemplateUsageLoading(true);
    try {
      const data = await api.pricingTemplates.connections(template.id);
      setPricingTemplateUsageRows(data.items);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : isChinese ? "加载模板使用情况失败" : "Failed to load template usage");
      setPricingTemplateUsageRows([]);
    } finally {
      setPricingTemplateUsageLoading(false);
    }
  };

  const handleDeletePricingTemplateClick = async (template: PricingTemplate) => {
    const isChinese = getCurrentLocale() === "zh-CN";
    setDeletePricingTemplateConfirm(template);
    setDeletePricingTemplateConflict(null);
    setPricingTemplateUsageLoading(true);
    try {
      const data = await api.pricingTemplates.connections(template.id);
      setPricingTemplateUsageRows(data.items);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : isChinese ? "加载模板使用情况失败" : "Failed to load template usage");
      setPricingTemplateUsageRows([]);
    } finally {
      setPricingTemplateUsageLoading(false);
    }
  };

  const handleDeletePricingTemplate = async () => {
    const isChinese = getCurrentLocale() === "zh-CN";
    if (!deletePricingTemplateConfirm) {
      return;
    }

    setPricingTemplateDeleting(true);
    try {
      await api.pricingTemplates.delete(deletePricingTemplateConfirm.id);
      commitPricingTemplates((current) =>
        current.filter((template) => template.id !== deletePricingTemplateConfirm.id)
      );
      toast.success(isChinese ? "价格模板已删除" : "Pricing template deleted");
      setDeletePricingTemplateConfirm(null);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const conflictRows = parsePricingTemplateUsageRows(error.detail);
        setDeletePricingTemplateConflict(conflictRows);
        toast.error(isChinese ? "无法删除模板，因为它正在被使用" : "Cannot delete template because it is in use");
      } else {
        toast.error(error instanceof Error ? error.message : isChinese ? "删除价格模板失败" : "Failed to delete pricing template");
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

function sortPricingTemplates(templates: PricingTemplate[]) {
  return [...templates].sort((left, right) => {
    const updatedAtDelta =
      new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime();

    if (updatedAtDelta !== 0) {
      return updatedAtDelta;
    }

    return right.id - left.id;
  });
}
