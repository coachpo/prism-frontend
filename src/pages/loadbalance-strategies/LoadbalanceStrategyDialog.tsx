import type { Dispatch, SetStateAction } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LoadbalanceStrategy } from "@/lib/types";
import type { LoadbalanceStrategyFormState } from "./loadbalanceStrategyFormState";

interface LoadbalanceStrategyDialogProps {
  editingLoadbalanceStrategy: LoadbalanceStrategy | null;
  loadbalanceStrategyForm: LoadbalanceStrategyFormState;
  loadbalanceStrategySaving: boolean;
  onClose: () => void;
  onOpenChange: (open: boolean) => void;
  onSave: () => Promise<void>;
  open: boolean;
  setLoadbalanceStrategyForm: Dispatch<SetStateAction<LoadbalanceStrategyFormState>>;
}

export function LoadbalanceStrategyDialog({
  editingLoadbalanceStrategy,
  loadbalanceStrategyForm,
  loadbalanceStrategySaving,
  onClose,
  onOpenChange,
  onSave,
  open,
  setLoadbalanceStrategyForm,
}: LoadbalanceStrategyDialogProps) {
  const setNumericField = (
    field:
      | "failover_cooldown_seconds"
      | "failover_failure_threshold"
      | "failover_backoff_multiplier"
      | "failover_max_cooldown_seconds"
      | "failover_jitter_ratio"
      | "failover_auth_error_cooldown_seconds",
    nextValue: number,
  ) => {
    setLoadbalanceStrategyForm((prev) => ({
      ...prev,
      [field]: nextValue,
    }));
  };

  const parseNumericInput = (value: string, fallback: number) => {
    if (!value.trim()) {
      return fallback;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const parseIntegerInput = (value: string, fallback: number) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
          return;
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingLoadbalanceStrategy ? "Edit Loadbalance Strategy" : "Add Loadbalance Strategy"}
          </DialogTitle>
          <DialogDescription>
            Configure reusable routing behavior for native models in this profile.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="loadbalance-strategy-name">Name</Label>
            <Input
              id="loadbalance-strategy-name"
              value={loadbalanceStrategyForm.name}
              onChange={(event) =>
                setLoadbalanceStrategyForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="e.g. failover-primary"
            />
          </div>

          <div className="space-y-2">
            <Label>Strategy Type</Label>
            <Select
              value={loadbalanceStrategyForm.strategy_type}
              onValueChange={(value: "single" | "failover") =>
                setLoadbalanceStrategyForm((prev) => ({
                  ...prev,
                  strategy_type: value,
                  failover_recovery_enabled:
                    value === "failover" ? prev.failover_recovery_enabled : false,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="failover">Failover</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loadbalanceStrategyForm.strategy_type === "failover" ? (
            <>
              <SwitchController
                label="Auto-Recovery"
                description="Allow failed endpoints in this strategy to recover automatically after backend-managed cooldown windows."
                checked={loadbalanceStrategyForm.failover_recovery_enabled}
                onCheckedChange={(checked) =>
                  setLoadbalanceStrategyForm((prev) => ({
                    ...prev,
                    failover_recovery_enabled: checked,
                  }))
                }
              />

              <div className="grid gap-4 rounded-md border bg-muted/20 p-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="failover-cooldown-seconds">Base Cooldown (seconds)</Label>
                  <Input
                    id="failover-cooldown-seconds"
                    type="number"
                    min={0}
                    step={1}
                    value={loadbalanceStrategyForm.failover_cooldown_seconds}
                    onChange={(event) =>
                      setNumericField(
                        "failover_cooldown_seconds",
                        parseIntegerInput(
                          event.target.value,
                          loadbalanceStrategyForm.failover_cooldown_seconds,
                        ),
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="failover-failure-threshold">Failure Threshold</Label>
                  <Input
                    id="failover-failure-threshold"
                    type="number"
                    min={1}
                    max={10}
                    step={1}
                    value={loadbalanceStrategyForm.failover_failure_threshold}
                    onChange={(event) =>
                      setNumericField(
                        "failover_failure_threshold",
                        parseIntegerInput(
                          event.target.value,
                          loadbalanceStrategyForm.failover_failure_threshold,
                        ),
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="failover-backoff-multiplier">Backoff Multiplier</Label>
                  <Input
                    id="failover-backoff-multiplier"
                    type="number"
                    min={1}
                    max={10}
                    step={0.1}
                    value={loadbalanceStrategyForm.failover_backoff_multiplier}
                    onChange={(event) =>
                      setNumericField(
                        "failover_backoff_multiplier",
                        parseNumericInput(
                          event.target.value,
                          loadbalanceStrategyForm.failover_backoff_multiplier,
                        ),
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="failover-max-cooldown-seconds">Max Cooldown (seconds)</Label>
                  <Input
                    id="failover-max-cooldown-seconds"
                    type="number"
                    min={1}
                    max={86400}
                    step={1}
                    value={loadbalanceStrategyForm.failover_max_cooldown_seconds}
                    onChange={(event) =>
                      setNumericField(
                        "failover_max_cooldown_seconds",
                        parseIntegerInput(
                          event.target.value,
                          loadbalanceStrategyForm.failover_max_cooldown_seconds,
                        ),
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="failover-jitter-ratio">Jitter Ratio</Label>
                  <Input
                    id="failover-jitter-ratio"
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    value={loadbalanceStrategyForm.failover_jitter_ratio}
                    onChange={(event) =>
                      setNumericField(
                        "failover_jitter_ratio",
                        parseNumericInput(
                          event.target.value,
                          loadbalanceStrategyForm.failover_jitter_ratio,
                        ),
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="failover-auth-error-cooldown-seconds">
                    Auth Error Cooldown (seconds)
                  </Label>
                  <Input
                    id="failover-auth-error-cooldown-seconds"
                    type="number"
                    min={1}
                    max={86400}
                    step={1}
                    value={loadbalanceStrategyForm.failover_auth_error_cooldown_seconds}
                    onChange={(event) =>
                      setNumericField(
                        "failover_auth_error_cooldown_seconds",
                        parseIntegerInput(
                          event.target.value,
                          loadbalanceStrategyForm.failover_auth_error_cooldown_seconds,
                        ),
                      )
                    }
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
              Single strategies always route through one active connection and do not expose recovery.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void onSave()} disabled={loadbalanceStrategySaving}>
            {loadbalanceStrategySaving ? "Saving..." : "Save Strategy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
