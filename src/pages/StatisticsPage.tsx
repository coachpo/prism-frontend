import { PageHeader } from "@/components/PageHeader";
import { useProfileContext } from "@/context/ProfileContext";
import { useLocale } from "@/i18n/useLocale";
import { UsageStatisticsPageSkeleton } from "./statistics/UsageStatisticsPageSkeleton";
import { UsageControlsBar } from "./statistics/sections/UsageControlsBar";
import { UsageOverviewSection } from "./statistics/sections/UsageOverviewSection";
import { UsageModelLineSelectorSection } from "./statistics/sections/UsageModelLineSelectorSection";
import { UsageServiceHealthSection } from "./statistics/sections/UsageServiceHealthSection";
import { UsageTrendsSection } from "./statistics/sections/UsageTrendsSection";
import { UsageBreakdownSection } from "./statistics/sections/UsageBreakdownSection";
import { EndpointStatisticsTable } from "./statistics/tables/EndpointStatisticsTable";
import { ModelStatisticsTable } from "./statistics/tables/ModelStatisticsTable";
import { ProxyApiKeyStatisticsTable } from "./statistics/tables/ProxyApiKeyStatisticsTable";
import { useUsageStatisticsPageData } from "./statistics/useUsageStatisticsPageData";
import { useUsageStatisticsPageState } from "./statistics/useUsageStatisticsPageState";

function downloadSnapshotJson(snapshot: unknown) {
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "prism-usage-snapshot.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function StatisticsPage() {
  const { revision, selectedProfile } = useProfileContext();
  const { messages } = useLocale();
  const state = useUsageStatisticsPageState();
  const data = useUsageStatisticsPageData({
    revision,
    selectedProfileId: selectedProfile?.id ?? null,
    state: state.state,
  });

  const snapshot = data.snapshot;

  return (
    <div className="space-y-5">
      <PageHeader
        description={messages.statistics.statisticsDescription}
        title={messages.statistics.statisticsTitle}
      />

      <UsageControlsBar
        generatedAt={snapshot?.generated_at ?? null}
        loading={data.loading}
        onExportSnapshot={() => {
          if (!snapshot) {
            return;
          }
          downloadSnapshotJson(snapshot);
        }}
        onRefresh={() => {
          void data.refresh();
        }}
        onSelectTimeRange={state.setSelectedTimeRange}
        selectedTimeRange={state.state.selectedTimeRange}
      />

      {data.loading && snapshot === null ? <UsageStatisticsPageSkeleton /> : null}

      {data.error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {data.error}
        </div>
      ) : null}

      {snapshot ? (
        <div className="space-y-6">
          <UsageOverviewSection
            currency={snapshot.currency}
            overview={snapshot.overview}
            requestTrendSeries={data.requestTrendSeries}
            tokenUsageTrendSeries={data.tokenUsageTrendSeries}
          />

          <UsageModelLineSelectorSection
            availableModelLineIds={data.availableModelLineIds}
            onSetSelectedModelLines={state.setSelectedModelLines}
            selectedModelLineIds={data.selectedModelLineIds}
          />

          <UsageServiceHealthSection serviceHealth={snapshot.service_health} />

          <UsageTrendsSection
            chartGranularity={{
              requestTrends: state.state.chartGranularity.requestTrends,
              tokenUsageTrends: state.state.chartGranularity.tokenUsageTrends,
            }}
            onSetChartGranularity={state.setChartGranularity}
            requestTrendSeries={data.requestTrendSeries}
            tokenUsageTrendSeries={data.tokenUsageTrendSeries}
          />

          <UsageBreakdownSection
            chartGranularity={{
              costOverview: state.state.chartGranularity.costOverview,
              tokenTypeBreakdown: state.state.chartGranularity.tokenTypeBreakdown,
            }}
            costOverview={snapshot.cost_overview}
            costOverviewSeries={data.costOverviewSeries}
            currency={snapshot.currency}
            endpointStatistics={snapshot.endpoint_statistics}
            modelStatistics={snapshot.model_statistics}
            onSetChartGranularity={state.setChartGranularity}
            tokenTypeBreakdown={data.tokenTypeBreakdown}
          />

          <div className="grid gap-6 2xl:grid-cols-2">
            <EndpointStatisticsTable currency={snapshot.currency} items={snapshot.endpoint_statistics} />
            <ModelStatisticsTable currency={snapshot.currency} items={snapshot.model_statistics} />
          </div>

          <ProxyApiKeyStatisticsTable
            currency={snapshot.currency}
            items={snapshot.proxy_api_key_statistics}
          />
        </div>
      ) : null}
    </div>
  );
}
