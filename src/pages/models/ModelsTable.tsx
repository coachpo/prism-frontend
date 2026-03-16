import { MoreHorizontal, Pencil, Plus, Server, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "@/components/EmptyState";
import { ProviderIcon } from "@/components/ProviderIcon";
import { StatusBadge, TypeBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoneyMicros } from "@/lib/costing";
import type { ModelConfigListItem } from "@/lib/types";
import { cn, formatLabel, formatProviderType } from "@/lib/utils";
import { formatLatencyForDisplay } from "../model-detail/modelDetailMetricsAndPaths";
import type { ModelDerivedMetric } from "./modelTableContracts";

type Props = {
  activeColumns: {
    provider: boolean;
    type: boolean;
    strategy: boolean;
    endpoints: boolean;
    success: boolean;
    p95: boolean;
    requests: boolean;
    spend: boolean;
    status: boolean;
  };
  filtered: ModelConfigListItem[];
  handleOpenDialog: (model?: ModelConfigListItem) => void;
  hasActiveFilters: boolean;
  metricsLoading: boolean;
  modelMetrics24h: Record<number, ModelDerivedMetric>;
  modelSpend30dMicros: Record<number, number>;
  search: string;
  setDeleteTarget: (model: ModelConfigListItem) => void;
};

export function ModelsTable({
  activeColumns,
  filtered,
  handleOpenDialog,
  hasActiveFilters,
  metricsLoading,
  modelMetrics24h,
  modelSpend30dMicros,
  search,
  setDeleteTarget,
}: Props) {
  const navigate = useNavigate();

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon={<Server className="h-6 w-6" />}
        title={hasActiveFilters ? "No models match filters" : "No models configured"}
        description={search ? "Try adjusting your search or filters" : "Create your first model to get started"}
        action={
          !search ? (
            <Button size="sm" onClick={() => handleOpenDialog()}>
              <Plus className="mr-1.5 h-4 w-4" />
              New Model
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Model</TableHead>
          {activeColumns.provider && <TableHead className="hidden sm:table-cell">Provider</TableHead>}
          {activeColumns.type && <TableHead className="hidden md:table-cell">Type</TableHead>}
          {activeColumns.strategy && <TableHead className="hidden lg:table-cell">Strategy</TableHead>}
          {activeColumns.endpoints && <TableHead className="hidden md:table-cell text-center">Endpoints</TableHead>}
          {activeColumns.success && <TableHead className="hidden lg:table-cell text-right">Success (24h)</TableHead>}
          {activeColumns.p95 && <TableHead className="hidden lg:table-cell text-right">P95 (24h)</TableHead>}
          {activeColumns.requests && <TableHead className="hidden lg:table-cell text-right">Requests (24h)</TableHead>}
          {activeColumns.spend && <TableHead className="hidden xl:table-cell text-right">Spend (30d)</TableHead>}
          {activeColumns.status && <TableHead>Status</TableHead>}
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {filtered.map((model) => {
          const metrics24h = modelMetrics24h[model.id];
          const successRate = metrics24h?.success_rate ?? null;
          const requestCount = metrics24h?.request_count_24h ?? 0;
          const p95LatencyMs = metrics24h?.p95_latency_ms ?? null;
          const spend30dMicros = modelSpend30dMicros[model.id] ?? 0;

          return (
            <TableRow
              key={model.id}
              className="cursor-pointer"
              onClick={() => navigate(`/models/${model.id}`)}
            >
              <TableCell>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="sm:hidden">
                      <ProviderIcon providerType={model.provider.provider_type} size={14} />
                    </span>
                    <span className="text-sm font-medium truncate">{model.display_name || model.model_id}</span>
                  </div>
                  {(model.display_name || (model.model_type === "proxy" && model.redirect_to)) && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {model.model_type === "proxy" && model.redirect_to
                        ? `Resolves to ${model.redirect_to}`
                        : model.model_id}
                    </p>
                  )}
                </div>
              </TableCell>

              {activeColumns.provider && (
                <TableCell className="hidden sm:table-cell">
                  <div className="flex items-center gap-1.5">
                    <ProviderIcon providerType={model.provider.provider_type} size={14} />
                    <span className="text-sm">{formatProviderType(model.provider.provider_type)}</span>
                  </div>
                </TableCell>
              )}

              {activeColumns.type && (
                <TableCell className="hidden md:table-cell">
                  {model.model_type === "proxy" ? (
                    <div className="flex items-center">
                      <TypeBadge label="Proxy" intent="accent" />
                    </div>
                  ) : (
                    <TypeBadge label="Native" intent="info" />
                  )}
                </TableCell>
              )}

              {activeColumns.strategy && (
                <TableCell className="hidden lg:table-cell">
                  <span className="text-xs text-muted-foreground">{formatLabel(model.lb_strategy)}</span>
                </TableCell>
              )}

              {activeColumns.endpoints && (
                <TableCell className="hidden md:table-cell text-center">
                  <span className="text-sm tabular-nums">{model.active_connection_count}/{model.connection_count}</span>
                </TableCell>
              )}

              {activeColumns.success && (
                <TableCell className="hidden lg:table-cell text-right">
                  {metricsLoading && !metrics24h ? (
                    <span className="text-sm tabular-nums text-muted-foreground">...</span>
                  ) : (
                    <span
                      className={cn(
                        "text-sm tabular-nums",
                        successRate === null
                          ? "text-muted-foreground"
                          : successRate >= 95
                            ? "text-emerald-600 dark:text-emerald-400"
                            : successRate >= 80
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-red-600 dark:text-red-400"
                      )}
                    >
                      {successRate === null ? "-" : `${successRate.toFixed(1)}%`}
                    </span>
                  )}
                </TableCell>
              )}

              {activeColumns.p95 && (
                <TableCell className="hidden lg:table-cell text-right text-sm tabular-nums text-muted-foreground">
                  {metricsLoading ? "..." : formatLatencyForDisplay(p95LatencyMs)}
                </TableCell>
              )}

              {activeColumns.requests && (
                <TableCell className="hidden lg:table-cell text-right text-sm tabular-nums text-muted-foreground">
                  {metricsLoading && !metrics24h ? "..." : requestCount > 0 ? requestCount.toLocaleString() : "-"}
                </TableCell>
              )}

              {activeColumns.spend && (
                <TableCell className="hidden xl:table-cell text-right text-sm tabular-nums">
                  {metricsLoading ? "..." : formatMoneyMicros(spend30dMicros, "$", undefined, 2, 6)}
                </TableCell>
              )}

              {activeColumns.status && (
                <TableCell>
                  <StatusBadge
                    label={model.is_enabled ? "On" : "Off"}
                    intent={model.is_enabled ? "success" : "muted"}
                  />
                </TableCell>
              )}

              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={() => handleOpenDialog(model)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeleteTarget(model)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
