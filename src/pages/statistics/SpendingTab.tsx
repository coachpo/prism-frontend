import { Skeleton } from "@/components/ui/skeleton";
import { CircleDollarSign } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { useTimezone } from "@/hooks/useTimezone";
import { SpendingBreakdownTable } from "./spending/SpendingBreakdownTable";
import { SpendingFiltersCard } from "./spending/SpendingFiltersCard";
import { SpendingSummaryMetrics } from "./spending/SpendingSummaryMetrics";
import type { SpendingTabProps } from "./spending/spendingTabProps";
import { SpendingVisualizations } from "./spending/SpendingVisualizations";
import { useSpendingTabData } from "./spending/useSpendingTabData";

export function SpendingTab({
  spending,
  spendingLoading,
  spendingError,
  spendingUpdatedAt,
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
  spendingLimit,
  setSpendingLimit,
  spendingOffset,
  setSpendingOffset,
  spendingTopN,
  setSpendingTopN,
  models,
  connections,
}: SpendingTabProps) {
  const { format: formatTime } = useTimezone();

  const { reportSymbol, reportCode, canPaginateForward, scatterData, insights } =
    useSpendingTabData(spending, spendingOffset, spendingLimit);

  return (
    <div className="space-y-6">
      <SpendingFiltersCard
        connections={connections}
        formatTime={formatTime}
        models={models}
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

      {spendingError && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {spendingError}
        </div>
      )}

      {spendingLoading && !spending ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-[100px] rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      ) : spending ? (
        <>
          <SpendingSummaryMetrics reportCode={reportCode} reportSymbol={reportSymbol} spending={spending} />

          <SpendingVisualizations
            insights={insights}
            reportCode={reportCode}
            reportSymbol={reportSymbol}
            scatterData={scatterData}
            spending={spending}
            spendingGroupBy={spendingGroupBy}
            spendingTopN={spendingTopN}
          />

          {spending.groups.length > 0 ? (
            <SpendingBreakdownTable
              canPaginateForward={canPaginateForward}
              reportCode={reportCode}
              reportSymbol={reportSymbol}
              setSpendingOffset={setSpendingOffset}
              spending={spending}
              spendingLimit={spendingLimit}
              spendingOffset={spendingOffset}
            />
          ) : (
            <EmptyState
              icon={<CircleDollarSign className="h-6 w-6" />}
              title="No spending data found"
              description="Try adjusting your filters or time range."
            />
          )}
        </>
      ) : null}
    </div>
  );
}
