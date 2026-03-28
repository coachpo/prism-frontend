import { Loader2, Pencil, Plus, Scale, Trash2 } from "lucide-react";
import { IconActionButton, IconActionGroup } from "@/components/IconActionGroup";
import { useLocale } from "@/i18n/useLocale";
import { StatusBadge, TypeBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LoadbalanceStrategy } from "@/lib/types";

function getBanSummary(
  strategy: LoadbalanceStrategy,
  copy: {
    banManualDismiss: (strikes: string) => string;
    banOff: string;
    banTemporary: (strikes: string, durationSeconds: string) => string;
  },
  formatNumber: (value: number) => string,
) {
  if (strategy.failover_ban_mode === "off") {
    return copy.banOff;
  }

  if (strategy.failover_ban_mode === "temporary") {
    return copy.banTemporary(
      formatNumber(strategy.failover_max_cooldown_strikes_before_ban),
      formatNumber(strategy.failover_ban_duration_seconds),
    );
  }

  return copy.banManualDismiss(formatNumber(strategy.failover_max_cooldown_strikes_before_ban));
}

function getStrategyLabel(
  strategyType: LoadbalanceStrategy["strategy_type"],
  copy: {
    failoverLabel: string;
    fillFirstLabel: string;
    roundRobinLabel: string;
    singleLabel: string;
  },
) {
  if (strategyType === "fill-first") {
    return copy.fillFirstLabel;
  }

  if (strategyType === "round-robin") {
    return copy.roundRobinLabel;
  }

  if (strategyType === "failover") {
    return copy.failoverLabel;
  }

  return copy.singleLabel;
}

function getStatusCodeSummary(
  statusCodes: number[],
  copy: { statusCodes: (codes: string) => string },
) {
  const sortedCodes = [...statusCodes].sort((left, right) => left - right);
  return copy.statusCodes(sortedCodes.join(copy.statusCodes(" ").includes("、") ? "、" : ", "));
}

function getStrategySummary(
  strategyType: LoadbalanceStrategy["strategy_type"],
  copy: {
    failoverSummary: string;
    fillFirstSummary: string;
    roundRobinSummary: string;
    singleSummary: string;
  },
) {
  if (strategyType === "fill-first") {
    return copy.fillFirstSummary;
  }

  if (strategyType === "round-robin") {
    return copy.roundRobinSummary;
  }

  if (strategyType === "failover") {
    return copy.failoverSummary;
  }

  return copy.singleSummary;
}

interface LoadbalanceStrategiesTableProps {
  loadbalanceStrategies: LoadbalanceStrategy[];
  loadbalanceStrategiesLoading: boolean;
  loadbalanceStrategyPreparingEditId: number | null;
  onCreate: () => void;
  onDelete: (strategy: LoadbalanceStrategy) => void;
  onEdit: (strategy: LoadbalanceStrategy) => Promise<void>;
}

export function LoadbalanceStrategiesTable({
  loadbalanceStrategies,
  loadbalanceStrategiesLoading,
  loadbalanceStrategyPreparingEditId,
  onCreate,
  onDelete,
  onEdit,
}: LoadbalanceStrategiesTableProps) {
  const { formatNumber, messages } = useLocale();
  const tableCopy = messages.loadbalanceStrategiesTable;
  const strategyCopy = {
    failoverLabel: messages.loadbalanceStrategyCopy.failoverLabel,
    failoverSummary: messages.loadbalanceStrategyCopy.failoverSummary,
    fillFirstLabel: messages.loadbalanceStrategyCopy.fillFirstLabel,
    fillFirstSummary: messages.loadbalanceStrategyCopy.fillFirstSummary,
    roundRobinLabel: messages.loadbalanceStrategyCopy.roundRobinLabel,
    roundRobinSummary: messages.loadbalanceStrategyCopy.roundRobinSummary,
    singleLabel: messages.loadbalanceStrategyCopy.singleLabel,
    singleSummary: messages.loadbalanceStrategyCopy.singleSummary,
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Scale className="h-4 w-4" />
              {tableCopy.title}
            </CardTitle>
            <CardDescription className="text-xs">
              {tableCopy.description}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" onClick={onCreate}>
              <Plus className="mr-2 h-3.5 w-3.5" />
              {tableCopy.addStrategy}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loadbalanceStrategiesLoading ? (
          <div className="space-y-2">
            <div className="h-12 animate-pulse rounded-md bg-muted/50" />
            <div className="h-12 animate-pulse rounded-md bg-muted/50" />
          </div>
        ) : loadbalanceStrategies.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">
              {tableCopy.noStrategiesConfigured}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
                <TableHeader>
                  <TableRow>
                  <TableHead>{tableCopy.name}</TableHead>
                  <TableHead>{tableCopy.type}</TableHead>
                  <TableHead>{tableCopy.recovery}</TableHead>
                  <TableHead>{tableCopy.attachedModels}</TableHead>
                  <TableHead className="text-right">{tableCopy.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadbalanceStrategies.map((strategy) => {
                  const isPreparingEdit = loadbalanceStrategyPreparingEditId === strategy.id;

                  return (
                    <TableRow key={strategy.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{strategy.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {getStrategySummary(strategy.strategy_type, strategyCopy)}
                          </span>
                          {strategy.strategy_type !== "single" ? (
                            <>
                              <span className="text-xs text-muted-foreground">
                                {tableCopy.thresholdBaseMax(
                                  formatNumber(strategy.failover_failure_threshold),
                                  formatNumber(strategy.failover_cooldown_seconds),
                                  formatNumber(strategy.failover_max_cooldown_seconds),
                                )}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {tableCopy.backoffJitterStatusCodes(
                                  String(strategy.failover_backoff_multiplier),
                                  String(strategy.failover_jitter_ratio),
                                  getStatusCodeSummary(strategy.failover_status_codes, tableCopy),
                                )}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {getBanSummary(strategy, tableCopy, formatNumber)}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <TypeBadge
                          label={getStrategyLabel(strategy.strategy_type, strategyCopy)}
                          intent={strategy.strategy_type === "single" ? "info" : "accent"}
                        />
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={
                            strategy.failover_recovery_enabled ? tableCopy.enabled : tableCopy.disabled
                          }
                          intent={strategy.failover_recovery_enabled ? "success" : "muted"}
                        />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm tabular-nums">{formatNumber(strategy.attached_model_count)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <IconActionGroup>
                            <IconActionButton
                              size="icon"
                              disabled={isPreparingEdit}
                              onClick={() => {
                                void onEdit(strategy);
                              }}
                            >
                              {isPreparingEdit ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Pencil className="h-4 w-4" />
                              )}
                              <span className="sr-only">{tableCopy.edit}</span>
                            </IconActionButton>
                            <IconActionButton
                              size="icon"
                              destructive
                              onClick={() => onDelete(strategy)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">{messages.settingsDialogs.delete}</span>
                            </IconActionButton>
                          </IconActionGroup>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
