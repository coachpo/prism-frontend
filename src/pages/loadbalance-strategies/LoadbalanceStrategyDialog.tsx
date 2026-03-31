import { CircleHelp, Plus, X } from "lucide-react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { useLocale } from "@/i18n/useLocale";
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
  addCircuitBreakerStatusCode,
  getCircuitBreakerStatusCodeInputError,
  setLoadbalanceStrategyBanMode,
  removeCircuitBreakerStatusCode,
  type LoadbalanceStrategyFormState,
} from "./loadbalanceStrategyFormState";

function PolicyFieldLabel({
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
  const circuitBreaker = loadbalanceStrategyForm.routing_policy.circuit_breaker;
  const statusCodeInputError = getCircuitBreakerStatusCodeInputError(circuitBreaker);

  const setCircuitBreakerField = (
    field:
      | "base_open_seconds"
      | "failure_threshold"
      | "backoff_multiplier"
      | "max_open_seconds"
      | "jitter_ratio",
    nextValue: number,
  ) => {
    setLoadbalanceStrategyForm((prev) => ({
      ...prev,
      routing_policy: {
        ...prev.routing_policy,
        circuit_breaker: {
          ...prev.routing_policy.circuit_breaker,
          [field]: nextValue,
        },
      },
    }));
  };

  const setBanNumericField = (
    field: "max_open_strikes_before_ban" | "ban_duration_seconds",
    nextValue: number,
  ) => {
    setLoadbalanceStrategyForm((prev) => ({
      ...prev,
      routing_policy: {
        ...prev.routing_policy,
        circuit_breaker: {
          ...prev.routing_policy.circuit_breaker,
          [field]: nextValue,
        },
      },
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
          <input type="hidden" name="routing_policy.kind" value="adaptive" />

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

          <div className="rounded-md border bg-muted/20 p-4">
            <p className="text-sm font-medium">{dialogMessages.adaptivePolicyLabel}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {dialogMessages.adaptivePolicyDescription}
            </p>
          </div>

          <div className="grid gap-4 rounded-md border bg-muted/20 p-4 sm:grid-cols-2">
            <div className="space-y-2">
              <PolicyFieldLabel
                htmlFor="circuit-breaker-base-open-seconds"
                helpAriaLabel={dialogMessages.explainField(dialogMessages.baseCooldownLabel)}
                label={dialogMessages.baseCooldownLabel}
                description={dialogMessages.baseCooldownDescription}
              />
              <Input
                id="circuit-breaker-base-open-seconds"
                name="routing_policy.circuit_breaker.base_open_seconds"
                type="number"
                min={0}
                step={1}
                value={circuitBreaker.base_open_seconds}
                onChange={(event) =>
                  setCircuitBreakerField(
                    "base_open_seconds",
                    parseIntegerInput(event.target.value, circuitBreaker.base_open_seconds),
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <PolicyFieldLabel
                htmlFor="circuit-breaker-failure-threshold"
                helpAriaLabel={dialogMessages.explainField(dialogMessages.failureThresholdLabel)}
                label={dialogMessages.failureThresholdLabel}
                description={dialogMessages.failureThresholdDescription}
              />
              <Input
                id="circuit-breaker-failure-threshold"
                name="routing_policy.circuit_breaker.failure_threshold"
                type="number"
                min={1}
                max={50}
                step={1}
                value={circuitBreaker.failure_threshold}
                onChange={(event) =>
                  setCircuitBreakerField(
                    "failure_threshold",
                    parseIntegerInput(event.target.value, circuitBreaker.failure_threshold),
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <PolicyFieldLabel
                htmlFor="circuit-breaker-backoff-multiplier"
                helpAriaLabel={dialogMessages.explainField(dialogMessages.backoffMultiplierLabel)}
                label={dialogMessages.backoffMultiplierLabel}
                description={dialogMessages.backoffMultiplierDescription}
              />
              <Input
                id="circuit-breaker-backoff-multiplier"
                name="routing_policy.circuit_breaker.backoff_multiplier"
                type="number"
                min={1}
                max={10}
                step={0.1}
                value={circuitBreaker.backoff_multiplier}
                onChange={(event) =>
                  setCircuitBreakerField(
                    "backoff_multiplier",
                    parseNumericInput(event.target.value, circuitBreaker.backoff_multiplier),
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <PolicyFieldLabel
                htmlFor="circuit-breaker-max-open-seconds"
                helpAriaLabel={dialogMessages.explainField(dialogMessages.maxCooldownLabel)}
                label={dialogMessages.maxCooldownLabel}
                description={dialogMessages.maxCooldownDescription}
              />
              <Input
                id="circuit-breaker-max-open-seconds"
                name="routing_policy.circuit_breaker.max_open_seconds"
                type="number"
                min={1}
                max={86400}
                step={1}
                value={circuitBreaker.max_open_seconds}
                onChange={(event) =>
                  setCircuitBreakerField(
                    "max_open_seconds",
                    parseIntegerInput(event.target.value, circuitBreaker.max_open_seconds),
                  )
                }
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <PolicyFieldLabel
                htmlFor="circuit-breaker-jitter-ratio"
                helpAriaLabel={dialogMessages.explainField(dialogMessages.jitterRatioLabel)}
                label={dialogMessages.jitterRatioLabel}
                description={dialogMessages.jitterRatioDescription}
              />
              <Input
                id="circuit-breaker-jitter-ratio"
                name="routing_policy.circuit_breaker.jitter_ratio"
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={circuitBreaker.jitter_ratio}
                onChange={(event) =>
                  setCircuitBreakerField(
                    "jitter_ratio",
                    parseNumericInput(event.target.value, circuitBreaker.jitter_ratio),
                  )
                }
              />
            </div>
          </div>

          <div className="space-y-3 rounded-md border bg-muted/20 p-4">
            <div className="space-y-2">
              <PolicyFieldLabel
                htmlFor="circuit-breaker-status-code-input"
                helpAriaLabel={dialogMessages.explainField(dialogMessages.failureStatusCodesLabel)}
                label={dialogMessages.failureStatusCodesLabel}
                description={dialogMessages.failureStatusCodesDescription}
              />
              <div className="flex gap-2">
                <Input
                  id="circuit-breaker-status-code-input"
                  name="routing_policy.circuit_breaker.failure_status_codes"
                  inputMode="numeric"
                  value={circuitBreaker.status_code_input}
                  onChange={(event) =>
                    setLoadbalanceStrategyForm((prev) => ({
                      ...prev,
                      routing_policy: {
                        ...prev.routing_policy,
                        circuit_breaker: {
                          ...prev.routing_policy.circuit_breaker,
                          status_code_input: event.target.value,
                        },
                      },
                    }))
                  }
                  placeholder="429"
                />
                <Button type="button" variant="outline" onClick={() => setLoadbalanceStrategyForm((prev) => addCircuitBreakerStatusCode(prev))}>
                  <Plus className="mr-2 h-4 w-4" />
                  {dialogMessages.addStatusCode}
                </Button>
              </div>
              {statusCodeInputError ? (
                <p className="text-sm text-destructive">{statusCodeInputError}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {circuitBreaker.failure_status_codes.map((statusCode) => (
                <button
                  key={statusCode}
                  type="button"
                  className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-xs font-medium text-foreground"
                  onClick={() =>
                    setLoadbalanceStrategyForm((prev) =>
                      removeCircuitBreakerStatusCode(prev, statusCode),
                    )
                  }
                  aria-label={dialogMessages.removeStatusCode(statusCode)}
                >
                  <span>{statusCode}</span>
                  <X className="h-3 w-3" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-md border bg-muted/20 p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">{dialogMessages.banEscalationLabel}</p>
              <p className="text-sm text-muted-foreground">{dialogMessages.banEscalationDescription}</p>
            </div>

            <div className="space-y-2">
              <PolicyFieldLabel
                htmlFor="circuit-breaker-ban-mode"
                helpAriaLabel={dialogMessages.explainField(dialogMessages.banModeLabel)}
                label={dialogMessages.banModeLabel}
                description={dialogMessages.banModeDescription}
              />
              <Select
                value={circuitBreaker.ban_mode}
                onValueChange={(value: "off" | "manual" | "temporary") =>
                  setLoadbalanceStrategyForm((prev) => setLoadbalanceStrategyBanMode(prev, value))
                }
              >
                <SelectTrigger id="circuit-breaker-ban-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="off">{dialogMessages.banModeOffOption}</SelectItem>
                  <SelectItem value="manual">{dialogMessages.banModeManualOption}</SelectItem>
                  <SelectItem value="temporary">{dialogMessages.banModeTemporaryOption}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {circuitBreaker.ban_mode !== "off" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <PolicyFieldLabel
                    htmlFor="circuit-breaker-max-open-strikes-before-ban"
                    helpAriaLabel={dialogMessages.explainField(dialogMessages.maxCooldownStrikesBeforeBanLabel)}
                    label={dialogMessages.maxCooldownStrikesBeforeBanLabel}
                    description={dialogMessages.maxCooldownStrikesBeforeBanDescription}
                  />
                  <Input
                    id="circuit-breaker-max-open-strikes-before-ban"
                    name="routing_policy.circuit_breaker.max_open_strikes_before_ban"
                    type="number"
                    min={1}
                    step={1}
                    value={circuitBreaker.max_open_strikes_before_ban}
                    onChange={(event) =>
                      setBanNumericField(
                        "max_open_strikes_before_ban",
                        parseIntegerInput(
                          event.target.value,
                          circuitBreaker.max_open_strikes_before_ban,
                        ),
                      )
                    }
                  />
                </div>

                {circuitBreaker.ban_mode === "temporary" ? (
                  <div className="space-y-2">
                    <PolicyFieldLabel
                      htmlFor="circuit-breaker-ban-duration-seconds"
                      helpAriaLabel={dialogMessages.explainField(dialogMessages.banDurationLabel)}
                      label={dialogMessages.banDurationLabel}
                      description={dialogMessages.banDurationDescription}
                    />
                    <Input
                      id="circuit-breaker-ban-duration-seconds"
                      name="routing_policy.circuit_breaker.ban_duration_seconds"
                      type="number"
                      min={1}
                      step={1}
                      value={circuitBreaker.ban_duration_seconds}
                      onChange={(event) =>
                        setBanNumericField(
                          "ban_duration_seconds",
                          parseIntegerInput(event.target.value, circuitBreaker.ban_duration_seconds),
                        )
                      }
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

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
