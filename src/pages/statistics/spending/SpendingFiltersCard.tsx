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
  const handleReset = () => {
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
  };

  return (
    <Card className="sticky top-4 z-10 border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <CardContent className="space-y-3 p-4">
        <SpendingFilterGroups
          connections={connections}
          formatTime={formatTime}
          models={models}
          onReset={handleReset}
          providers={providers}
          reportCode={reportCode}
          setSpendingConnectionId={setSpendingConnectionId}
          setSpendingFrom={setSpendingFrom}
          setSpendingGroupBy={setSpendingGroupBy}
          setSpendingLimit={setSpendingLimit}
          setSpendingModelId={setSpendingModelId}
          setSpendingOffset={setSpendingOffset}
          setSpendingPreset={setSpendingPreset}
          setSpendingProviderType={setSpendingProviderType}
          setSpendingTo={setSpendingTo}
          setSpendingTopN={setSpendingTopN}
          spendingConnectionId={spendingConnectionId}
          spendingFrom={spendingFrom}
          spendingGroupBy={spendingGroupBy}
          spendingLimit={spendingLimit}
          spendingModelId={spendingModelId}
          spendingPreset={spendingPreset}
          spendingProviderType={spendingProviderType}
          spendingTo={spendingTo}
          spendingTopN={spendingTopN}
          spendingUpdatedAt={spendingUpdatedAt}
        />
      </CardContent>
    </Card>
  );
}
