import { ApiFamilySelect } from "@/components/ApiFamilySelect";
import { SwitchController } from "@/components/SwitchController";
import { VendorSelect } from "@/components/VendorSelect";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/i18n/useLocale";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type {
  LoadbalanceStrategy,
  ModelConfigCreate,
  ModelConfigListItem,
  Vendor,
} from "@/lib/types";
import type { SubmitEventLike } from "./modelFormState";
import {
  appendProxyTarget,
  moveProxyTarget,
  normalizeProxyTargets,
  removeProxyTarget,
} from "./modelFormState";

type Props = {
  editingModel: ModelConfigListItem | null;
  formData: ModelConfigCreate;
  isDialogOpen: boolean;
  loadbalanceStrategies: LoadbalanceStrategy[];
  nativeModelsForApiFamily: ModelConfigListItem[];
  vendors: Vendor[];
  setFormData: (value: ModelConfigCreate | ((prev: ModelConfigCreate) => ModelConfigCreate)) => void;
  setIsDialogOpen: (open: boolean) => void;
  setLoadbalanceStrategyId: (value: number | null) => void;
  setModelType: (value: "native" | "proxy") => void;
  onSubmit: (event: SubmitEventLike) => void;
};

export function ModelDialog({
  editingModel,
  formData,
  isDialogOpen,
  loadbalanceStrategies,
  nativeModelsForApiFamily,
  vendors,
  setFormData,
  setIsDialogOpen,
  setLoadbalanceStrategyId,
  setModelType,
  onSubmit,
}: Props) {
  const { locale, messages } = useLocale();
  const strategyCopy = messages.loadbalanceStrategyCopy;
  const fieldCopy = messages.common;
  const normalizedProxyTargets = normalizeProxyTargets(formData.proxy_targets);
  const selectedProxyTargetIds = new Set(normalizedProxyTargets.map((target) => target.target_model_id));
  const remainingProxyTargets = nativeModelsForApiFamily.filter(
    (model) => !selectedProxyTargetIds.has(model.model_id),
  );

  const resolveTargetLabel = (targetModelId: string) => {
    const matchedModel = nativeModelsForApiFamily.find((model) => model.model_id === targetModelId);
    if (!matchedModel) {
      return targetModelId;
    }

    return matchedModel.display_name
      ? `${matchedModel.display_name} (${matchedModel.model_id})`
      : matchedModel.model_id;
  };

  const getStrategyOptionText = (strategy: LoadbalanceStrategy) => {
    if (strategy.strategy_type === "fill-first") {
      return `${strategy.name} (${strategyCopy.fillFirstLabel} · ${strategyCopy.fillFirstSummary})`;
    }

    if (strategy.strategy_type === "round-robin") {
      return `${strategy.name} (${strategyCopy.roundRobinLabel} · ${strategyCopy.roundRobinSummary})`;
    }

    if (strategy.strategy_type === "failover") {
      return `${strategy.name} (${strategyCopy.failoverLabel} · ${strategyCopy.failoverSummary})`;
    }

    return `${strategy.name} (${strategyCopy.singleLabel})`;
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingModel ? (locale === "zh-CN" ? "编辑模型" : "Edit Model") : locale === "zh-CN" ? "新建模型" : "New Model"}</DialogTitle>
          <DialogDescription>
            {locale === "zh-CN"
              ? "配置此模型的供应商、API 家族、路由类型和策略绑定。"
              : "Configure vendor, API family, routing type, and strategy attachment for this model."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{fieldCopy.vendor}</Label>
              <VendorSelect
                value={String(formData.vendor_id ?? "")}
                onValueChange={(value) => {
                  const nextVendorId = Number.parseInt(value, 10);
                  setFormData((prev) => ({
                    ...prev,
                    vendor_id: nextVendorId,
                  }));
                }}
                valueType="vendor_id"
                vendors={vendors}
                showAll={false}
                className="w-full"
                placeholder={locale === "zh-CN" ? "选择供应商" : "Select vendor"}
              />
            </div>

            <div className="space-y-2">
              <Label>{fieldCopy.apiFamily}</Label>
              <ApiFamilySelect
                value={formData.api_family ?? ""}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    api_family: value as typeof prev.api_family,
                    proxy_targets:
                      prev.model_type === "proxy" && value !== prev.api_family
                        ? []
                        : normalizeProxyTargets(prev.proxy_targets),
                  }))
                }
                showAll={false}
                className="w-full"
                placeholder={locale === "zh-CN" ? "选择 API 家族" : "Select API family"}
              />
            </div>
          </div>

          {!editingModel && (
            <div className="space-y-2">
              <Label>{locale === "zh-CN" ? "模型 ID" : "Model ID"}</Label>
              <Input
                value={formData.model_id}
                onChange={(e) => setFormData({ ...formData, model_id: e.target.value })}
                placeholder={locale === "zh-CN" ? "例如：gpt-4o" : "e.g. gpt-4o"}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>{locale === "zh-CN" ? "显示名称" : "Display Name"}</Label>
            <Input
              value={formData.display_name ?? ""}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder={locale === "zh-CN" ? "可选的友好名称" : "Optional friendly name"}
            />
          </div>

          <div className="space-y-2">
            <Label>{locale === "zh-CN" ? "类型" : "Type"}</Label>
            <Select value={formData.model_type} onValueChange={(v) => setModelType(v as "native" | "proxy")}> 
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="native">{locale === "zh-CN" ? "原生" : "Native"}</SelectItem>
                <SelectItem value="proxy">{locale === "zh-CN" ? "代理" : "Proxy"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.model_type === "proxy" && (
            <div className="space-y-2">
              <Label>{locale === "zh-CN" ? "代理目标" : "Proxy Targets"}</Label>
              <p className="text-xs text-muted-foreground">
                {locale === "zh-CN"
                  ? "请求会按顺序尝试这些原生目标，找到第一个可用目标后停止。"
                  : "Requests try these native targets in order and stop at the first available target."}
              </p>
              {nativeModelsForApiFamily.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {locale === "zh-CN"
                    ? `${formData.api_family || "该 API 家族"} 暂无可用的原生模型。请先创建一个原生模型。`
                    : `No native models available for the ${formData.api_family || "selected"} API family. Create a native model first.`}
                </p>
              ) : (
                <div className="space-y-2">
                  {normalizedProxyTargets.length === 0 ? (
                    <p className="rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
                      {locale === "zh-CN" ? "尚未选择代理目标。" : "No proxy targets selected yet."}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {normalizedProxyTargets.map((target, index) => (
                        <div
                          key={target.target_model_id}
                          className="flex flex-col gap-3 rounded-md border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{resolveTargetLabel(target.target_model_id)}</p>
                            <p className="text-xs text-muted-foreground">
                              {locale === "zh-CN" ? `优先级 ${index + 1}` : `Priority ${index + 1}`}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              aria-label={`Move target ${target.target_model_id} up`}
                              disabled={index === 0}
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  proxy_targets: moveProxyTarget(normalizedProxyTargets, index, index - 1),
                                })
                              }
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              aria-label={`Move target ${target.target_model_id} down`}
                              disabled={index === normalizedProxyTargets.length - 1}
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  proxy_targets: moveProxyTarget(normalizedProxyTargets, index, index + 1),
                                })
                              }
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              aria-label={`Remove target ${target.target_model_id}`}
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  proxy_targets: removeProxyTarget(normalizedProxyTargets, target.target_model_id),
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="min-w-0 text-xs text-muted-foreground">
                      {remainingProxyTargets.length === 0
                        ? locale === "zh-CN"
                          ? "当前 API 家族下的原生模型都已加入。"
                          : "All native models for this API family are already included."
                        : locale === "zh-CN"
                          ? `还可添加 ${remainingProxyTargets.length} 个原生模型。`
                          : `${remainingProxyTargets.length} more native targets available.`}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      disabled={remainingProxyTargets.length === 0}
                      onClick={() => {
                        const nextTarget = remainingProxyTargets[0];
                        if (!nextTarget) {
                          return;
                        }

                        setFormData({
                          ...formData,
                          proxy_targets: appendProxyTarget(normalizedProxyTargets, nextTarget.model_id),
                        });
                      }}
                    >
                      {locale === "zh-CN" ? "添加目标" : "Add Target"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {formData.model_type === "native" && (
            <div className="space-y-2">
              <Label>{locale === "zh-CN" ? "负载均衡策略" : "Loadbalance Strategy"}</Label>
              {loadbalanceStrategies.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {locale === "zh-CN"
                    ? "此配置档案没有可用的负载均衡策略。请先在负载均衡策略页面创建一个。"
                    : "No loadbalance strategies are available for this profile. Create one on the Loadbalance Strategies page first."}
                </p>
              ) : (
                <Select
                  value={formData.loadbalance_strategy_id === null ? undefined : String(formData.loadbalance_strategy_id)}
                  onValueChange={(value) => setLoadbalanceStrategyId(Number.parseInt(value, 10))}
                >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={locale === "zh-CN" ? "选择策略" : "Select strategy"} />
                    </SelectTrigger>
                    <SelectContent>
                      {loadbalanceStrategies.map((strategy) => (
                        <SelectItem key={strategy.id} value={String(strategy.id)}>
                          {getStrategyOptionText(strategy)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              )}
            </div>
          )}

          <SwitchController
            label={locale === "zh-CN" ? "启用" : "Active"}
            description={locale === "zh-CN" ? "开启或关闭此模型" : "Turn this model on or off"}
            checked={formData.is_enabled}
            onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{locale === "zh-CN" ? "取消" : "Cancel"}</Button>
            <Button type="submit">{locale === "zh-CN" ? "保存" : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
