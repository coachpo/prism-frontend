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
  ModelConfigListItem,
  Vendor,
} from "@/lib/types";
import type { ModelFormData, SubmitEventLike } from "./modelFormState";
import {
  appendProxyTarget,
  moveProxyTarget,
  normalizeProxyTargets,
  removeProxyTarget,
  setDisplayNameOnForm,
  setModelIdOnForm,
} from "./modelFormState";

type Props = {
  editingModel: ModelConfigListItem | null;
  formData: ModelFormData;
  isDialogOpen: boolean;
  loadbalanceStrategies: LoadbalanceStrategy[];
  nativeModelsForApiFamily: ModelConfigListItem[];
  vendors: Vendor[];
  setFormData: (value: ModelFormData | ((prev: ModelFormData) => ModelFormData)) => void;
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
  const { formatNumber, messages } = useLocale();
  const strategyCopy = messages.loadbalanceStrategyCopy;
  const fieldCopy = messages.common;
  const copy = messages.modelsUi;
  const detailCopy = messages.modelDetail;
  const normalizedProxyTargets = normalizeProxyTargets(formData.proxy_targets);
  const selectedProxyTargetIds = new Set(normalizedProxyTargets.map((target) => target.target_model_id));
  const remainingProxyTargets = nativeModelsForApiFamily.filter(
    (model) => !selectedProxyTargetIds.has(model.model_id),
  );

  const getStrategyTypeLabel = (strategy: LoadbalanceStrategy) =>
    strategy.strategy_type === "single"
      ? strategyCopy.singleLabel
      : strategy.strategy_type === "fill-first"
        ? strategyCopy.fillFirstLabel
        : strategyCopy.roundRobinLabel;

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
    return `${strategy.name} (${getStrategyTypeLabel(strategy)})`;
  };

  const loadbalanceStrategyValue = String(formData.loadbalance_strategy_id ?? "");

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingModel ? copy.editModel : messages.modelsPage.newModel}</DialogTitle>
          <DialogDescription>{detailCopy.modelSettingsDescription}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <input type="hidden" name="vendor_id" value={String(formData.vendor_id ?? "")} />
          <input type="hidden" name="api_family" value={formData.api_family ?? ""} />
          <input type="hidden" name="model_type" value={formData.model_type} />
          <input
            type="hidden"
            name="loadbalance_strategy_id"
            value={loadbalanceStrategyValue}
          />
          <input type="hidden" name="is_enabled" value={String(formData.is_enabled)} />
          {normalizedProxyTargets.map((target, index) => (
            <input
              key={`proxy-target-${target.target_model_id}`}
              type="hidden"
              name={`proxy_targets.${index}.target_model_id`}
              value={target.target_model_id}
            />
          ))}
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
                placeholder={detailCopy.selectVendor}
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
                placeholder={detailCopy.selectApiFamily}
              />
            </div>
          </div>

          {!editingModel && (
            <div className="space-y-2">
              <Label htmlFor="model-id">{copy.modelId}</Label>
              <Input
                id="model-id"
                name="model_id"
                value={formData.model_id}
                onChange={(e) => setFormData((prev) => setModelIdOnForm(prev, e.target.value))}
                placeholder={copy.modelIdPlaceholder}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="model-display-name">{copy.displayNameOptional}</Label>
            <Input
              id="model-display-name"
              name="display_name"
              value={formData.display_name ?? ""}
              onChange={(e) => setFormData((prev) => setDisplayNameOnForm(prev, e.target.value))}
              placeholder={copy.optionalFriendlyName}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model-type">{messages.settingsDialogs.type}</Label>
            <Select value={formData.model_type} onValueChange={(v) => setModelType(v as "native" | "proxy")}> 
              <SelectTrigger id="model-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="native">{detailCopy.typeNative}</SelectItem>
                <SelectItem value="proxy">{detailCopy.typeProxy}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.model_type === "proxy" && (
            <div className="space-y-2">
              <Label>{detailCopy.proxyTargets}</Label>
              <p className="text-xs text-muted-foreground">
                <span className="block">
                  {copy.proxyTargetsDescriptionPrimary}
                </span>
                <span className="block">
                  {copy.proxyTargetsDescriptionSecondary}
                </span>
              </p>
              <div className="space-y-2">
                {normalizedProxyTargets.length === 0 ? (
                  <p className="rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
                    {copy.noProxyTargetsSelected}
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
                            {copy.priority(formatNumber(index + 1))}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={copy.targetMoveUp(target.target_model_id)}
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
                            aria-label={copy.targetMoveDown(target.target_model_id)}
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
                            aria-label={copy.targetRemove(target.target_model_id)}
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

                {nativeModelsForApiFamily.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                      {copy.noNativeModelsForFamily(formData.api_family || messages.common.apiFamily)}
                  </p>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="min-w-0 text-xs text-muted-foreground">
                      {remainingProxyTargets.length === 0
                        ? copy.allNativeModelsIncluded
                        : copy.remainingNativeTargets(formatNumber(remainingProxyTargets.length))}
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
                      {copy.addTarget}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {formData.model_type === "native" && (
            <div className="space-y-2">
              <Label htmlFor="model-loadbalance-strategy">{detailCopy.loadbalanceStrategy}</Label>
              {loadbalanceStrategies.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {detailCopy.noLoadbalanceStrategiesAvailable}
                </p>
              ) : (
                <Select
                  value={loadbalanceStrategyValue}
                  onValueChange={(value) => setLoadbalanceStrategyId(Number.parseInt(value, 10))}
                >
                    <SelectTrigger id="model-loadbalance-strategy" className="w-full">
                        <SelectValue placeholder={detailCopy.selectStrategy} />
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
            label={detailCopy.enabled}
            description={copy.routingTypeDescription}
            checked={formData.is_enabled}
            onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{messages.settingsDialogs.cancel}</Button>
            <Button type="submit">{copy.save}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
