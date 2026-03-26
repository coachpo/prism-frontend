import { Skeleton } from "@/components/ui/skeleton";
import { CircleDollarSign } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { useTimezone } from "@/hooks/useTimezone";
import { useLocale } from "@/i18n/useLocale";
import { SpendingBreakdownTable } from "./spending/SpendingBreakdownTable";
import { SpendingFiltersCard } from "./spending/SpendingFiltersCard";
import { SpendingSummaryMetrics } from "./spending/SpendingSummaryMetrics";
import type { SpendingTabProps } from "./spending/spendingTabProps";
import { SpendingVisualizations } from "./spending/SpendingVisualizations";
import { useSpendingTabData } from "./spending/useSpendingTabData";
import { SpendingTabFilters } from "./SpendingTabFilters";

export function SpendingTab({
  spending,
  spendingLoading,
  spendingError,
  spendingPreset,
  setSpendingPreset,
  spendingFrom,
  setSpendingFrom,
  spendingTo,
  setSpendingTo,
  spendingApiFamily,
  setSpendingApiFamily,
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
  spendingUpdatedAt,
  models,
  connections,
  apiFamilies,
  clearSpendingFilters,
  manualRefresh,
}: SpendingTabProps) {
  const { format: formatTime } = useTimezone();
  const { messages } = useLocale();

  const { reportSymbol, reportCode, canPaginateForward, scatterData, insights } =
    useSpendingTabData(spending, spendingOffset, spendingLimit);

  return (
    <div className="space-y-6">
      <SpendingTabFilters
        spendingPreset={spendingPreset}
        setSpendingPreset={setSpendingPreset}
        spendingFrom={spendingFrom}
        setSpendingFrom={setSpendingFrom}
        spendingTo={spendingTo}
        setSpendingTo={setSpendingTo}
        spendingApiFamily={spendingApiFamily}
        setSpendingApiFamily={setSpendingApiFamily}
        spendingModelId={spendingModelId}
        setSpendingModelId={setSpendingModelId}
        spendingConnectionId={spendingConnectionId}
        setSpendingConnectionId={setSpendingConnectionId}
        spendingGroupBy={spendingGroupBy}
        setSpendingGroupBy={setSpendingGroupBy}
        clearFilters={clearSpendingFilters}
        refresh={manualRefresh}
        models={models}
        apiFamilies={apiFamilies}
        connections={connections}
      />

      <SpendingFiltersCard
        apiFamilies={apiFamilies}
        connections={connections}
        formatTime={formatTime}
        models={models}
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
              title={messages.statistics.noSpendingDataFound}
              description={messages.statistics.adjustFiltersOrTimeRange}
            />
          )}
        </>
      ) : null}
    </div>
  );
}
