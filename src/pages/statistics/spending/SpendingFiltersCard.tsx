import { Filter } from "lucide-react";
import { ProviderSelect } from "@/components/ProviderSelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEFAULT_SPENDING_LIMIT,
  DEFAULT_SPENDING_TOP_N,
  SPENDING_LIMIT_OPTIONS,
} from "../queryParams";
import { getConnectionLabel } from "../utils";
import type { SpendingTabProps } from "./spendingTabProps";

interface SpendingFiltersCardProps
  extends Pick<
    SpendingTabProps,
    | "connections"
    | "models"
    | "providers"
    | "setSpendingConnectionId"
    | "setSpendingFrom"
    | "setSpendingGroupBy"
    | "setSpendingLimit"
    | "setSpendingModelId"
    | "setSpendingOffset"
    | "setSpendingPreset"
    | "setSpendingProviderType"
    | "setSpendingTo"
    | "setSpendingTopN"
    | "spendingConnectionId"
    | "spendingFrom"
    | "spendingGroupBy"
    | "spendingLimit"
    | "spendingModelId"
    | "spendingPreset"
    | "spendingProviderType"
    | "spendingTo"
    | "spendingTopN"
  > {
  formatTime: (value: string, options?: Intl.DateTimeFormatOptions) => string;
  reportCode: string;
  spendingUpdatedAt: string | null;
}

export function SpendingFiltersCard({
  connections,
  formatTime,
  models,
  providers,
  reportCode,
  setSpendingConnectionId,
  setSpendingFrom,
  setSpendingGroupBy,
  setSpendingLimit,
  setSpendingModelId,
  setSpendingOffset,
  setSpendingPreset,
  setSpendingProviderType,
  setSpendingTo,
  setSpendingTopN,
  spendingConnectionId,
  spendingFrom,
  spendingGroupBy,
  spendingLimit,
  spendingModelId,
  spendingPreset,
  spendingProviderType,
  spendingTo,
  spendingTopN,
  spendingUpdatedAt,
}: SpendingFiltersCardProps) {
  return (
    <Card className="sticky top-4 z-10 border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          <span>Filters apply to all spending metrics and breakdowns below.</span>
        </div>

        <div className="grid gap-3 lg:grid-cols-6">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Time Range</span>
            <Select
              value={spendingPreset}
              onValueChange={(value) => {
                setSpendingPreset(value as SpendingTabProps["spendingPreset"]);
                setSpendingOffset(0);
              }}
            >
              <SelectTrigger className="h-8 text-xs">
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

          {spendingPreset === "custom" ? (
            <>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">From</span>
                <Input
                  type="date"
                  className="h-8 text-xs"
                  value={spendingFrom}
                  onChange={(event) => {
                    setSpendingFrom(event.target.value);
                    setSpendingOffset(0);
                  }}
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">To</span>
                <Input
                  type="date"
                  className="h-8 text-xs"
                  value={spendingTo}
                  onChange={(event) => {
                    setSpendingTo(event.target.value);
                    setSpendingOffset(0);
                  }}
                />
              </div>
            </>
          ) : null}

          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Provider</span>
            <ProviderSelect
              value={spendingProviderType}
              onValueChange={(value) => {
                setSpendingProviderType(value);
                setSpendingOffset(0);
              }}
              providers={providers}
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Model ID</span>
            <Select
              value={spendingModelId || "__all__"}
              onValueChange={(value) => {
                setSpendingModelId(value === "__all__" ? "" : value);
                setSpendingOffset(0);
              }}
            >
              <SelectTrigger className="h-8 text-xs">
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
          </div>

          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Connection ID</span>
            <Select
              value={spendingConnectionId || "__all__"}
              onValueChange={(value) => {
                setSpendingConnectionId(value === "__all__" ? "" : value);
                setSpendingOffset(0);
              }}
            >
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
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-4">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Group By</span>
            <Select
              value={spendingGroupBy}
              onValueChange={(value) => {
                setSpendingGroupBy(value as SpendingTabProps["spendingGroupBy"]);
                setSpendingOffset(0);
              }}
            >
              <SelectTrigger className="h-8 text-xs">
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

          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Rows</span>
            <Select
              value={String(spendingLimit)}
              onValueChange={(value) => {
                setSpendingLimit(Number.parseInt(value, 10));
                setSpendingOffset(0);
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPENDING_LIMIT_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Top N</span>
            <Input
              className="h-8 text-xs"
              type="number"
              min="1"
              max="50"
              value={spendingTopN}
              onChange={(event) => {
                const value = Number.parseInt(event.target.value || String(DEFAULT_SPENDING_TOP_N), 10);
                if (Number.isFinite(value)) {
                  setSpendingTopN(Math.min(50, Math.max(1, value)));
                }
              }}
            />
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              className="h-8 w-full text-xs"
              onClick={() => {
                setSpendingPreset("last_7_days");
                setSpendingFrom("");
                setSpendingTo("");
                setSpendingProviderType("all");
                setSpendingModelId("");
                setSpendingConnectionId("");
                setSpendingGroupBy("model");
                setSpendingLimit(DEFAULT_SPENDING_LIMIT);
                setSpendingOffset(0);
                setSpendingTopN(DEFAULT_SPENDING_TOP_N);
              }}
            >
              Reset
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Currency: <span className="font-medium text-foreground">{reportCode}</span>
          <span className="mx-2">•</span>
          Updated:{" "}
          <span className="font-medium text-foreground">
            {spendingUpdatedAt
              ? formatTime(spendingUpdatedAt, {
                  hour: "numeric",
                  minute: "numeric",
                  second: "numeric",
                  hour12: true,
                })
              : "-"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
