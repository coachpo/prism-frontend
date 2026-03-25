import { Search } from "lucide-react";
import { ProviderIcon } from "@/components/ProviderIcon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/i18n/useLocale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatProviderType } from "@/lib/utils";
import type { FilterOptions } from "./useRequestLogsPageData";
import type { RequestLogPageActions } from "./useRequestLogPageState";
import { STATUS_FAMILY_OPTIONS, TIME_RANGE_OPTIONS } from "./queryParams";
import { TIME_LABELS } from "./FiltersBar.constants";

interface FiltersBarPrimaryFiltersProps {
  actions: Pick<
    RequestLogPageActions,
    | "setConnectionId"
    | "setEndpointId"
    | "setModelId"
    | "setProviderType"
    | "setSearch"
    | "setStatusFamily"
    | "setTimeRange"
  >;
  filterOptions: FilterOptions;
  filterOptionsLoaded: boolean;
  state: Pick<
    RequestLogPageActions["state"],
    | "connection_id"
    | "endpoint_id"
    | "model_id"
    | "provider_type"
    | "search"
    | "status_family"
    | "time_range"
  >;
}

function ToolbarLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </Label>
  );
}

export function FiltersBarPrimaryFilters({
  actions,
  filterOptions,
  filterOptionsLoaded,
  state,
}: FiltersBarPrimaryFiltersProps) {
  const { messages } = useLocale();

  return (
    <div className="grid gap-3 xl:grid-cols-8">
      <div className="xl:col-span-2">
        <ToolbarLabel>{messages.requestLogs.search}</ToolbarLabel>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-9 rounded-lg border-border/70 bg-background/80 pl-9 text-sm"
            placeholder={messages.requestLogs.searchPlaceholder}
            value={state.search}
            onChange={(event) => actions.setSearch(event.target.value)}
          />
        </div>
      </div>

      <div>
        <ToolbarLabel>{messages.requestLogs.model}</ToolbarLabel>
        <Select
          value={state.model_id || "__all__"}
          onValueChange={(value) => actions.setModelId(value === "__all__" ? "" : value)}
        >
          <SelectTrigger className="h-9 rounded-lg border-border/70 bg-background/80 text-xs">
            <SelectValue placeholder={messages.requestLogs.allModels} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{messages.requestLogs.allModels}</SelectItem>
            {filterOptionsLoaded &&
              filterOptions.models.map((model) => (
                <SelectItem key={model.model_id} value={model.model_id}>
                  {model.display_name || model.model_id}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <ToolbarLabel>{messages.requestLogs.provider}</ToolbarLabel>
        <Select
          value={state.provider_type || "__all__"}
          onValueChange={(value) => actions.setProviderType(value === "__all__" ? "" : value)}
        >
          <SelectTrigger className="h-9 rounded-lg border-border/70 bg-background/80 text-xs">
            <SelectValue placeholder={messages.requestLogs.allProviders} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{messages.requestLogs.allProviders}</SelectItem>
            {filterOptionsLoaded &&
              filterOptions.providers.map((provider) => (
                <SelectItem key={provider.id} value={provider.provider_type}>
                  <span className="flex items-center gap-2">
                    <ProviderIcon providerType={provider.provider_type} size={14} />
                    {formatProviderType(provider.provider_type)}
                  </span>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <ToolbarLabel>{messages.requestLogs.endpoint}</ToolbarLabel>
        <Select
          value={state.endpoint_id || "__all__"}
          onValueChange={(value) => actions.setEndpointId(value === "__all__" ? "" : value)}
        >
          <SelectTrigger className="h-9 rounded-lg border-border/70 bg-background/80 text-xs">
            <SelectValue placeholder={messages.requestLogs.allEndpoints} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{messages.requestLogs.allEndpoints}</SelectItem>
            {filterOptionsLoaded &&
              filterOptions.endpoints.map((endpoint) => (
                <SelectItem key={endpoint.id} value={String(endpoint.id)}>
                  {endpoint.name || endpoint.base_url}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <ToolbarLabel>{messages.requestLogs.status}</ToolbarLabel>
        <Select
          value={state.status_family}
          onValueChange={(value) => actions.setStatusFamily(value as typeof state.status_family)}
        >
          <SelectTrigger className="h-9 rounded-lg border-border/70 bg-background/80 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FAMILY_OPTIONS.map((statusFamily) => (
              <SelectItem key={statusFamily} value={statusFamily}>
                {statusFamily === "all"
                  ? messages.requestLogs.allStatuses
                  : statusFamily === "4xx"
                    ? messages.requestLogs.fourHundredsOnly
                    : messages.requestLogs.fiveHundredsOnly}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <ToolbarLabel>{messages.requestLogs.connection}</ToolbarLabel>
        <Select
          value={state.connection_id || "__all__"}
          onValueChange={(value) => actions.setConnectionId(value === "__all__" ? "" : value)}
        >
          <SelectTrigger className="h-9 rounded-lg border-border/70 bg-background/80 text-xs">
            <SelectValue placeholder={messages.requestLogs.allConnections} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{messages.requestLogs.allConnections}</SelectItem>
            {filterOptionsLoaded &&
              filterOptions.connections.map((connection) => (
                <SelectItem key={connection.id} value={String(connection.id)}>
                  {connection.label}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <ToolbarLabel>{messages.requestLogs.timeRange}</ToolbarLabel>
        <Select
          value={state.time_range}
          onValueChange={(value) => actions.setTimeRange(value as typeof state.time_range)}
        >
          <SelectTrigger className="h-9 rounded-lg border-border/70 bg-background/80 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIME_RANGE_OPTIONS.map((timeRange) => (
              <SelectItem key={timeRange} value={timeRange}>
                {timeRange === "24h" ? messages.requestLogs.last24Hours : TIME_LABELS[timeRange]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
