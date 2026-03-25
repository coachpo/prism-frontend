import { ProviderSelect } from "@/components/ProviderSelect";
import { SwitchController } from "@/components/SwitchController";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/i18n/useLocale";
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
  Provider,
} from "@/lib/types";
import type { SubmitEventLike } from "./modelFormState";

type Props = {
  editingModel: ModelConfigListItem | null;
  formData: ModelConfigCreate;
  isDialogOpen: boolean;
  loadbalanceStrategies: LoadbalanceStrategy[];
  nativeModelsForProvider: ModelConfigListItem[];
  providers: Provider[];
  selectedProvider?: Provider;
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
  nativeModelsForProvider,
  providers,
  selectedProvider,
  setFormData,
  setIsDialogOpen,
  setLoadbalanceStrategyId,
  setModelType,
  onSubmit,
}: Props) {
  const { locale } = useLocale();
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingModel ? (locale === "zh-CN" ? "编辑模型" : "Edit Model") : locale === "zh-CN" ? "新建模型" : "New Model"}</DialogTitle>
          <DialogDescription>
            {locale === "zh-CN"
              ? "配置此模型的提供商、路由类型和策略绑定。"
              : "Configure provider, routing type, and strategy attachment for this model."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{locale === "zh-CN" ? "提供商" : "Provider"}</Label>
            <ProviderSelect
              value={String(formData.provider_id)}
              onValueChange={(v) =>
                setFormData((prev) => {
                  const nextProviderId = Number.parseInt(v, 10);
                  return {
                    ...prev,
                    provider_id: nextProviderId,
                    redirect_to:
                      prev.model_type === "proxy" && nextProviderId !== prev.provider_id
                        ? null
                        : prev.redirect_to,
                  };
                })
              }
              valueType="provider_id"
              providers={providers}
              showAll={false}
              placeholder={locale === "zh-CN" ? "选择提供商" : "Select provider"}
            />
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
              <SelectTrigger>
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
              <Label>{locale === "zh-CN" ? "重定向到" : "Redirect To"}</Label>
              {nativeModelsForProvider.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {locale === "zh-CN"
                    ? `${selectedProvider?.name || "该提供商"} 暂无可用的原生模型。请先创建一个原生模型。`
                    : `No native models available for ${selectedProvider?.name || "this provider"}. Create a native model first.`}
                </p>
              ) : (
                <Select
                  value={formData.redirect_to || ""}
                  onValueChange={(val) => setFormData({ ...formData, redirect_to: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={locale === "zh-CN" ? "选择目标模型" : "Select target model"} />
                  </SelectTrigger>
                  <SelectContent>
                    {nativeModelsForProvider.map((m) => (
                      <SelectItem key={m.model_id} value={m.model_id}>
                        {m.display_name || m.model_id}
                        {m.display_name && ` (${m.model_id})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  <SelectTrigger>
                    <SelectValue placeholder={locale === "zh-CN" ? "选择策略" : "Select strategy"} />
                  </SelectTrigger>
                  <SelectContent>
                    {loadbalanceStrategies.map((strategy) => (
                      <SelectItem key={strategy.id} value={String(strategy.id)}>
                        {strategy.name} ({strategy.strategy_type})
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
