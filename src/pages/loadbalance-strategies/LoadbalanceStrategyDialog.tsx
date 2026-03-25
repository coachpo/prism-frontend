import { CircleHelp } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { useLocale } from "@/i18n/useLocale";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { LoadbalanceStrategy } from "@/lib/types";
import type { LoadbalanceStrategyFormState } from "./loadbalanceStrategyFormState";

function FailoverFieldLabel({
  htmlFor,
  helpAriaLabel,
  label,
  description,
}: {
  htmlFor: string;
  helpAriaLabel: string;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={helpAriaLabel}
            className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
          >
            <CircleHelp className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {description}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

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
  const { messages } = useLocale();
  const dialogMessages = messages.loadbalanceStrategyDialog;
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
            {editingLoadbalanceStrategy ? dialogMessages.editTitle : dialogMessages.addTitle}
          </DialogTitle>
          <DialogDescription>{dialogMessages.description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="loadbalance-strategy-name">{dialogMessages.nameLabel}</Label>
            <Input
              id="loadbalance-strategy-name"
              value={loadbalanceStrategyForm.name}
              onChange={(event) =>
                  setLoadbalanceStrategyForm((prev) => ({ ...prev, name: event.target.value }))
                }
              placeholder={dialogMessages.namePlaceholder}
            />
          </div>

          <div className="space-y-2">
            <Label>{dialogMessages.strategyTypeLabel}</Label>
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
                <SelectItem value="single">{dialogMessages.singleOption}</SelectItem>
                <SelectItem value="failover">{dialogMessages.failoverOption}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loadbalanceStrategyForm.strategy_type === "failover" ? (
            <>
              <SwitchController
                label={dialogMessages.autoRecoveryLabel}
                description={dialogMessages.autoRecoveryDescription}
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
                  <FailoverFieldLabel
                    htmlFor="failover-cooldown-seconds"
                    helpAriaLabel={dialogMessages.explainField(dialogMessages.baseCooldownLabel)}
                    label={dialogMessages.baseCooldownLabel}
                    description={dialogMessages.baseCooldownDescription}
                  />
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
                  <FailoverFieldLabel
                    htmlFor="failover-failure-threshold"
                    helpAriaLabel={dialogMessages.explainField(dialogMessages.failureThresholdLabel)}
                    label={dialogMessages.failureThresholdLabel}
                    description={dialogMessages.failureThresholdDescription}
                  />
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
                  <FailoverFieldLabel
                    htmlFor="failover-backoff-multiplier"
                    helpAriaLabel={dialogMessages.explainField(dialogMessages.backoffMultiplierLabel)}
                    label={dialogMessages.backoffMultiplierLabel}
                    description={dialogMessages.backoffMultiplierDescription}
                  />
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
                  <FailoverFieldLabel
                    htmlFor="failover-max-cooldown-seconds"
                    helpAriaLabel={dialogMessages.explainField(dialogMessages.maxCooldownLabel)}
                    label={dialogMessages.maxCooldownLabel}
                    description={dialogMessages.maxCooldownDescription}
                  />
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
                  <FailoverFieldLabel
                    htmlFor="failover-jitter-ratio"
                    helpAriaLabel={dialogMessages.explainField(dialogMessages.jitterRatioLabel)}
                    label={dialogMessages.jitterRatioLabel}
                    description={dialogMessages.jitterRatioDescription}
                  />
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
                  <FailoverFieldLabel
                    htmlFor="failover-auth-error-cooldown-seconds"
                    helpAriaLabel={dialogMessages.explainField(dialogMessages.authErrorCooldownLabel)}
                    label={dialogMessages.authErrorCooldownLabel}
                    description={dialogMessages.authErrorCooldownDescription}
                  />
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
              {dialogMessages.singleStrategyHint}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {dialogMessages.cancel}
          </Button>
          <Button onClick={() => void onSave()} disabled={loadbalanceStrategySaving}>
            {loadbalanceStrategySaving ? dialogMessages.saving : dialogMessages.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
