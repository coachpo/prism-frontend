import { CircleHelp, Plus, X } from "lucide-react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
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
  getDefaultEnabledAutoRecoveryDraft,
  removeFailoverStatusCode,
  setLoadbalanceStrategyBanMode,
  setLoadbalanceStrategyType,
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
  const autoRecovery = loadbalanceStrategyForm.auto_recovery ?? { mode: "disabled" as const };
  const enabledAutoRecovery = autoRecovery.mode === "enabled" ? autoRecovery : null;
  const autoRecoveryEnabled = autoRecovery.mode === "enabled";
  const showRecoveryPolicy =
    loadbalanceStrategyForm.strategy_type !== "single" && autoRecoveryEnabled;
  const setNumericField = (
    field:
      | "base_seconds"
      | "failure_threshold"
      | "backoff_multiplier"
      | "max_cooldown_seconds"
      | "jitter_ratio",
    nextValue: number,
  ) => {
    setLoadbalanceStrategyForm((prev) => ({
      ...prev,
      auto_recovery:
        prev.auto_recovery.mode !== "enabled"
          ? prev.auto_recovery
          : {
              ...prev.auto_recovery,
              cooldown:
                field === "base_seconds" ||
                field === "failure_threshold" ||
                field === "backoff_multiplier" ||
                field === "max_cooldown_seconds" ||
                field === "jitter_ratio"
                  ? {
                      ...prev.auto_recovery.cooldown,
                      [field]: nextValue,
                    }
                  : prev.auto_recovery.cooldown,
              ban: prev.auto_recovery.ban,
            },
    }));
  };

  const setBanNumericField = (
    field: "max_cooldown_strikes_before_ban" | "ban_duration_seconds",
    nextValue: number,
  ) => {
    setLoadbalanceStrategyForm((prev) => {
      if (prev.auto_recovery.mode !== "enabled" || prev.auto_recovery.ban.mode === "off") {
        return prev;
      }

      if (field === "ban_duration_seconds" && prev.auto_recovery.ban.mode !== "temporary") {
        return prev;
      }

      return {
        ...prev,
        auto_recovery: {
          ...prev.auto_recovery,
          ban: {
            ...prev.auto_recovery.ban,
            [field]: nextValue,
          },
        },
      };
    });
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

  const failoverStatusCodeInputError = enabledAutoRecovery
    ? getFailoverStatusCodeInputError(enabledAutoRecovery)
    : null;
  const maxCooldownStrikesBeforeBan =
    enabledAutoRecovery && enabledAutoRecovery.ban.mode !== "off"
      ? enabledAutoRecovery.ban.max_cooldown_strikes_before_ban
      : 0;
  const banDurationSeconds =
    enabledAutoRecovery?.ban.mode === "temporary"
      ? enabledAutoRecovery.ban.ban_duration_seconds
      : 0;
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSave();
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

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <input type="hidden" name="strategy_type" value={loadbalanceStrategyForm.strategy_type} />
          <input type="hidden" name="auto_recovery_enabled" value={String(autoRecoveryEnabled)} />
          <div className="space-y-2">
            <Label htmlFor="loadbalance-strategy-name">{dialogMessages.nameLabel}</Label>
            <Input
              id="loadbalance-strategy-name"
              name="name"
              value={loadbalanceStrategyForm.name}
              onChange={(event) =>
                  setLoadbalanceStrategyForm((prev) => ({ ...prev, name: event.target.value }))
                }
              placeholder={dialogMessages.namePlaceholder}
            />
          </div>

          <div className="space-y-2">
              <Label htmlFor="loadbalance-strategy-type">{dialogMessages.strategyTypeLabel}</Label>
              <Select
                value={loadbalanceStrategyForm.strategy_type}
                onValueChange={(value: "single" | "fill-first" | "round-robin" | "failover") =>
                  setLoadbalanceStrategyForm((prev) => setLoadbalanceStrategyType(prev, value))
                }
              >
                <SelectTrigger id="loadbalance-strategy-type">
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
                checked={autoRecoveryEnabled}
                onCheckedChange={(checked) =>
                  setLoadbalanceStrategyForm((prev) => ({
                    ...prev,
                    auto_recovery: checked
                      ? prev.auto_recovery.mode === "enabled"
                        ? prev.auto_recovery
                        : getDefaultEnabledAutoRecoveryDraft()
                      : { mode: "disabled" },
                  }))
                }
              />

              {showRecoveryPolicy ? (
                <>
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
                    name="auto_recovery.cooldown.base_seconds"
                    type="number"
                    min={0}
                    step={1}
                    value={enabledAutoRecovery?.cooldown.base_seconds ?? 60}
                    onChange={(event) =>
                      setNumericField(
                        "base_seconds",
                        parseIntegerInput(
                          event.target.value,
                          enabledAutoRecovery?.cooldown.base_seconds ?? 60,
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
                    name="auto_recovery.cooldown.failure_threshold"
                    type="number"
                    min={1}
                    max={10}
                    step={1}
                    value={enabledAutoRecovery?.cooldown.failure_threshold ?? 2}
                    onChange={(event) =>
                      setNumericField(
                        "failure_threshold",
                        parseIntegerInput(
                          event.target.value,
                          enabledAutoRecovery?.cooldown.failure_threshold ?? 2,
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
                    name="auto_recovery.cooldown.backoff_multiplier"
                    type="number"
                    min={1}
                    max={10}
                    step={0.1}
                    value={enabledAutoRecovery?.cooldown.backoff_multiplier ?? 2}
                    onChange={(event) =>
                      setNumericField(
                        "backoff_multiplier",
                        parseNumericInput(
                          event.target.value,
                          enabledAutoRecovery?.cooldown.backoff_multiplier ?? 2,
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
                    name="auto_recovery.cooldown.max_cooldown_seconds"
                    type="number"
                    min={1}
                    max={86400}
                    step={1}
                    value={enabledAutoRecovery?.cooldown.max_cooldown_seconds ?? 900}
                    onChange={(event) =>
                      setNumericField(
                        "max_cooldown_seconds",
                        parseIntegerInput(
                          event.target.value,
                          enabledAutoRecovery?.cooldown.max_cooldown_seconds ?? 900,
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
                    name="auto_recovery.cooldown.jitter_ratio"
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    value={enabledAutoRecovery?.cooldown.jitter_ratio ?? 0.2}
                    onChange={(event) =>
                      setNumericField(
                        "jitter_ratio",
                        parseNumericInput(
                          event.target.value,
                          enabledAutoRecovery?.cooldown.jitter_ratio ?? 0.2,
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
                        name="auto_recovery.status_code_input"
                        aria-invalid={Boolean(failoverStatusCodeInputError)}
                        aria-describedby={
                          failoverStatusCodeInputError ? "failover-status-code-input-error" : undefined
                        }
                        type="number"
                        min={100}
                        max={599}
                        step={1}
                        value={enabledAutoRecovery?.status_code_input ?? ""}
                        onChange={(event) =>
                          setLoadbalanceStrategyForm((prev) => ({
                            ...prev,
                            auto_recovery:
                              prev.auto_recovery.mode !== "enabled"
                                ? prev.auto_recovery
                                : {
                                    ...prev.auto_recovery,
                                    status_code_input: event.target.value,
                                  },
                          }))
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="sm:self-start"
                        disabled={
                           !(enabledAutoRecovery?.status_code_input ?? "").trim() ||
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
                      {(enabledAutoRecovery?.status_codes ?? []).map((statusCode) => (
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
                      value={enabledAutoRecovery?.ban.mode ?? "off"}
                      onValueChange={(value: "off" | "temporary" | "manual") =>
                        setLoadbalanceStrategyForm((prev) =>
                          setLoadbalanceStrategyBanMode(prev, value),
                        )
                      }
                    >
                      <input
                        type="hidden"
                        name="auto_recovery.ban.mode"
                        value={enabledAutoRecovery?.ban.mode ?? "off"}
                      />
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
                      name="auto_recovery.ban.max_cooldown_strikes_before_ban"
                      type="number"
                      min={0}
                      step={1}
                      value={maxCooldownStrikesBeforeBan}
                      onChange={(event) =>
                        setBanNumericField(
                          "max_cooldown_strikes_before_ban",
                          parseIntegerInput(event.target.value, maxCooldownStrikesBeforeBan),
                        )
                      }
                    />
                  </div>

                  {enabledAutoRecovery?.ban.mode === "temporary" ? (
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
                        name="auto_recovery.ban.ban_duration_seconds"
                        type="number"
                        min={1}
                        step={1}
                        value={banDurationSeconds}
                        onChange={(event) =>
                          setBanNumericField(
                            "ban_duration_seconds",
                            parseIntegerInput(event.target.value, banDurationSeconds),
                          )
                        }
                      />
                    </div>
                  ) : null}
                </div>
              </div>
                </>
              ) : null}
            </>
          ) : (
            <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
              {dialogMessages.singleStrategyHint}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
            {dialogMessages.cancel}
            </Button>
            <Button type="submit" disabled={loadbalanceStrategySaving}>
            {loadbalanceStrategySaving ? dialogMessages.saving : dialogMessages.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
