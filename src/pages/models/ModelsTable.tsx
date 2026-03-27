import { useMemo, useState } from "react";
import { ChevronDown, Eye, Plus, Server, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { CopyButton } from "@/components/CopyButton";
import { EmptyState } from "@/components/EmptyState";
import { VendorIcon } from "@/components/VendorIcon";
import { useLocale } from "@/i18n/useLocale";
import {
  IconActionButton,
  IconActionGroup,
} from "@/components/IconActionGroup";
import { StatusBadge, TypeBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { formatMoneyMicros } from "@/lib/costing";
import type { ModelConfigListItem } from "@/lib/types";
import { cn, formatApiFamily } from "@/lib/utils";
import { formatLatencyForDisplay } from "../model-detail/modelDetailMetricsAndPaths";
import type { ModelDerivedMetric } from "./modelTableContracts";

const TYPE_ORDER: ModelConfigListItem["model_type"][] = ["native", "proxy"];
const UNKNOWN_VENDOR_KEY = "unknown-vendor";
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

type Props = {
  filtered: ModelConfigListItem[];
  handleOpenDialog: (model?: ModelConfigListItem) => void;
  metricsLoading: boolean;
  modelMetrics24h: Record<number, ModelDerivedMetric>;
  modelSpend30dMicros: Record<number, number>;
  search: string;
  setDeleteTarget: (model: ModelConfigListItem) => void;
};

type SharedRenderProps = Pick<
  Props,
  | "metricsLoading"
  | "modelMetrics24h"
  | "modelSpend30dMicros"
  | "setDeleteTarget"
> & {
  onNavigate: (modelId: number) => void;
};

type VendorGroup = {
  groupKey: string;
  models: ModelConfigListItem[];
  vendor: {
    key?: string | null;
    name?: string | null;
    icon_key?: string | null;
  };
  vendorLabel: string;
  isUnknown: boolean;
};

function resolveApiFamily(model: ModelConfigListItem) {
  return model.api_family ?? "openai";
}

function getUnknownVendorLabel(locale: "en" | "zh-CN") {
  return locale === "zh-CN" ? "未知供应商" : "Unknown vendor";
}

function isUnknownVendor(model: ModelConfigListItem) {
  return !model.vendor || model.vendor.key === UNKNOWN_VENDOR_KEY || model.vendor.name === "Unknown vendor";
}

function resolveVendorName(model: ModelConfigListItem, locale: "en" | "zh-CN") {
  if (isUnknownVendor(model)) {
    return getUnknownVendorLabel(locale);
  }

  return model.vendor?.name?.trim() || model.vendor?.key?.trim() || getUnknownVendorLabel(locale);
}

function orderVendorModels(models: ModelConfigListItem[]) {
  return TYPE_ORDER.flatMap((modelType) =>
    STATUS_ORDER.flatMap(({ matches }) => models.filter((model) => model.model_type === modelType && matches(model)))
  );
}

function groupModels(filtered: ModelConfigListItem[], locale: "en" | "zh-CN"): VendorGroup[] {
  const groups = new Map<string, VendorGroup>();

  filtered.forEach((model) => {
    const unknown = isUnknownVendor(model);
    const vendorLabel = resolveVendorName(model, locale);
    const vendor = unknown
      ? { key: UNKNOWN_VENDOR_KEY, name: vendorLabel, icon_key: null }
      : {
          key: model.vendor?.key,
          name: model.vendor?.name,
          icon_key: model.vendor?.icon_key,
        };
    const vendorIdentity = unknown
      ? UNKNOWN_VENDOR_KEY
      : model.vendor?.id
        ? `vendor:${model.vendor.id}`
        : `vendor:${model.vendor?.key ?? model.vendor?.name ?? vendorLabel}`;

    const existingGroup = groups.get(vendorIdentity);
    if (existingGroup) {
      existingGroup.models.push(model);
      return;
    }

    groups.set(vendorIdentity, {
      groupKey: vendorIdentity,
      models: [model],
      vendor,
      vendorLabel,
      isUnknown: unknown,
    });
  });

  return [...groups.values()]
    .sort((left, right) => {
      if (left.isUnknown !== right.isUnknown) {
        return left.isUnknown ? 1 : -1;
      }

      return left.vendorLabel.localeCompare(right.vendorLabel);
    })
    .map((group) => ({
      ...group,
      models: orderVendorModels(group.models),
    }));
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

function CompactMetaBadge({ children }: { children: string }) {
  return (
    <Badge
      variant="outline"
      className="h-5 max-w-full rounded-full border-border/70 bg-muted/30 px-2 text-[10px] font-medium text-muted-foreground"
    >
      <span className="block max-w-full truncate">{children}</span>
    </Badge>
  );
}

function InlineMetaDivider() {
  return (
    <span aria-hidden="true" className="text-muted-foreground/45">
      |
    </span>
  );
}

function getProxyTargetSummary(model: ModelConfigListItem, locale: "en" | "zh-CN") {
  const proxyTargets = model.proxy_targets ?? [];
  const firstTarget = proxyTargets[0]?.target_model_id;

  if (!firstTarget) {
    return locale === "zh-CN" ? "未配置代理目标" : "No proxy targets";
  }

  return locale === "zh-CN"
    ? `${proxyTargets.length} 个目标 · 首选 ${firstTarget}`
    : `${proxyTargets.length} targets · ${firstTarget} first`;
}

function ModelRow({
  metricsLoading,
  model,
  modelMetrics24h,
  modelSpend30dMicros,
  onNavigate,
  setDeleteTarget,
}: SharedRenderProps & { model: ModelConfigListItem }) {
  const { locale, messages } = useLocale();
  const strategyCopy = messages.loadbalanceStrategyCopy;
  const metrics24h = modelMetrics24h[model.id];
  const successRate = metrics24h?.success_rate ?? null;
  const requestCount = metrics24h?.request_count_24h ?? 0;
  const p95LatencyMs = metrics24h?.p95_latency_ms ?? null;
  const spend30dMicros = modelSpend30dMicros[model.id] ?? 0;
  const title = model.display_name || model.model_id;
  const proxyTargetSummary = getProxyTargetSummary(model, locale as "en" | "zh-CN");
  const apiFamilyLabel = formatApiFamily(resolveApiFamily(model));
  const vendorLabel = resolveVendorName(model, locale as "en" | "zh-CN");
  const typeLabel = model.model_type === "proxy" ? (locale === "zh-CN" ? "代理" : "Proxy") : locale === "zh-CN" ? "原生" : "Native";
  const typeIntent = model.model_type === "proxy" ? "accent" : "info";
  const statusLabel = model.is_enabled ? (locale === "zh-CN" ? "已启用" : "Enabled") : locale === "zh-CN" ? "已禁用" : "Disabled";
  const statusIntent = model.is_enabled ? "success" : "muted";
  const showModelId = Boolean(model.display_name && model.display_name !== model.model_id);
  const strategySummary = model.loadbalance_strategy
    ? model.loadbalance_strategy.strategy_type === "fill-first"
      ? `${model.loadbalance_strategy.name} · ${strategyCopy.fillFirstSummary}`
      : model.loadbalance_strategy.strategy_type === "round-robin"
        ? `${model.loadbalance_strategy.name} · ${strategyCopy.roundRobinSummary}`
      : model.loadbalance_strategy.strategy_type === "failover"
        ? `${model.loadbalance_strategy.name} · ${strategyCopy.failoverSummary}`
        : `${model.loadbalance_strategy.name} · ${strategyCopy.singleLabel}`
    : locale === "zh-CN"
      ? "未配置策略"
      : "Strategy not configured";
  const successRateText =
    metricsLoading && !metrics24h
      ? locale === "zh-CN"
        ? "… 成功率"
        : "… success"
      : successRate === null
        ? locale === "zh-CN"
          ? "— 成功率"
          : "— success"
        : `${successRate.toFixed(1)}% ${locale === "zh-CN" ? "成功率" : "success"}`;
  const p95LatencyText =
    metricsLoading
      ? locale === "zh-CN"
        ? "… P95"
        : "… p95"
      : `${formatLatencyForDisplay(p95LatencyMs)} ${locale === "zh-CN" ? "P95" : "p95"}`;
  const requestCountText =
    metricsLoading && !metrics24h
      ? locale === "zh-CN"
        ? "… 请求"
        : "… req"
      : requestCount > 0
        ? `${requestCount.toLocaleString()} ${locale === "zh-CN" ? "请求" : "req"}`
        : locale === "zh-CN"
          ? "— 请求"
          : "— req";
  const spend30dText =
    metricsLoading
      ? locale === "zh-CN"
        ? "… 支出"
        : "… spend"
      : `${formatMoneyMicros(spend30dMicros, "$", undefined, 2, 6, locale as "en" | "zh-CN")} ${locale === "zh-CN" ? "支出" : "spend"}`;

  return (
    <div className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/25">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <Link
            to={`/models/${model.id}`}
            className="min-w-0 max-w-full truncate rounded-md text-base font-semibold text-foreground outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/50"
            title={title}
          >
            {title}
          </Link>
          {showModelId ? (
            <span className="truncate font-mono text-xs text-muted-foreground" title={model.model_id}>
              {model.model_id}
            </span>
          ) : null}
          <CopyButton
            aria-label={`Copy model ID ${model.model_id}`}
            className="h-5 w-5 rounded-md text-muted-foreground hover:text-foreground"
            errorMessage="Failed to copy model id"
            label=""
            size="icon-xs"
            successMessage="Model ID copied to clipboard"
            targetLabel="Model ID"
            value={model.model_id}
          />
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {model.model_type === "proxy" ? (
              <CompactMetaBadge>{proxyTargetSummary}</CompactMetaBadge>
            ) : null}

            {model.model_type === "native" ? <CompactMetaBadge>{strategySummary}</CompactMetaBadge> : null}
            <CompactMetaBadge>{vendorLabel}</CompactMetaBadge>
            <CompactMetaBadge>{apiFamilyLabel}</CompactMetaBadge>
            <TypeBadge label={typeLabel} intent={typeIntent} />
            <StatusBadge label={statusLabel} intent={statusIntent} />
          </div>

          <InlineMetaDivider />
          <span className="tabular-nums text-xs text-foreground/90">
            {model.active_connection_count}/{model.connection_count} {locale === "zh-CN" ? "活跃" : "active"}
          </span>
          <InlineMetaDivider />
          <span
            className={cn(
              "tabular-nums text-xs",
              metricsLoading && !metrics24h ? "text-muted-foreground" : getSuccessRateClass(successRate)
            )}
          >
            {successRateText}
          </span>
          <InlineMetaDivider />
          <span className="tabular-nums text-xs text-muted-foreground">{p95LatencyText}</span>
          <InlineMetaDivider />
          <span className="tabular-nums text-xs text-muted-foreground">{requestCountText}</span>
          <InlineMetaDivider />
          <span className="tabular-nums text-xs text-foreground/90">{spend30dText}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2 pt-0.5">
        <IconActionGroup>
          <IconActionButton
            aria-label={`View model details for ${title}`}
            size="icon-sm"
            onClick={() => onNavigate(model.id)}
          >
            <Eye className="h-3.5 w-3.5" />
          </IconActionButton>
          <IconActionButton
            aria-label={`Delete model ${title}`}
            size="icon-sm"
            destructive
            onClick={() => setDeleteTarget(model)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </IconActionButton>
        </IconActionGroup>
      </div>
    </div>
  );
}

function VendorSection({
  group,
  isExpanded,
  metricsLoading,
  modelMetrics24h,
  modelSpend30dMicros,
  onNavigate,
  onOpenChange,
  search,
  setDeleteTarget,
}: SharedRenderProps & {
  group: VendorGroup;
  isExpanded: boolean;
  onOpenChange: (isOpen: boolean) => void;
  search: string;
}) {
  const { locale } = useLocale();
  const modelCountLabel =
    locale === "zh-CN"
      ? `${group.models.length} ${group.models.length === 1 ? "个模型" : "个模型"}`
      : `${group.models.length} ${group.models.length === 1 ? "model" : "models"}`;
  const isSearchActive = search.trim().length > 0;

  return (
    <Collapsible open={isExpanded} onOpenChange={onOpenChange}>
      <Card className="gap-0 overflow-hidden border-border/70 bg-card py-0 shadow-none">
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            disabled={isSearchActive}
            className="h-auto w-full justify-between gap-3 rounded-none px-4 py-3 hover:bg-muted/30 disabled:cursor-default disabled:opacity-100 disabled:hover:bg-transparent"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/35 text-foreground">
                <VendorIcon vendor={group.vendor} size={18} decorative />
              </div>

              <div className="min-w-0 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{group.vendorLabel}</span>
                  <Badge
                    variant="outline"
                    className="rounded-full bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground"
                  >
                    {modelCountLabel}
                  </Badge>
                </div>
              </div>
            </div>

            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                isExpanded && "rotate-180"
              )}
            />
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="border-t border-border/60">
          <div className="divide-y divide-border/60">
            {group.models.map((model) => (
              <ModelRow
                key={model.id}
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
      </Card>
    </Collapsible>
  );
}

export function ModelsTable({
  filtered,
  handleOpenDialog,
  metricsLoading,
  modelMetrics24h,
  modelSpend30dMicros,
  search,
  setDeleteTarget,
}: Props) {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const vendorGroups = useMemo(() => groupModels(filtered, locale as "en" | "zh-CN"), [filtered, locale]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon={<Server className="h-6 w-6" />}
        title={
          locale === "zh-CN"
            ? search
              ? "没有匹配的模型"
              : "还没有配置模型"
            : search
              ? "No models match search"
              : "No models configured"
        }
        description={
          locale === "zh-CN"
            ? search
              ? "请尝试不同的模型名称或模型 ID"
              : "创建你的第一个模型以开始使用"
            : search
              ? "Try a different model name or ID"
              : "Create your first model to get started"
        }
        action={
          !search ? (
            <Button size="sm" onClick={() => handleOpenDialog()}>
              <Plus className="mr-1.5 h-4 w-4" />
              {locale === "zh-CN" ? "新建模型" : "New Model"}
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="grid gap-3 p-4">
      {vendorGroups.map((group) => (
        <VendorSection
          key={group.groupKey}
          group={group}
          isExpanded={search.trim().length > 0 || (expandedGroups[group.groupKey] ?? true)}
          metricsLoading={metricsLoading}
          modelMetrics24h={modelMetrics24h}
          modelSpend30dMicros={modelSpend30dMicros}
          onNavigate={(modelId) => navigate(`/models/${modelId}`)}
          onOpenChange={(isOpen) =>
            setExpandedGroups((currentState) => ({
              ...currentState,
              [group.groupKey]: isOpen,
            }))
          }
          search={search}
          setDeleteTarget={setDeleteTarget}
        />
      ))}
    </div>
  );
}
