import type { KeyboardEvent, ReactNode } from "react";
import { useState } from "react";
import { ChevronRight, MoreHorizontal, Pencil, Plus, Server, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "@/components/EmptyState";
import { ProviderIcon } from "@/components/ProviderIcon";
import { StatusBadge, TypeBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatMoneyMicros } from "@/lib/costing";
import type { ModelConfigListItem } from "@/lib/types";
import { cn, formatLabel, formatProviderType } from "@/lib/utils";
import { formatLatencyForDisplay } from "../model-detail/modelDetailMetricsAndPaths";
import type { ModelDerivedMetric } from "./modelTableContracts";

const PROVIDER_ORDER = ["openai", "anthropic", "gemini"] as const;
const TYPE_ORDER: ModelConfigListItem["model_type"][] = ["native", "proxy"];
const STATUS_ORDER = [
  {
    key: "enabled",
    matches: (model: ModelConfigListItem) => model.is_enabled,
  },
  {
    key: "disabled",
    matches: (model: ModelConfigListItem) => !model.is_enabled,
  },
] as const;

type GroupedProvider = {
  providerType: string;
  models: ModelConfigListItem[];
};

type SharedRenderProps = Pick<
  Props,
  "activeColumns" | "handleOpenDialog" | "metricsLoading" | "modelMetrics24h" | "modelSpend30dMicros" | "setDeleteTarget"
> & {
  onNavigate: (modelId: number) => void;
};

const cardActionButtonClassName =
  "h-8 w-8 shrink-0 rounded-full border border-transparent bg-background/80 text-muted-foreground transition-colors hover:border-border hover:bg-background hover:text-foreground";

function pluralizeModels(count: number) {
  return `${count} model${count === 1 ? "" : "s"}`;
}

function getProviderSortIndex(providerType: string) {
  const index = PROVIDER_ORDER.indexOf(providerType as (typeof PROVIDER_ORDER)[number]);
  return index === -1 ? PROVIDER_ORDER.length : index;
}

function groupModels(filtered: ModelConfigListItem[]): GroupedProvider[] {
  const providerTypes = [...new Set(filtered.map((model) => model.provider.provider_type))].sort((left, right) => {
    const leftIndex = getProviderSortIndex(left);
    const rightIndex = getProviderSortIndex(right);

    if (leftIndex !== rightIndex) {
      return leftIndex - rightIndex;
    }

    return left.localeCompare(right);
  });

  return providerTypes
    .map((providerType) => {
      const providerModels = filtered.filter((model) => model.provider.provider_type === providerType);
      const orderedModels = TYPE_ORDER.flatMap((modelType) =>
        STATUS_ORDER.flatMap(({ matches }) =>
          providerModels.filter((model) => model.model_type === modelType && matches(model))
        )
      );

      return {
        providerType,
        models: orderedModels,
      };
    })
    .filter((providerGroup) => providerGroup.models.length > 0);
}

function getSuccessRateClass(successRate: number | null) {
  return cn(
    successRate === null
      ? "text-muted-foreground"
      : successRate >= 95
        ? "text-emerald-600 dark:text-emerald-400"
        : successRate >= 80
          ? "text-amber-600 dark:text-amber-400"
          : "text-red-600 dark:text-red-400"
  );
}

function DetailTile({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/80 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <div className={cn("mt-1 text-sm font-medium text-foreground", valueClassName)}>{value}</div>
    </div>
  );
}

function ModelCard({
  activeColumns,
  handleOpenDialog,
  metricsLoading,
  model,
  modelMetrics24h,
  modelSpend30dMicros,
  onNavigate,
  setDeleteTarget,
}: SharedRenderProps & { model: ModelConfigListItem }) {
  const metrics24h = modelMetrics24h[model.id];
  const successRate = metrics24h?.success_rate ?? null;
  const requestCount = metrics24h?.request_count_24h ?? 0;
  const p95LatencyMs = metrics24h?.p95_latency_ms ?? null;
  const spend30dMicros = modelSpend30dMicros[model.id] ?? 0;
  const detailTiles: Array<{ label: string; value: ReactNode; valueClassName?: string }> = [];
  const showInlineMetadata = activeColumns.type || activeColumns.status;
  const typeLabel = model.model_type === "proxy" ? "Proxy" : "Native";
  const typeIntent = model.model_type === "proxy" ? "accent" : "info";
  const statusLabel = model.is_enabled ? "Enabled" : "Disabled";
  const statusIntent = model.is_enabled ? "success" : "muted";

  if (model.model_type === "proxy" && model.redirect_to) {
    detailTiles.push({
      label: "Target",
      value: <span className="font-mono text-[13px]">{model.redirect_to}</span>,
    });
  }

  if (activeColumns.strategy && model.model_type === "native" && model.loadbalance_strategy) {
    detailTiles.push({
      label: "Strategy",
      value: (
        <div className="space-y-0.5">
          <p>{model.loadbalance_strategy.name}</p>
          <p className="text-xs font-normal text-muted-foreground">
            {formatLabel(model.loadbalance_strategy.strategy_type)}
          </p>
        </div>
      ),
    });
  }

  if (activeColumns.endpoints) {
    detailTiles.push({
      label: "Connections",
      value: (
        <span className="tabular-nums">
          {model.active_connection_count}/{model.connection_count}
        </span>
      ),
    });
  }

  if (activeColumns.success) {
    detailTiles.push({
      label: "Success · 24h",
      value: metricsLoading && !metrics24h ? "..." : successRate === null ? "-" : `${successRate.toFixed(1)}%`,
      valueClassName: metricsLoading && !metrics24h ? "text-muted-foreground" : getSuccessRateClass(successRate),
    });
  }

  if (activeColumns.p95) {
    detailTiles.push({
      label: "P95 · 24h",
      value: metricsLoading ? "..." : formatLatencyForDisplay(p95LatencyMs),
      valueClassName: "tabular-nums text-muted-foreground",
    });
  }

  if (activeColumns.requests) {
    detailTiles.push({
      label: "Requests · 24h",
      value: metricsLoading && !metrics24h ? "..." : requestCount > 0 ? requestCount.toLocaleString() : "-",
      valueClassName: "tabular-nums text-muted-foreground",
    });
  }

  if (activeColumns.spend) {
    detailTiles.push({
      label: "Spend · 30d",
      value: metricsLoading ? "..." : formatMoneyMicros(spend30dMicros, "$", undefined, 2, 6),
      valueClassName: "tabular-nums",
    });
  }

  const title = model.display_name || model.model_id;
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) {
      return;
    }

    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    onNavigate(model.id);
  };

  return (
    <Card
      role="link"
      tabIndex={0}
      className="relative gap-0 overflow-hidden border-border/70 bg-gradient-to-br from-card via-card to-muted/20 shadow-none transition-[border-color,box-shadow,transform] hover:border-primary/20 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      onClick={() => onNavigate(model.id)}
      onKeyDown={handleKeyDown}
    >
      <div className="absolute right-3 top-3 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(event) => event.stopPropagation()}>
            <Button
              aria-label={`Open actions for ${title}`}
              variant="ghost"
              size="icon"
              className={cardActionButtonClassName}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
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
      </div>

      <div className="flex flex-col gap-4 p-4 pr-14">
        <div className="min-w-0 space-y-1.5">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-foreground" title={title}>
              {title}
            </h3>
            <p className="truncate font-mono text-[11px] text-muted-foreground" title={model.model_id}>
              {model.model_id}
            </p>
          </div>

          {showInlineMetadata ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {activeColumns.type ? <TypeBadge label={typeLabel} intent={typeIntent} /> : null}
              {activeColumns.status ? <StatusBadge label={statusLabel} intent={statusIntent} /> : null}
            </div>
          ) : null}
        </div>

        {detailTiles.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">
            {detailTiles.map((tile) => (
              <DetailTile
                key={tile.label}
                label={tile.label}
                value={tile.value}
                valueClassName={tile.valueClassName}
              />
            ))}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function ProviderSection({
  activeColumns,
  group,
  handleOpenDialog,
  metricsLoading,
  modelMetrics24h,
  modelSpend30dMicros,
  onNavigate,
  setDeleteTarget,
}: SharedRenderProps & { group: GroupedProvider }) {
  const [open, setOpen] = useState(true);
  const enabledCount = group.models.filter((model) => model.is_enabled).length;
  const proxyCount = group.models.filter((model) => model.model_type === "proxy").length;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <section>
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/20">
          <div className="flex min-w-0 items-center gap-3">
            <ChevronRight className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-90")} />
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/35 text-foreground">
              <ProviderIcon providerType={group.providerType} size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">{formatProviderType(group.providerType)}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {pluralizeModels(group.models.length)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {enabledCount} enabled • {proxyCount} proxy
              </p>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="border-t bg-muted/10">
          <div className="grid gap-3 px-5 py-4 lg:grid-cols-2 2xl:grid-cols-3">
            {group.models.map((model) => (
              <ModelCard
                key={model.id}
                activeColumns={activeColumns}
                handleOpenDialog={handleOpenDialog}
                metricsLoading={metricsLoading}
                model={model}
                modelMetrics24h={modelMetrics24h}
                modelSpend30dMicros={modelSpend30dMicros}
                onNavigate={onNavigate}
                setDeleteTarget={setDeleteTarget}
              />
            ))}
          </div>
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}

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
  const groups = groupModels(filtered);

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
    <div className="divide-y">
      {groups.map((group) => (
        <ProviderSection
          key={group.providerType}
          activeColumns={activeColumns}
          group={group}
          handleOpenDialog={handleOpenDialog}
          metricsLoading={metricsLoading}
          modelMetrics24h={modelMetrics24h}
          modelSpend30dMicros={modelSpend30dMicros}
          onNavigate={(modelId) => navigate(`/models/${modelId}`)}
          setDeleteTarget={setDeleteTarget}
        />
      ))}
    </div>
  );
}
