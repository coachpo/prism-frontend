import type {
  ApiFamily,
  ConnectionDropdownItem,
  SpendingGroupBy,
  SpendingReportResponse,
} from "@/lib/types";
import type { SpendingPreset } from "../queryParams";

export interface SpendingTabProps {
  spending: SpendingReportResponse | null;
  spendingLoading: boolean;
  spendingError: string | null;
  spendingUpdatedAt: string | null;
  spendingPreset: SpendingPreset;
  setSpendingPreset: (value: SpendingPreset) => void;
  spendingFrom: string;
  setSpendingFrom: (value: string) => void;
  spendingTo: string;
  setSpendingTo: (value: string) => void;
  spendingApiFamily: string;
  setSpendingApiFamily: (value: string) => void;
  spendingModelId: string;
  setSpendingModelId: (value: string) => void;
  spendingConnectionId: string;
  setSpendingConnectionId: (value: string) => void;
  spendingGroupBy: SpendingGroupBy;
  setSpendingGroupBy: (value: SpendingGroupBy) => void;
  spendingLimit: number;
  setSpendingLimit: (value: number) => void;
  spendingOffset: number;
  setSpendingOffset: (value: number) => void;
  spendingTopN: number;
  setSpendingTopN: (value: number) => void;
  models: { model_id: string; display_name: string | null }[];
  connections: ConnectionDropdownItem[];
  apiFamilies: ApiFamily[];
  clearSpendingFilters: () => void;
  manualRefresh: () => void;
}
