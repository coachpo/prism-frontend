import { ProviderSelect } from "@/components/ProviderSelect";
import { SwitchController } from "@/components/SwitchController";
import { Button } from "@/components/ui/button";
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
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingModel ? "Edit Model" : "New Model"}</DialogTitle>
          <DialogDescription>
            Configure provider, routing type, and strategy attachment for this model.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Provider</Label>
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
              placeholder="Select provider"
            />
          </div>

          {!editingModel && (
            <div className="space-y-2">
              <Label>Model ID</Label>
              <Input
                value={formData.model_id}
                onChange={(e) => setFormData({ ...formData, model_id: e.target.value })}
                placeholder="e.g. gpt-4o"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input
              value={formData.display_name ?? ""}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="Optional friendly name"
            />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={formData.model_type} onValueChange={(v) => setModelType(v as "native" | "proxy")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="native">Native</SelectItem>
                <SelectItem value="proxy">Proxy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.model_type === "proxy" && (
            <div className="space-y-2">
              <Label>Redirect To</Label>
              {nativeModelsForProvider.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No native models available for {selectedProvider?.name || "this provider"}. Create a native model first.
                </p>
              ) : (
                <Select
                  value={formData.redirect_to || ""}
                  onValueChange={(val) => setFormData({ ...formData, redirect_to: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target model" />
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
              <Label>Loadbalance Strategy</Label>
              {loadbalanceStrategies.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No loadbalance strategies are available for this profile. Create one on the Loadbalance Strategies page first.
                </p>
              ) : (
                <Select
                  value={formData.loadbalance_strategy_id === null ? undefined : String(formData.loadbalance_strategy_id)}
                  onValueChange={(value) => setLoadbalanceStrategyId(Number.parseInt(value, 10))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select strategy" />
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
            label="Active"
            description="Turn this model on or off"
            checked={formData.is_enabled}
            onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
