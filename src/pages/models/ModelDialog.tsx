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
import type { LoadBalancingStrategy, ModelConfigCreate, ModelConfigListItem, Provider } from "@/lib/types";
import type { SubmitEventLike } from "./modelFormState";

type Props = {
  editingModel: ModelConfigListItem | null;
  formData: ModelConfigCreate;
  isDialogOpen: boolean;
  nativeModelsForProvider: ModelConfigListItem[];
  providers: Provider[];
  selectedProvider?: Provider;
  setFormData: (value: ModelConfigCreate | ((prev: ModelConfigCreate) => ModelConfigCreate)) => void;
  setIsDialogOpen: (open: boolean) => void;
  setLoadBalancingStrategy: (value: LoadBalancingStrategy) => void;
  setModelType: (value: "native" | "proxy") => void;
  onSubmit: (event: SubmitEventLike) => void;
};

export function ModelDialog({
  editingModel,
  formData,
  isDialogOpen,
  nativeModelsForProvider,
  providers,
  selectedProvider,
  setFormData,
  setIsDialogOpen,
  setLoadBalancingStrategy,
  setModelType,
  onSubmit,
}: Props) {
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingModel ? "Edit Model" : "New Model"}</DialogTitle>
          <DialogDescription>
            Configure provider, routing type, and failover policy for this model.
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
              <Label>Load Balancing</Label>
              <Select value={formData.lb_strategy} onValueChange={(v) => setLoadBalancingStrategy(v as LoadBalancingStrategy)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="failover">Failover</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.model_type === "native" && formData.lb_strategy === "failover" && (
            <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
              <div className="space-y-2">
                <Label className="text-base font-medium">Recovery Policy</Label>
                <p className="text-sm text-muted-foreground">
                  Set a base cooldown for retries; Prism applies automatic backoff and jitter after repeated failures.
                </p>
              </div>

              <SwitchController
                label="Auto-Recovery"
                description="Automatically retry failed endpoints using base cooldown with adaptive backoff and jitter"
                checked={formData.failover_recovery_enabled ?? true}
                onCheckedChange={(checked) => setFormData({ ...formData, failover_recovery_enabled: checked })}
              />

              {formData.failover_recovery_enabled && (
                <div className="space-y-2">
                  <Label>Base Cooldown (seconds)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={3600}
                    value={formData.failover_recovery_cooldown_seconds}
                    onChange={(e) => setFormData({ ...formData, failover_recovery_cooldown_seconds: parseInt(e.target.value) || 60 })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Initial retry delay before probing a failed endpoint; repeated failures increase delay with automatic backoff and jitter (1-3600s).
                  </p>
                </div>
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
