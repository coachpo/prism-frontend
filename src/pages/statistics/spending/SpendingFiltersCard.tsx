import { Card, CardContent } from "@/components/ui/card";
import {
  DEFAULT_SPENDING_LIMIT,
  DEFAULT_SPENDING_TOP_N,
} from "../queryParams";
import type { SpendingTabProps } from "./spendingTabProps";
import { SpendingFilterGroups } from "./SpendingFilterGroups";

interface SpendingFiltersCardProps
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
  reportCode: string;
  spendingUpdatedAt: string | null;
}

export function SpendingFiltersCard({
  apiFamilies,
  connections,
  formatTime,
  models,
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
}: SpendingFiltersCardProps) {
  const handleReset = () => {
    setSpendingPreset("last_7_days");
    setSpendingFrom("");
    setSpendingTo("");
    setSpendingApiFamily("all");
    setSpendingModelId("");
    setSpendingConnectionId("");
    setSpendingGroupBy("model");
    setSpendingLimit(DEFAULT_SPENDING_LIMIT);
    setSpendingOffset(0);
    setSpendingTopN(DEFAULT_SPENDING_TOP_N);
  };

  return (
    <Card className="sticky top-4 z-10 border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <CardContent className="space-y-3 p-4">
        <SpendingFilterGroups
          apiFamilies={apiFamilies}
          connections={connections}
          formatTime={formatTime}
          models={models}
          onReset={handleReset}
          reportCode={reportCode}
          setSpendingApiFamily={setSpendingApiFamily}
          setSpendingConnectionId={setSpendingConnectionId}
          setSpendingFrom={setSpendingFrom}
          setSpendingGroupBy={setSpendingGroupBy}
          setSpendingLimit={setSpendingLimit}
          setSpendingModelId={setSpendingModelId}
          setSpendingOffset={setSpendingOffset}
          setSpendingPreset={setSpendingPreset}
          setSpendingTo={setSpendingTo}
          setSpendingTopN={setSpendingTopN}
          spendingApiFamily={spendingApiFamily}
          spendingConnectionId={spendingConnectionId}
          spendingFrom={spendingFrom}
          spendingGroupBy={spendingGroupBy}
          spendingLimit={spendingLimit}
          spendingModelId={spendingModelId}
          spendingPreset={spendingPreset}
          spendingTo={spendingTo}
          spendingTopN={spendingTopN}
          spendingUpdatedAt={spendingUpdatedAt}
        />
      </CardContent>
    </Card>
  );
}
