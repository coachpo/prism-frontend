import { Filter, RefreshCw, Trash2 } from "lucide-react";
import { useLocale } from "@/i18n/useLocale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProviderSelect } from "@/components/ProviderSelect";
import { type SpendingPreset } from "./queryParams";
import { getConnectionLabel } from "./utils";
import type { Provider, SpendingGroupBy, ConnectionDropdownItem } from "@/lib/types";

interface SpendingTabFiltersProps {
  spendingPreset: SpendingPreset;
  setSpendingPreset: (value: SpendingPreset) => void;
  spendingFrom: string;
  setSpendingFrom: (value: string) => void;
  spendingTo: string;
  setSpendingTo: (value: string) => void;
  spendingProviderType: string;
  setSpendingProviderType: (value: string) => void;
  spendingModelId: string;
  setSpendingModelId: (value: string) => void;
  spendingConnectionId: string;
  setSpendingConnectionId: (value: string) => void;
  spendingGroupBy: SpendingGroupBy;
  setSpendingGroupBy: (value: SpendingGroupBy) => void;
  clearFilters: () => void;
  refresh: () => void;
  models: { model_id: string; display_name: string | null }[];
  providers: Provider[];
  connections: ConnectionDropdownItem[];
}

export function SpendingTabFilters({
  spendingPreset,
  setSpendingPreset,
  spendingFrom,
  setSpendingFrom,
  spendingTo,
  setSpendingTo,
  spendingProviderType,
  setSpendingProviderType,
  spendingModelId,
  setSpendingModelId,
  spendingConnectionId,
  setSpendingConnectionId,
  spendingGroupBy,
  setSpendingGroupBy,
  clearFilters,
  refresh,
  models,
  providers,
  connections,
}: SpendingTabFiltersProps) {
  const { messages } = useLocale();

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-4 flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">{messages.statistics.filters}</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <div className="space-y-2">
          <Label htmlFor="spending-preset">{messages.requestLogs.timeRange}</Label>
          <Select value={spendingPreset} onValueChange={(value) => setSpendingPreset(value as SpendingPreset)}>
            <SelectTrigger id="spending-preset">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">{messages.statistics.today}</SelectItem>
              <SelectItem value="last_7_days">{messages.statistics.last7Days}</SelectItem>
              <SelectItem value="last_30_days">{messages.statistics.last30Days}</SelectItem>
              <SelectItem value="all">{messages.statistics.allTime}</SelectItem>
              <SelectItem value="custom">{messages.statistics.customRange}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {spendingPreset === "custom" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="spending-from">{messages.statistics.from}</Label>
              <Input
                id="spending-from"
                type="date"
                value={spendingFrom}
                onChange={(event) => setSpendingFrom(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spending-to">{messages.statistics.to}</Label>
              <Input
                id="spending-to"
                type="date"
                value={spendingTo}
                onChange={(event) => setSpendingTo(event.target.value)}
              />
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="spending-provider-type">{messages.requestLogs.provider}</Label>
          <ProviderSelect
            value={spendingProviderType}
            onValueChange={setSpendingProviderType}
            providers={providers}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="spending-model-id">{messages.requestLogs.model}</Label>
          <Select
            value={spendingModelId || "__all__"}
            onValueChange={(value) => setSpendingModelId(value === "__all__" ? "" : value)}
          >
            <SelectTrigger id="spending-model-id">
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
          <Label htmlFor="spending-connection-id">{messages.statistics.connection}</Label>
          <Select
            value={spendingConnectionId || "__all__"}
            onValueChange={(value) => setSpendingConnectionId(value === "__all__" ? "" : value)}
          >
            <SelectTrigger id="spending-connection-id">
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
          <Label htmlFor="spending-group-by">{messages.statistics.groupBy}</Label>
          <Select
            value={spendingGroupBy}
            onValueChange={(value) => setSpendingGroupBy(value as SpendingGroupBy)}
          >
            <SelectTrigger id="spending-group-by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{messages.statistics.all}</SelectItem>
              <SelectItem value="day">{messages.statistics.day}</SelectItem>
              <SelectItem value="week">{messages.statistics.week}</SelectItem>
              <SelectItem value="month">{messages.statistics.month}</SelectItem>
              <SelectItem value="provider">{messages.statistics.providerGroup}</SelectItem>
              <SelectItem value="model">{messages.statistics.modelGroup}</SelectItem>
              <SelectItem value="endpoint">{messages.statistics.endpointGroup}</SelectItem>
              <SelectItem value="model_endpoint">{messages.statistics.modelEndpointGroup}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="outline" size="sm" onClick={clearFilters}>
          <Trash2 className="mr-2 h-4 w-4" />
          {messages.statistics.clearFilters}
        </Button>
        <Button variant="outline" size="icon-sm" onClick={refresh} aria-label={messages.statistics.refreshSpendingStatistics} title={messages.statistics.refreshSpendingStatistics}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
