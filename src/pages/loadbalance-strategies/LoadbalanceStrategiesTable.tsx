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

function getBanSummary(strategy: LoadbalanceStrategy, locale: "en" | "zh-CN") {
  if (strategy.failover_ban_mode === "off") {
    return locale === "zh-CN" ? "封禁 关闭" : "Ban off";
  }

  if (strategy.failover_ban_mode === "temporary") {
    return locale === "zh-CN"
      ? `封禁 临时 • 最大冷却 ${strategy.failover_max_cooldown_strikes_before_ban} 次 • ${strategy.failover_ban_duration_seconds}秒`
      : `Ban temporary • ${strategy.failover_max_cooldown_strikes_before_ban} max-cooldown strikes • ${strategy.failover_ban_duration_seconds}s`;
  }

  return locale === "zh-CN"
    ? `封禁 手动解除 • 最大冷却 ${strategy.failover_max_cooldown_strikes_before_ban} 次`
    : `Ban manual dismiss • ${strategy.failover_max_cooldown_strikes_before_ban} max-cooldown strikes`;
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
  const { locale } = useLocale();
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Scale className="h-4 w-4" />
              {locale === "zh-CN" ? "负载均衡策略" : "Loadbalance Strategies"}
            </CardTitle>
            <CardDescription className="text-xs">
              {locale === "zh-CN"
                ? "在原生模型之间复用策略定义，而不是为每个模型单独配置故障转移。"
                : "Reuse strategy definitions across native models instead of configuring failover per model."}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" onClick={onCreate}>
              <Plus className="mr-2 h-3.5 w-3.5" />
              {locale === "zh-CN" ? "新增策略" : "Add Strategy"}
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
              {locale === "zh-CN" ? "当前没有配置负载均衡策略。" : "No loadbalance strategies configured."}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                  <TableRow>
                  <TableHead>{locale === "zh-CN" ? "名称" : "Name"}</TableHead>
                  <TableHead>{locale === "zh-CN" ? "类型" : "Type"}</TableHead>
                  <TableHead>{locale === "zh-CN" ? "恢复" : "Recovery"}</TableHead>
                  <TableHead>{locale === "zh-CN" ? "已绑定模型" : "Attached Models"}</TableHead>
                  <TableHead className="text-right">{locale === "zh-CN" ? "操作" : "Actions"}</TableHead>
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
                              ? locale === "zh-CN"
                                ? "优先顺序，可选恢复"
                                : "Priority order with optional recovery"
                              : locale === "zh-CN"
                                ? "单个活动连接"
                                : "Single active connection"
                            }
                          </span>
                          {strategy.strategy_type === "failover" ? (
                            <>
                              <span className="text-xs text-muted-foreground">
                                {locale === "zh-CN"
                                  ? `阈值 ${strategy.failover_failure_threshold} • 基础 ${strategy.failover_cooldown_seconds}秒 • 最大 ${strategy.failover_max_cooldown_seconds}秒`
                                  : `Threshold ${strategy.failover_failure_threshold} • Base ${strategy.failover_cooldown_seconds}s • Max ${strategy.failover_max_cooldown_seconds}s`}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {locale === "zh-CN"
                                  ? `退避 ×${strategy.failover_backoff_multiplier} • 抖动 ${strategy.failover_jitter_ratio} • 认证 ${strategy.failover_auth_error_cooldown_seconds}秒`
                                  : `Backoff ×${strategy.failover_backoff_multiplier} • Jitter ${strategy.failover_jitter_ratio} • Auth ${strategy.failover_auth_error_cooldown_seconds}s`}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {getBanSummary(strategy, locale)}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <TypeBadge
                          label={
                            strategy.strategy_type === "failover"
                              ? locale === "zh-CN"
                                ? "故障转移"
                                : "Failover"
                              : locale === "zh-CN"
                                ? "单连接"
                                : "Single"
                          }
                          intent={strategy.strategy_type === "failover" ? "accent" : "info"}
                        />
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={
                            strategy.failover_recovery_enabled
                              ? locale === "zh-CN"
                                ? "已启用"
                                : "Enabled"
                              : locale === "zh-CN"
                                ? "已禁用"
                                : "Disabled"
                          }
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
                              <span className="sr-only">{locale === "zh-CN" ? "编辑" : "Edit"}</span>
                            </IconActionButton>
                            <IconActionButton
                              size="icon"
                              destructive
                              onClick={() => onDelete(strategy)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">{locale === "zh-CN" ? "删除" : "Delete"}</span>
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
