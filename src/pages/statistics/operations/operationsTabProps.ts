import type {
  ApiFamily,
  ConnectionDropdownItem,
  StatisticsRequestLogEntry,
} from "@/lib/types";
import type {
  OperationsStatusFilter,
  SpecialTokenFilter,
} from "../queryParams";

export interface OperationsTabProps {
  logs: StatisticsRequestLogEntry[];
  newLogIds: Set<number>;
  clearNewLogHighlight: (logId: number) => void;
  models: { model_id: string; display_name: string | null }[];
  connections: ConnectionDropdownItem[];
  apiFamilies: ApiFamily[];
  modelId: string;
  setModelId: (val: string) => void;
  apiFamily: string;
  setApiFamily: (val: string) => void;
  connectionId: string;
  setConnectionId: (val: string) => void;
  timeRange: "1h" | "24h" | "7d" | "all";
  setTimeRange: (val: "1h" | "24h" | "7d" | "all") => void;
  specialTokenFilter: SpecialTokenFilter;
  setSpecialTokenFilter: (val: SpecialTokenFilter) => void;
  operationsStatusFilter: OperationsStatusFilter;
  setOperationsStatusFilter: (val: OperationsStatusFilter) => void;
  clearOperationsFilters: () => void;
  manualRefresh: () => void;
  onViewInRequestLogs?: (requestId: number) => void;
}
