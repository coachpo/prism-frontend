import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";
import { ProviderSelect } from "@/components/ProviderSelect";
import type { Provider, ConnectionDropdownItem } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { formatFilterDate, getConnectionLabel } from "@/pages/audit/utils";

interface AuditFiltersProps {
  providers: Provider[];
  models: { model_id: string; display_name: string | null }[];
  connections: ConnectionDropdownItem[];
  providerId: string;
  setProviderId: (val: string) => void;
  modelId: string;
  setModelId: (val: string) => void;
  connectionId: string;
  setConnectionId: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  dateFrom: string;
  setDateFrom: (val: string) => void;
  dateTo: string;
  setDateTo: (val: string) => void;
  setOffset: (val: number) => void;
}

export function AuditFilters({
  providers,
  models,
  connections,
  providerId,
  setProviderId,
  modelId,
  setModelId,
  connectionId,
  setConnectionId,
  statusFilter,
  setStatusFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  setOffset,
}: AuditFiltersProps) {
  const clearFilters = () => {
    setProviderId("all");
    setModelId("__all__");
    setConnectionId("__all__");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
    setOffset(0);
  };

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onClear: () => void }[] = [];

    if (providerId !== "all") {
      const providerName = providers.find((provider) => String(provider.id) === providerId)?.name ?? providerId;
      chips.push({
        key: "provider",
        label: `Provider: ${providerName}`,
        onClear: () => {
          setProviderId("all");
          setOffset(0);
        },
      });
    }

    if (modelId !== "__all__") {
      chips.push({
        key: "model",
        label: `Model: ${modelId}`,
        onClear: () => {
          setModelId("__all__");
          setOffset(0);
        },
      });
    }

    if (connectionId !== "__all__") {
      const connectionName =
        connections.find((connection) => String(connection.id) === connectionId)?.name ??
        `#${connectionId}`;
      chips.push({
        key: "connection",
        label: `Connection: ${connectionName}`,
        onClear: () => {
          setConnectionId("__all__");
          setOffset(0);
        },
      });
    }

    if (statusFilter !== "all") {
      chips.push({
        key: "status",
        label: `Status: ${statusFilter}`,
        onClear: () => {
          setStatusFilter("all");
          setOffset(0);
        },
      });
    }

    if (dateFrom) {
      chips.push({
        key: "from",
        label: `From: ${formatFilterDate(dateFrom)}`,
        onClear: () => {
          setDateFrom("");
          setOffset(0);
        },
      });
    }

    if (dateTo) {
      chips.push({
        key: "to",
        label: `To: ${formatFilterDate(dateTo)}`,
        onClear: () => {
          setDateTo("");
          setOffset(0);
        },
      });
    }

    return chips;
  }, [providerId, providers, modelId, connectionId, connections, statusFilter, dateFrom, dateTo, setProviderId, setModelId, setConnectionId, setStatusFilter, setDateFrom, setDateTo, setOffset]);

  const hasFilters = activeFilterChips.length > 0;

  return (
    <Card>
      <CardContent className="p-[var(--density-card-pad-y)]">
        <div className="flex flex-wrap items-center gap-2">
          <ProviderSelect
            value={providerId}
            onValueChange={(value) => {
              setProviderId(value);
              setOffset(0);
            }}
            valueType="provider_id"
            providers={providers}
            className="w-full sm:w-[160px]"
          />

          <Select
            value={modelId}
            onValueChange={(value) => {
              setModelId(value);
              setOffset(0);
            }}
          >
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Model ID" />
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

          <Select
            value={connectionId}
            onValueChange={(value) => {
              setConnectionId(value);
              setOffset(0);
            }}
          >
            <SelectTrigger className="w-full sm:w-[130px]">
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

          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setOffset(0);
            }}
          >
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="2xx">2xx</SelectItem>
              <SelectItem value="4xx">4xx</SelectItem>
              <SelectItem value="5xx">5xx</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="datetime-local"
            value={dateFrom}
            onChange={(event) => {
              setDateFrom(event.target.value);
              setOffset(0);
            }}
            className="w-full sm:w-auto"
            aria-label="From date"
          />

          <Input
            type="datetime-local"
            value={dateTo}
            onChange={(event) => {
              setDateTo(event.target.value);
              setOffset(0);
            }}
            className="w-full sm:w-auto"
            aria-label="To date"
          />

          {hasFilters ? (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          ) : null}
        </div>

        {hasFilters ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Filter className="h-3 w-3" />
              Active filters:
            </span>
            {activeFilterChips.map((chip) => (
              <Badge key={chip.key} variant="secondary" className="gap-1.5 font-normal">
                {chip.label}
                <button
                  type="button"
                  onClick={chip.onClear}
                  className="rounded-sm p-0.5 hover:bg-muted-foreground/15"
                  aria-label={`Clear ${chip.label}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="ml-auto h-6 px-2 text-xs"
            >
              Clear all
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
