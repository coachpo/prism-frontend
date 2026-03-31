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
import type { LoadbalanceStrategy, RoutingObjective } from "@/lib/types";

function getBanSummary(
  circuitBreaker: LoadbalanceStrategy["routing_policy"]["circuit_breaker"],
  copy: {
    banManualDismiss: (strikes: string) => string;
    banOff: string;
    banTemporary: (strikes: string, durationSeconds: string) => string;
  },
  formatNumber: (value: number) => string,
) {
  if (circuitBreaker.ban_mode === "off") {
    return copy.banOff;
  }

  if (circuitBreaker.ban_mode === "temporary") {
    return copy.banTemporary(
      formatNumber(circuitBreaker.max_open_strikes_before_ban),
      formatNumber(circuitBreaker.ban_duration_seconds),
    );
  }

  return copy.banManualDismiss(formatNumber(circuitBreaker.max_open_strikes_before_ban));
}

function getRoutingObjectiveLabel(
  routingObjective: RoutingObjective,
  copy: {
    maximizeAvailabilityLabel: string;
    minimizeLatencyLabel: string;
  },
) {
  return routingObjective === "maximize_availability"
    ? copy.maximizeAvailabilityLabel
    : copy.minimizeLatencyLabel;
}

function getStatusCodeSummary(statusCodes: number[], copy: { statusCodes: (codes: string) => string }) {
  const sortedCodes = [...statusCodes].sort((left, right) => left - right);
  return copy.statusCodes(sortedCodes.join(copy.statusCodes(" ").includes("、") ? "、" : ", "));
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
    adaptiveLabel: messages.loadbalanceStrategyCopy.adaptiveLabel,
    adaptiveSummary: messages.loadbalanceStrategyCopy.adaptiveSummary,
    maximizeAvailabilityLabel: messages.loadbalanceStrategyCopy.maximizeAvailabilityLabel,
    minimizeLatencyLabel: messages.loadbalanceStrategyCopy.minimizeLatencyLabel,
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
                  <TableHead>{tableCopy.objective}</TableHead>
                  <TableHead>{tableCopy.attachedModels}</TableHead>
                  <TableHead className="text-right">{tableCopy.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadbalanceStrategies.map((strategy) => {
                  const isPreparingEdit = loadbalanceStrategyPreparingEditId === strategy.id;
                  const circuitBreaker = strategy.routing_policy.circuit_breaker;

                  return (
                    <TableRow key={strategy.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{strategy.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {strategyCopy.adaptiveSummary}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {tableCopy.thresholdBaseMax(
                              formatNumber(circuitBreaker.failure_threshold),
                              formatNumber(circuitBreaker.base_open_seconds),
                              formatNumber(circuitBreaker.max_open_seconds),
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {tableCopy.backoffJitterStatusCodes(
                              String(circuitBreaker.backoff_multiplier),
                              String(circuitBreaker.jitter_ratio),
                              getStatusCodeSummary(circuitBreaker.failure_status_codes, tableCopy),
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {getBanSummary(circuitBreaker, tableCopy, formatNumber)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <TypeBadge
                          label={strategyCopy.adaptiveLabel}
                          intent="info"
                        />
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={getRoutingObjectiveLabel(strategy.routing_policy.routing_objective, strategyCopy)}
                          intent={
                            strategy.routing_policy.routing_objective === "maximize_availability"
                              ? "accent"
                              : "success"
                          }
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
