import type { ConnectionDropdownItem, Provider, RequestLogEntry } from "@/lib/types";
import type {
  OperationsStatusFilter,
  SpecialTokenFilter,
} from "../queryParams";

export interface OperationsTabProps {
  logs: RequestLogEntry[];
  newLogIds: Set<number>;
  clearNewLogHighlight: (logId: number) => void;
  models: { model_id: string; display_name: string | null }[];
  connections: ConnectionDropdownItem[];
  providers: Provider[];
  modelId: string;
  setModelId: (val: string) => void;
  providerType: string;
  setProviderType: (val: string) => void;
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
}
