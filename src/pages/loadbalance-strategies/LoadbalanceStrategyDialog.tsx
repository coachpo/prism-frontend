import { CircleHelp, Plus, X } from "lucide-react";
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
import {
  addFailoverStatusCode,
  getFailoverStatusCodeInputError,
  removeFailoverStatusCode,
  type LoadbalanceStrategyFormState,
} from "./loadbalanceStrategyFormState";

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
      | "failover_max_cooldown_strikes_before_ban"
      | "failover_ban_duration_seconds",
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

  const failoverStatusCodeInputError = getFailoverStatusCodeInputError(loadbalanceStrategyForm);

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
                onValueChange={(value: "single" | "fill-first" | "round-robin" | "failover") =>
                  setLoadbalanceStrategyForm((prev) => ({
                    ...prev,
                    strategy_type: value,
                    failover_recovery_enabled: value === "single" ? false : prev.failover_recovery_enabled,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">{dialogMessages.singleOption}</SelectItem>
                  <SelectItem value="fill-first">{dialogMessages.fillFirstOption}</SelectItem>
                  <SelectItem value="round-robin">{dialogMessages.roundRobinOption}</SelectItem>
                  <SelectItem value="failover">{dialogMessages.failoverOption}</SelectItem>
                </SelectContent>
              </Select>
            </div>

          {loadbalanceStrategyForm.strategy_type !== "single" ? (
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
                <div className="space-y-2 sm:col-span-2">
                  <FailoverFieldLabel
                    htmlFor="failover-status-code-input"
                    helpAriaLabel={dialogMessages.explainField(dialogMessages.failoverStatusCodesLabel)}
                    label={dialogMessages.failoverStatusCodesLabel}
                    description={dialogMessages.failoverStatusCodesDescription}
                  />
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        id="failover-status-code-input"
                        aria-invalid={Boolean(failoverStatusCodeInputError)}
                        aria-describedby={
                          failoverStatusCodeInputError ? "failover-status-code-input-error" : undefined
                        }
                        type="number"
                        min={100}
                        max={599}
                        step={1}
                        value={loadbalanceStrategyForm.failover_status_code_input}
                        onChange={(event) =>
                          setLoadbalanceStrategyForm((prev) => ({
                            ...prev,
                            failover_status_code_input: event.target.value,
                          }))
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="sm:self-start"
                        disabled={
                          !loadbalanceStrategyForm.failover_status_code_input.trim() ||
                          Boolean(failoverStatusCodeInputError)
                        }
                        onClick={() =>
                          setLoadbalanceStrategyForm((prev) => addFailoverStatusCode(prev))
                        }
                      >
                        <Plus className="h-3.5 w-3.5" />
                        {dialogMessages.addStatusCode}
                      </Button>
                    </div>
                    {failoverStatusCodeInputError ? (
                      <p
                        id="failover-status-code-input-error"
                        className="text-xs text-destructive"
                      >
                        {failoverStatusCodeInputError}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      {loadbalanceStrategyForm.failover_status_codes.map((statusCode) => (
                        <Button
                          key={statusCode}
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={() =>
                            setLoadbalanceStrategyForm((prev) =>
                              removeFailoverStatusCode(prev, statusCode),
                            )
                          }
                        >
                          {statusCode}
                          <X className="h-3 w-3" />
                          <span className="sr-only">
                            {dialogMessages.removeStatusCode(statusCode)}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-md border bg-muted/20 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{dialogMessages.banEscalationLabel}</p>
                  <p className="text-xs text-muted-foreground">
                    {dialogMessages.banEscalationDescription}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <FailoverFieldLabel
                      htmlFor="failover-ban-mode"
                      helpAriaLabel={dialogMessages.explainField(dialogMessages.banModeLabel)}
                      label={dialogMessages.banModeLabel}
                      description={dialogMessages.banModeDescription}
                    />
                    <Select
                      value={loadbalanceStrategyForm.failover_ban_mode}
                      onValueChange={(value: "off" | "temporary" | "manual") =>
                        setLoadbalanceStrategyForm((prev) => ({
                          ...prev,
                          failover_ban_mode: value,
                          failover_max_cooldown_strikes_before_ban:
                            value === "off"
                              ? 0
                              : Math.max(prev.failover_max_cooldown_strikes_before_ban, 1),
                          failover_ban_duration_seconds:
                            value === "temporary"
                              ? Math.max(prev.failover_ban_duration_seconds, 1)
                              : 0,
                        }))
                      }
                    >
                      <SelectTrigger id="failover-ban-mode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="off">{dialogMessages.banModeOffOption}</SelectItem>
                        <SelectItem value="temporary">
                          {dialogMessages.banModeTemporaryOption}
                        </SelectItem>
                        <SelectItem value="manual">{dialogMessages.banModeManualOption}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <FailoverFieldLabel
                      htmlFor="failover-max-cooldown-strikes-before-ban"
                      helpAriaLabel={dialogMessages.explainField(
                        dialogMessages.maxCooldownStrikesBeforeBanLabel,
                      )}
                      label={dialogMessages.maxCooldownStrikesBeforeBanLabel}
                      description={dialogMessages.maxCooldownStrikesBeforeBanDescription}
                    />
                    <Input
                      id="failover-max-cooldown-strikes-before-ban"
                      type="number"
                      min={0}
                      step={1}
                      value={loadbalanceStrategyForm.failover_max_cooldown_strikes_before_ban}
                      onChange={(event) =>
                        setNumericField(
                          "failover_max_cooldown_strikes_before_ban",
                          parseIntegerInput(
                            event.target.value,
                            loadbalanceStrategyForm.failover_max_cooldown_strikes_before_ban,
                          ),
                        )
                      }
                    />
                  </div>

                  {loadbalanceStrategyForm.failover_ban_mode === "temporary" ? (
                    <div className="space-y-2 sm:col-span-2">
                      <FailoverFieldLabel
                        htmlFor="failover-ban-duration-seconds"
                        helpAriaLabel={dialogMessages.explainField(
                          dialogMessages.banDurationLabel,
                        )}
                        label={dialogMessages.banDurationLabel}
                        description={dialogMessages.banDurationDescription}
                      />
                      <Input
                        id="failover-ban-duration-seconds"
                        type="number"
                        min={1}
                        step={1}
                        value={loadbalanceStrategyForm.failover_ban_duration_seconds}
                        onChange={(event) =>
                          setNumericField(
                            "failover_ban_duration_seconds",
                            parseIntegerInput(
                              event.target.value,
                              loadbalanceStrategyForm.failover_ban_duration_seconds,
                            ),
                          )
                        }
                      />
                    </div>
                  ) : null}
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
