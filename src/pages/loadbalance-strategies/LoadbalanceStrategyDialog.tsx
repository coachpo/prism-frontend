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
