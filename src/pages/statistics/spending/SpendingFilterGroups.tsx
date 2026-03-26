import { Filter } from "lucide-react";
import { useLocale } from "@/i18n/useLocale";
import { ApiFamilySelect } from "@/components/ApiFamilySelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEFAULT_SPENDING_TOP_N,
  SPENDING_LIMIT_OPTIONS,
} from "../queryParams";
import { getConnectionLabel } from "../utils";
import type { SpendingTabProps } from "./spendingTabProps";
import {
  MAX_SPENDING_TOP_N,
  MIN_SPENDING_TOP_N,
  SPENDING_GROUP_BY_OPTIONS,
  SPENDING_PRESET_OPTIONS,
} from "./spendingFilterOptions";

interface SpendingFilterGroupsProps
  extends Pick<
    SpendingTabProps,
    | "apiFamilies"
    | "connections"
    | "models"
    | "setSpendingApiFamily"
    | "setSpendingConnectionId"
    | "setSpendingFrom"
    | "setSpendingGroupBy"
    | "setSpendingLimit"
    | "setSpendingModelId"
    | "setSpendingOffset"
    | "setSpendingPreset"
    | "setSpendingTo"
    | "setSpendingTopN"
    | "spendingApiFamily"
    | "spendingConnectionId"
    | "spendingFrom"
    | "spendingGroupBy"
    | "spendingLimit"
    | "spendingModelId"
    | "spendingPreset"
    | "spendingTo"
    | "spendingTopN"
  > {
  formatTime: (value: string, options?: Intl.DateTimeFormatOptions) => string;
  onReset: () => void;
  reportCode: string;
  spendingUpdatedAt: string | null;
}

export function SpendingFilterGroups({
  apiFamilies,
  connections,
  formatTime,
  models,
  onReset,
  reportCode,
  setSpendingApiFamily,
  setSpendingConnectionId,
  setSpendingFrom,
  setSpendingGroupBy,
  setSpendingLimit,
  setSpendingModelId,
  setSpendingOffset,
  setSpendingPreset,
  setSpendingTo,
  setSpendingTopN,
  spendingApiFamily,
  spendingConnectionId,
  spendingFrom,
  spendingGroupBy,
  spendingLimit,
  spendingModelId,
  spendingPreset,
  spendingTo,
  spendingTopN,
  spendingUpdatedAt,
}: SpendingFilterGroupsProps) {
  const { messages } = useLocale();

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Filter className="h-3.5 w-3.5" />
        <span>{messages.statistics.filtersApplyToAllSpending}</span>
      </div>

      <div className="grid gap-3 lg:grid-cols-6">
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">{messages.requestLogs.timeRange}</span>
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
              {SPENDING_PRESET_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.value === "today"
                    ? messages.statistics.today
                    : option.value === "last_7_days"
                      ? messages.statistics.last7Days
                      : option.value === "last_30_days"
                        ? messages.statistics.last30Days
                        : option.value === "all"
                          ? messages.statistics.allTime
                          : messages.statistics.customRange}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {spendingPreset === "custom" ? (
          <>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">{messages.statistics.from}</span>
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
              <span className="text-xs text-muted-foreground">{messages.statistics.to}</span>
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
          <span className="text-xs text-muted-foreground">{messages.common.apiFamily}</span>
          <ApiFamilySelect
            value={spendingApiFamily}
            onValueChange={(value) => {
              setSpendingApiFamily(value);
              setSpendingOffset(0);
            }}
            apiFamilies={apiFamilies}
            allLabel={`${messages.statistics.all} ${messages.common.apiFamily}`}
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">{messages.statistics.modelId}</span>
          <Select
            value={spendingModelId || "__all__"}
            onValueChange={(value) => {
              setSpendingModelId(value === "__all__" ? "" : value);
              setSpendingOffset(0);
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder={messages.statistics.modelId} />
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

        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">{messages.statistics.connectionId}</span>
          <Select
            value={spendingConnectionId || "__all__"}
            onValueChange={(value) => {
              setSpendingConnectionId(value === "__all__" ? "" : value);
              setSpendingOffset(0);
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder={messages.statistics.connectionId} />
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
      </div>

      <div className="grid gap-3 lg:grid-cols-4">
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">{messages.statistics.groupBy}</span>
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
              {SPENDING_GROUP_BY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.value === "none"
                    ? messages.statistics.all
                    : option.value === "day"
                      ? messages.statistics.day
                      : option.value === "week"
                        ? messages.statistics.week
                        : option.value === "month"
                          ? messages.statistics.month
                          : option.value === "api_family"
                            ? messages.common.apiFamily
                            : option.value === "model"
                              ? messages.statistics.modelGroup
                              : option.value === "endpoint"
                                ? messages.statistics.endpointGroup
                                : messages.statistics.modelEndpointGroup}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">{messages.statistics.rows}</span>
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
          <span className="text-xs text-muted-foreground">{messages.statistics.topN}</span>
          <Input
            className="h-8 text-xs"
            type="number"
            min={String(MIN_SPENDING_TOP_N)}
            max={String(MAX_SPENDING_TOP_N)}
            value={spendingTopN}
            onChange={(event) => {
              const value = Number.parseInt(event.target.value || String(DEFAULT_SPENDING_TOP_N), 10);
              if (Number.isFinite(value)) {
                setSpendingTopN(
                  Math.min(MAX_SPENDING_TOP_N, Math.max(MIN_SPENDING_TOP_N, value)),
                );
              }
            }}
          />
        </div>

        <div className="flex items-end">
          <Button variant="outline" className="h-8 w-full text-xs" onClick={onReset}>
            {messages.statistics.reset}
          </Button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        {messages.statistics.currency}: <span className="font-medium text-foreground">{reportCode}</span>
        <span className="mx-2">•</span>
        {messages.statistics.updated}:{" "}
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
    </>
  );
}
