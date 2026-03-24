import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LoadbalanceStrategy, ModelConfig } from "@/lib/types";

interface ModelSettingsDialogProps {
  editLoadbalanceStrategyId: string;
  isOpen: boolean;
  loadbalanceStrategies: LoadbalanceStrategy[];
  onOpenChange: (open: boolean) => void;
  model: ModelConfig | null;
  editRedirectTo: string;
  setEditLoadbalanceStrategyId: (value: string) => void;
  setEditRedirectTo: (value: string) => void;
  handleEditModelSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  redirectTargetOptions: { modelId: string; label: string }[];
}

export function ModelSettingsDialog({
  editLoadbalanceStrategyId,
  isOpen,
  loadbalanceStrategies,
  onOpenChange,
  model,
  editRedirectTo,
  setEditLoadbalanceStrategyId,
  setEditRedirectTo,
  handleEditModelSubmit,
  redirectTargetOptions,
}: ModelSettingsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        {model && (
          <>
            <DialogHeader>
              <DialogTitle>Model Settings</DialogTitle>
              <DialogDescription>
                Update model identity and native strategy attachment or proxy target behavior for this profile.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditModelSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-display-name">Display Name</Label>
                <Input
                  id="edit-display-name"
                  name="display_name"
                  defaultValue={model.display_name || ""}
                  placeholder="Friendly name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-model-id">Model ID</Label>
                <Input
                  id="edit-model-id"
                  name="model_id"
                  defaultValue={model.model_id}
                  required
                />
              </div>
              {model.model_type === "proxy" && (
                <div className="space-y-2">
                  <Label htmlFor="edit-redirect-to">Redirect To</Label>
                  {redirectTargetOptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No native models available for this provider. Create a native model first.
                    </p>
                  ) : (
                    <Select value={editRedirectTo || undefined} onValueChange={setEditRedirectTo}>
                      <SelectTrigger id="edit-redirect-to">
                        <SelectValue placeholder="Select target model" />
                      </SelectTrigger>
                      <SelectContent>
                        {redirectTargetOptions.map((target) => (
                          <SelectItem key={target.modelId} value={target.modelId}>
                            {target.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
              {model.model_type === "native" && (
                <div className="space-y-2">
                  <Label htmlFor="edit-loadbalance-strategy">Loadbalance Strategy</Label>
                  {loadbalanceStrategies.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No loadbalance strategies are available for this profile. Create one on the Loadbalance Strategies page first.
                    </p>
                  ) : (
                    <Select
                      value={editLoadbalanceStrategyId || undefined}
                      onValueChange={setEditLoadbalanceStrategyId}
                    >
                      <SelectTrigger id="edit-loadbalance-strategy">
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
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
