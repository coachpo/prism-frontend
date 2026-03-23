import { Filter, RefreshCw, Trash2 } from "lucide-react";
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
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-4 flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Filters</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <div className="space-y-2">
          <Label htmlFor="spending-preset">Time Range</Label>
          <Select value={spendingPreset} onValueChange={(value) => setSpendingPreset(value as SpendingPreset)}>
            <SelectTrigger id="spending-preset">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="last_7_days">Last 7 Days</SelectItem>
              <SelectItem value="last_30_days">Last 30 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {spendingPreset === "custom" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="spending-from">From</Label>
              <Input
                id="spending-from"
                type="date"
                value={spendingFrom}
                onChange={(event) => setSpendingFrom(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spending-to">To</Label>
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
          <Label htmlFor="spending-provider-type">Provider</Label>
          <ProviderSelect
            value={spendingProviderType}
            onValueChange={setSpendingProviderType}
            providers={providers}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="spending-model-id">Model</Label>
          <Select
            value={spendingModelId || "__all__"}
            onValueChange={(value) => setSpendingModelId(value === "__all__" ? "" : value)}
          >
            <SelectTrigger id="spending-model-id">
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Models</SelectItem>
              {models.map((model) => (
                <SelectItem key={model.model_id} value={model.model_id}>
                  {model.display_name || model.model_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="spending-connection-id">Connection</Label>
          <Select
            value={spendingConnectionId || "__all__"}
            onValueChange={(value) => setSpendingConnectionId(value === "__all__" ? "" : value)}
          >
            <SelectTrigger id="spending-connection-id">
              <SelectValue placeholder="Connection" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Connections</SelectItem>
              {connections.map((connection) => (
                <SelectItem key={connection.id} value={String(connection.id)}>
                  {getConnectionLabel(connection)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="spending-group-by">Group By</Label>
          <Select
            value={spendingGroupBy}
            onValueChange={(value) => setSpendingGroupBy(value as SpendingGroupBy)}
          >
            <SelectTrigger id="spending-group-by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">All</SelectItem>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="provider">Provider</SelectItem>
              <SelectItem value="model">Model</SelectItem>
              <SelectItem value="endpoint">Endpoint</SelectItem>
              <SelectItem value="model_endpoint">Model + Endpoint</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="outline" size="sm" onClick={clearFilters}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear Filters
        </Button>
        <Button variant="outline" size="icon-sm" onClick={refresh} aria-label="Refresh spending statistics" title="Refresh spending statistics">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
