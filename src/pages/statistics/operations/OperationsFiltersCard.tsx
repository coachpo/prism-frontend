import { Filter } from "lucide-react";
import { useLocale } from "@/i18n/useLocale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProviderSelect } from "@/components/ProviderSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  OPERATIONS_TIME_RANGES,
  type OperationsStatusFilter,
  type SpecialTokenFilter,
} from "../queryParams";
import { getConnectionLabel } from "../utils";
import type { OperationsTabProps } from "./operationsTabProps";

interface OperationsFiltersCardProps
  extends Pick<
    OperationsTabProps,
    | "models"
    | "connections"
    | "providers"
    | "modelId"
    | "setModelId"
    | "providerType"
    | "setProviderType"
    | "connectionId"
    | "setConnectionId"
    | "timeRange"
    | "setTimeRange"
    | "specialTokenFilter"
    | "setSpecialTokenFilter"
    | "operationsStatusFilter"
    | "setOperationsStatusFilter"
  > {
  operationsAggregationLabel: string;
  operationsLastUpdated: string;
}

export function OperationsFiltersCard({
  models,
  connections,
  providers,
  modelId,
  setModelId,
  providerType,
  setProviderType,
  connectionId,
  setConnectionId,
  timeRange,
  setTimeRange,
  specialTokenFilter,
  setSpecialTokenFilter,
  operationsStatusFilter,
  setOperationsStatusFilter,
  operationsAggregationLabel,
  operationsLastUpdated,
}: OperationsFiltersCardProps) {
  const { messages } = useLocale();

  return (
    <Card className="sticky top-4 z-10 border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          <span>{messages.statistics.operationsDescription}</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex w-fit flex-wrap gap-2 rounded-lg bg-muted/60 p-1">
            {OPERATIONS_TIME_RANGES.map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "ghost"}
                size="sm"
                className={cn("h-7 px-3 text-xs", timeRange === range && "shadow-sm")}
                onClick={() => setTimeRange(range)}
              >
                {range === "all" ? messages.statistics.all : range}
              </Button>
            ))}
          </div>

          <div className="text-xs text-muted-foreground">
            {messages.statistics.aggregation}: <span className="font-medium text-foreground">{operationsAggregationLabel}</span>
            <span className="mx-2">•</span>
            {messages.statistics.updated}: <span className="font-medium text-foreground">{operationsLastUpdated}</span>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <Select value={modelId} onValueChange={setModelId}>
            <SelectTrigger className="h-8 text-xs">
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

          <ProviderSelect
            value={providerType}
            onValueChange={setProviderType}
            providers={providers}
            className="h-8 text-xs"
          />

          <Select value={connectionId} onValueChange={setConnectionId}>
            <SelectTrigger className="h-8 text-xs">
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

          <Select
            value={specialTokenFilter}
            onValueChange={(value) => setSpecialTokenFilter(value as SpecialTokenFilter)}
          >
            <SelectTrigger className="h-8 text-xs">
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

          <Select
            value={operationsStatusFilter}
            onValueChange={(value) => setOperationsStatusFilter(value as OperationsStatusFilter)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder={messages.requestLogs.status} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{messages.requestLogs.allStatuses}</SelectItem>
              <SelectItem value="success">{messages.statistics.successOnly}</SelectItem>
              <SelectItem value="4xx">4xx only</SelectItem>
              <SelectItem value="5xx">5xx only</SelectItem>
              <SelectItem value="error">{messages.statistics.anyError}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
