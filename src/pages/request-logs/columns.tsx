import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RequestLogEntry } from "@/lib/types";
import { AlertCircle, Clock } from "lucide-react";

export const ROW_HEIGHT = 45;

function formatCost(micros: number | null, symbol: string | null): string {
  if (micros === null || micros === 0) return "—";
  const value = micros / 1_000_000;
  return `${symbol ?? "$"}${value.toFixed(4)}`;
}

function formatTokens(tokens: number | null): string {
  if (tokens === null) return "—";
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}k`;
  return String(tokens);
}

function statusColor(code: number): string {
  if (code >= 200 && code < 300) return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
  if (code >= 400 && code < 500) return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
  return "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30";
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
  width: string;
  align?: "left" | "right" | "center";
  sticky?: { left: string };
  render: (row: RequestLogEntry, formatTimestamp: (iso: string) => string) => React.ReactNode;
}

export function getColumns(view: "all" | "compact"): ColumnDef[] {
  const base: ColumnDef[] = [
    {
      key: "created_at",
      label: "Time",
      width: view === "all" ? "180px" : "150px",
      ...(view === "all" ? { sticky: { left: "0px" } } : {}),
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
      label: "Model",
      width: view === "all" ? "200px" : "160px",
      ...(view === "all" ? { sticky: { left: "180px" } } : {}),
      render: (row) => <span className="truncate text-xs font-medium">{row.model_id}</span>,
    },
    {
      key: "provider_type",
      label: "Provider",
      width: "100px",
      render: (row) => (
        <span className="truncate text-xs capitalize text-muted-foreground">{row.provider_type}</span>
      ),
    },
    {
      key: "status_code",
      label: "Status",
      width: "80px",
      align: "center",
      render: (row) => (
        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 font-mono", statusColor(row.status_code))}>
          {row.status_code}
        </Badge>
      ),
    },
    {
      key: "response_time_ms",
      label: "Latency",
      width: "90px",
      align: "right",
      render: (row) => (
        <span className={cn("text-xs font-mono", latencyColor(row.response_time_ms))}>
          {row.response_time_ms.toLocaleString()}ms
        </span>
      ),
    },
    {
      key: "total_tokens",
      label: "Tokens",
      width: "80px",
      align: "right",
      render: (row) => (
        <span className="text-xs font-mono text-muted-foreground">
          {formatTokens(row.total_tokens)}
        </span>
      ),
    },
    {
      key: "total_cost",
      label: "Cost",
      width: "90px",
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
      label: "Stream",
      width: "70px",
      align: "center",
      render: (row) =>
        row.is_stream ? (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300">
            SSE
          </Badge>
        ) : (
          <span className="text-[10px] text-muted-foreground">—</span>
        ),
    });
  }

  return base;
}

export { formatCost, formatTokens };
