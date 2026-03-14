import { cn } from "@/lib/utils";
import type { ViewType } from "./queryParams";
import { HeaderWithTooltip } from "./HeaderWithTooltip";

export type ColumnId =
  | "request_id"
  | "time"
  | "model"
  | "provider"
  | "endpoint"
  | "status"
  | "latency"
  | "stream"
  | "input_tokens"
  | "output_tokens"
  | "total_tokens"
  | "cached_tokens"
  | "cache_create_tokens"
  | "reasoning_tokens"
  | "input_cost"
  | "output_cost"
  | "cache_read_cost"
  | "cache_create_cost"
  | "reasoning_cost"
  | "total_cost"
  | "billable"
  | "priced"
  | "unpriced_reason"
  | "error";

export const VIEW_COLUMNS: Record<ViewType, ColumnId[]> = {
  overview: [
    "time",
    "model",
    "provider",
    "endpoint",
    "status",
    "latency",
    "total_tokens",
    "total_cost",
    "stream",
    "error",
  ],
  performance: [
    "time",
    "request_id",
    "model",
    "provider",
    "endpoint",
    "status",
    "latency",
    "stream",
    "error",
  ],
  tokens: [
    "time",
    "model",
    "provider",
    "input_tokens",
    "output_tokens",
    "cached_tokens",
    "cache_create_tokens",
    "reasoning_tokens",
    "total_tokens",
    "status",
  ],
  cost: [
    "time",
    "model",
    "provider",
    "input_cost",
    "output_cost",
    "cache_read_cost",
    "cache_create_cost",
    "reasoning_cost",
    "total_cost",
    "billable",
    "priced",
    "unpriced_reason",
  ],
  cache: [
    "time",
    "model",
    "provider",
    "status",
    "latency",
    "cached_tokens",
    "cache_create_tokens",
    "cache_read_cost",
    "cache_create_cost",
    "total_tokens",
  ],
  errors: [
    "time",
    "request_id",
    "model",
    "provider",
    "endpoint",
    "status",
    "latency",
    "error",
    "total_cost",
  ],
  all: [
    "time",
    "model",
    "provider",
    "endpoint",
    "request_id",
    "status",
    "latency",
    "stream",
    "input_tokens",
    "output_tokens",
    "total_tokens",
    "cached_tokens",
    "cache_create_tokens",
    "reasoning_tokens",
    "input_cost",
    "output_cost",
    "cache_read_cost",
    "cache_create_cost",
    "reasoning_cost",
    "total_cost",
    "billable",
    "priced",
    "unpriced_reason",
    "error",
  ],
};

const RIGHT_ALIGNED_COLUMNS = new Set<ColumnId>([
  "latency",
  "input_tokens",
  "output_tokens",
  "total_tokens",
  "cached_tokens",
  "cache_create_tokens",
  "reasoning_tokens",
  "input_cost",
  "output_cost",
  "cache_read_cost",
  "cache_create_cost",
  "reasoning_cost",
  "total_cost",
]);

const CENTER_ALIGNED_COLUMNS = new Set<ColumnId>(["billable", "priced"]);

const ALL_COLUMNS_HEADER_CLASSES: Partial<Record<ColumnId, string>> = {
  time: "sticky left-0 z-20 w-[170px] min-w-[170px] border-r border-border/70 bg-card",
  model: "sticky left-[170px] z-20 w-[180px] min-w-[180px] border-r border-border/70 bg-card",
  provider: "sticky left-[350px] z-20 w-[130px] min-w-[130px] border-r border-border/70 bg-card",
  endpoint: "sticky left-[480px] z-20 w-[240px] min-w-[240px] border-r border-border/70 bg-card",
};

const ALL_COLUMNS_BODY_CLASSES: Partial<Record<ColumnId, string>> = {
  time: "sticky left-0 z-20 border-r border-border/70 bg-card",
  model: "sticky left-[170px] z-20 border-r border-border/70 bg-card",
  provider: "sticky left-[350px] z-20 border-r border-border/70 bg-card",
  endpoint: "sticky left-[480px] z-20 border-r border-border/70 bg-card",
};

export function getRequestLogsHeaderClassName(column: ColumnId, allColumnsMode: boolean): string {
  return cn(
    "whitespace-nowrap text-xs",
    RIGHT_ALIGNED_COLUMNS.has(column) && "text-right",
    CENTER_ALIGNED_COLUMNS.has(column) && "text-center",
    allColumnsMode && ALL_COLUMNS_HEADER_CLASSES[column],
    allColumnsMode && column === "request_id" && "w-[130px] min-w-[130px]",
  );
}

export function getRequestLogsStickyBodyClassName(column: ColumnId, allColumnsMode: boolean): string {
  if (!allColumnsMode) {
    return "";
  }

  return ALL_COLUMNS_BODY_CLASSES[column] ?? "";
}


export function renderTableHeader(column: ColumnId): React.ReactNode {
  switch (column) {
    case "request_id":
      return "Request ID";
    case "time":
      return "Time";
    case "model":
      return "Model";
    case "provider":
      return "Provider";
    case "endpoint":
      return "Connection";
    case "status":
      return "Status";
    case "latency":
      return "Latency";
    case "stream":
      return "Stream";
    case "input_tokens":
      return "Input Tokens";
    case "output_tokens":
      return "Output Tokens";
    case "total_tokens":
      return "Total Tokens";
    case "cached_tokens":
      return <HeaderWithTooltip label="Cached Tokens" tooltip="Input tokens served from upstream cache." />;
    case "cache_create_tokens":
      return <HeaderWithTooltip label="Cache Create Tokens" tooltip="Input tokens used to create cache entries." />;
    case "reasoning_tokens":
      return <HeaderWithTooltip label="Reasoning Tokens" tooltip="Internal reasoning/thinking tokens reported by upstream." />;
    case "input_cost":
      return "Input Cost";
    case "output_cost":
      return "Output Cost";
    case "cache_read_cost":
      return "Cached Cost";
    case "cache_create_cost":
      return "Cache Create Cost";
    case "reasoning_cost":
      return "Reasoning Cost";
    case "total_cost":
      return "Total Cost";
    case "billable":
      return "Billable";
    case "priced":
      return "Priced";
    case "unpriced_reason":
      return "Unpriced Reason";
    case "error":
      return "Error";
    default:
      return "-";
  }
}
