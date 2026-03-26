import { ApiFamilyIcon } from "@/components/ApiFamilyIcon";
import { TypeBadge, ValueBadge } from "@/components/StatusBadge";
import { getCurrentLocale } from "@/i18n/format";
import { enMessages } from "@/i18n/messages/en";
import { zhCNMessages } from "@/i18n/messages/zh-CN";
import { formatMoneyMicros } from "@/lib/costing";
import { cn, formatApiFamily } from "@/lib/utils";
import type { RequestLogEntry } from "@/lib/types";
import { AlertCircle, Clock } from "lucide-react";

export const ROW_HEIGHT = 45;

function formatCost(micros: number | null, symbol: string | null): string {
  if (micros === null || micros === 0) return "—";
  return formatMoneyMicros(micros, symbol ?? "$", undefined, 2, 6, getCurrentLocale());
}

function formatTokens(tokens: number | null): string {
  if (tokens === null) return "—";
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}k`;
  return String(tokens);
}

function statusIntent(code: number) {
  if (code >= 200 && code < 300) return "success" as const;
  if (code >= 400 && code < 500) return "warning" as const;
  return "danger" as const;
}

function latencyColor(ms: number): string {
  if (ms < 500) return "text-emerald-600 dark:text-emerald-400";
  if (ms < 2000) return "text-foreground";
  if (ms < 5000) return "text-amber-600 dark:text-amber-400 font-medium";
  return "text-red-600 dark:text-red-400 font-bold";
}

export interface ColumnDef {
  key: string;
  label: string;
  width: number;
  grow?: number;
  align?: "left" | "right" | "center";
  render: (
    row: RequestLogEntry,
    formatTimestamp: (iso: string) => string,
    resolveModelLabel: (modelId: string) => string
  ) => React.ReactNode;
}

export function getColumns(view: "all" | "compact"): ColumnDef[] {
  const localeMessages = getCurrentLocale() === "zh-CN" ? zhCNMessages : enMessages;
  const messages = localeMessages.requestLogs;
  const base: ColumnDef[] = [
    {
      key: "created_at",
      label: messages.time,
      width: view === "all" ? 180 : 160,
      grow: 1,
      render: (row, fmt) => (
        <div className="flex items-center gap-2">
          {row.status_code >= 500 && <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
          {row.response_time_ms >= 5000 && row.status_code < 500 && <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
          <span className="truncate text-xs text-muted-foreground font-mono">{fmt(row.created_at)}</span>
        </div>
      ),
    },
    {
      key: "model_id",
      label: messages.model,
      width: view === "all" ? 210 : 180,
      grow: 2,
      render: (row, _formatTimestamp, resolveModelLabel) => {
        const requestedModelLabel = resolveModelLabel(row.model_id);
        const resolvedTargetLabel = row.resolved_target_model_id
          ? resolveModelLabel(row.resolved_target_model_id)
          : null;

        return (
          <div className="min-w-0">
            <span className="block truncate text-xs font-medium">{requestedModelLabel}</span>
            {resolvedTargetLabel && row.resolved_target_model_id !== row.model_id ? (
              <span className="block truncate text-[11px] text-muted-foreground">
                {messages.resolvedTarget} → {resolvedTargetLabel}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      key: "api_family",
      label: localeMessages.common.apiFamily,
      width: 150,
      grow: 1,
      render: (row) => (
        <span className="flex items-center gap-2 overflow-hidden text-xs text-muted-foreground">
          <ApiFamilyIcon apiFamily={row.api_family ?? ""} size={14} className="text-muted-foreground" />
          <span className="truncate">{formatApiFamily(row.api_family ?? "")}</span>
        </span>
      ),
    },
    {
      key: "status_code",
      label: messages.status,
      width: 88,
      align: "center",
      render: (row) => <ValueBadge label={String(row.status_code)} intent={statusIntent(row.status_code)} className="px-1.5 py-0 font-mono" />,
    },
    {
      key: "response_time_ms",
      label: messages.latency,
      width: 120,
      grow: 1,
      align: "right",
      render: (row) => (
          <span className={cn("text-xs font-mono", latencyColor(row.response_time_ms))}>
            {new Intl.NumberFormat(getCurrentLocale()).format(row.response_time_ms)}ms
          </span>
        ),
    },
    {
      key: "total_tokens",
      label: messages.tokens,
      width: 110,
      grow: 1,
      align: "right",
      render: (row) => (
        <span className="text-xs font-mono text-muted-foreground">
          {formatTokens(row.total_tokens)}
        </span>
      ),
    },
    {
      key: "total_cost",
      label: messages.spend,
      width: 110,
      grow: 1,
      align: "right",
      render: (row) => (
        <span className={cn("text-xs font-mono", row.total_cost_user_currency_micros && row.total_cost_user_currency_micros > 0 ? "text-foreground font-medium" : "text-muted-foreground")}>
          {formatCost(row.total_cost_user_currency_micros, row.report_currency_symbol)}
        </span>
      ),
    },
  ];

  if (view === "all") {
      base.push({
        key: "is_stream",
        label: messages.stream,
        width: 116,
        grow: 1,
        align: "center",
        render: (row) =>
          row.is_stream ? (
          <TypeBadge label={messages.streaming} intent="blue" className="px-2 py-0.5" />
        ) : (
          <span className="text-[10px] text-muted-foreground">—</span>
        ),
    });
  }

  return base;
}

export { formatCost, formatTokens };
