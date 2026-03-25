import { Loader2, Pencil, Plus, Scale, Trash2 } from "lucide-react";
import { IconActionButton, IconActionGroup } from "@/components/IconActionGroup";
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
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Scale className="h-4 w-4" />
              Loadbalance Strategies
            </CardTitle>
            <CardDescription className="text-xs">
              Reuse strategy definitions across native models instead of configuring failover per model.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" onClick={onCreate}>
              <Plus className="mr-2 h-3.5 w-3.5" />
              Add Strategy
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
            <p className="text-sm text-muted-foreground">No loadbalance strategies configured.</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Recovery</TableHead>
                  <TableHead>Attached Models</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                            {strategy.strategy_type === "failover"
                              ? "Priority order with optional recovery"
                              : "Single active connection"
                            }
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <TypeBadge
                          label={strategy.strategy_type}
                          intent={strategy.strategy_type === "failover" ? "accent" : "info"}
                        />
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={strategy.failover_recovery_enabled ? "Enabled" : "Disabled"}
                          intent={strategy.failover_recovery_enabled ? "success" : "muted"}
                        />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm tabular-nums">{strategy.attached_model_count}</span>
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
                              <span className="sr-only">Edit</span>
                            </IconActionButton>
                            <IconActionButton
                              size="icon"
                              destructive
                              onClick={() => onDelete(strategy)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
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
