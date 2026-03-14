import { Filter } from "lucide-react";
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
  return (
    <Card className="sticky top-4 z-10 border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          <span>Filters update all health, performance, usage, and debug sections.</span>
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
                {range === "all" ? "All" : range}
              </Button>
            ))}
          </div>

          <div className="text-xs text-muted-foreground">
            Aggregation: <span className="font-medium text-foreground">{operationsAggregationLabel}</span>
            <span className="mx-2">•</span>
            Updated: <span className="font-medium text-foreground">{operationsLastUpdated}</span>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <Select value={modelId} onValueChange={setModelId}>
            <SelectTrigger className="h-8 text-xs">
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

          <ProviderSelect
            value={providerType}
            onValueChange={setProviderType}
            className="h-8 text-xs"
          />

          <Select value={connectionId} onValueChange={setConnectionId}>
            <SelectTrigger className="h-8 text-xs">
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
            value={specialTokenFilter}
            onValueChange={(value) => setSpecialTokenFilter(value as SpecialTokenFilter)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Special tokens" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All rows</SelectItem>
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
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="success">Success only</SelectItem>
              <SelectItem value="4xx">4xx only</SelectItem>
              <SelectItem value="5xx">5xx only</SelectItem>
              <SelectItem value="error">Any error</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
