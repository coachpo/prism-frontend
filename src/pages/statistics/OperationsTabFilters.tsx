import { Filter, RefreshCw, Trash2 } from "lucide-react";
import { useLocale } from "@/i18n/useLocale";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProviderSelect } from "@/components/ProviderSelect";
import {
  OPERATIONS_TIME_RANGES,
  type OperationsStatusFilter,
  type OperationsTimeRange,
  type SpecialTokenFilter,
} from "./queryParams";
import { getConnectionLabel } from "./utils";
import type { Provider, ConnectionDropdownItem } from "@/lib/types";

interface OperationsTabFiltersProps {
  timeRange: OperationsTimeRange;
  setTimeRange: (value: OperationsTimeRange) => void;
  modelId: string;
  setModelId: (value: string) => void;
  providerType: string;
  setProviderType: (value: string) => void;
  connectionId: string;
  setConnectionId: (value: string) => void;
  specialTokenFilter: SpecialTokenFilter;
  setSpecialTokenFilter: (value: SpecialTokenFilter) => void;
  operationsStatusFilter: OperationsStatusFilter;
  setOperationsStatusFilter: (value: OperationsStatusFilter) => void;
  clearFilters: () => void;
  refresh: () => void;
  models: { model_id: string; display_name: string | null }[];
  providers: Provider[];
  connections: ConnectionDropdownItem[];
}

export function OperationsTabFilters({
  timeRange,
  setTimeRange,
  modelId,
  setModelId,
  providerType,
  setProviderType,
  connectionId,
  setConnectionId,
  specialTokenFilter,
  setSpecialTokenFilter,
  operationsStatusFilter,
  setOperationsStatusFilter,
  clearFilters,
  refresh,
  models,
  providers,
  connections,
}: OperationsTabFiltersProps) {
  const { messages } = useLocale();

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-4 flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">{messages.statistics.filters}</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <div className="space-y-2">
          <Label htmlFor="time-range">{messages.requestLogs.timeRange}</Label>
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as OperationsTimeRange)}>
            <SelectTrigger id="time-range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPERATIONS_TIME_RANGES.map((range) => (
                <SelectItem key={range} value={range}>
                  {range === "all" ? messages.statistics.all : range}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="model-id">{messages.requestLogs.model}</Label>
          <Select value={modelId} onValueChange={setModelId}>
            <SelectTrigger id="model-id">
              <SelectValue placeholder={messages.requestLogs.model} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">{messages.statistics.allModels}</SelectItem>
              {models.map((model) => (
                <SelectItem key={model.model_id} value={model.model_id}>
                  {model.display_name || model.model_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="provider-type">{messages.requestLogs.provider}</Label>
          <ProviderSelect
            value={providerType}
            onValueChange={setProviderType}
            providers={providers}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="connection-id">{messages.statistics.connection}</Label>
          <Select value={connectionId} onValueChange={setConnectionId}>
            <SelectTrigger id="connection-id">
              <SelectValue placeholder={messages.statistics.connection} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">{messages.statistics.allConnections}</SelectItem>
              {connections.map((connection) => (
                <SelectItem key={connection.id} value={String(connection.id)}>
                  {getConnectionLabel(connection)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="special-token-filter">{messages.statistics.specialTokens}</Label>
          <Select
            value={specialTokenFilter}
            onValueChange={(value) => setSpecialTokenFilter(value as SpecialTokenFilter)}
          >
            <SelectTrigger id="special-token-filter">
              <SelectValue placeholder={messages.statistics.specialTokens} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{messages.statistics.allRows}</SelectItem>
              <SelectItem value="has_cached">Has cached</SelectItem>
              <SelectItem value="has_reasoning">Has reasoning</SelectItem>
              <SelectItem value="has_any_special">Has any special</SelectItem>
              <SelectItem value="missing_special">Missing special</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status-filter">{messages.requestLogs.status}</Label>
          <Select
            value={operationsStatusFilter}
            onValueChange={(value) => setOperationsStatusFilter(value as OperationsStatusFilter)}
          >
            <SelectTrigger id="status-filter">
              <SelectValue placeholder={messages.requestLogs.status} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{messages.requestLogs.allStatuses}</SelectItem>
              <SelectItem value="success">Success only</SelectItem>
              <SelectItem value="4xx">4xx only</SelectItem>
              <SelectItem value="5xx">5xx only</SelectItem>
              <SelectItem value="error">{messages.statistics.anyError}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="outline" size="sm" onClick={clearFilters}>
          <Trash2 className="mr-2 h-4 w-4" />
          {messages.statistics.clearFilters}
        </Button>
        <Button variant="outline" size="icon-sm" onClick={refresh} aria-label={messages.statistics.refreshOperationsStatistics} title={messages.statistics.refreshOperationsStatistics}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
