import { useNavigate } from "react-router-dom";
import { useProfileContext } from "@/context/ProfileContext";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatisticsPageSkeleton } from "./statistics/StatisticsPageSkeleton";
import { OperationsTab } from "./statistics/OperationsTab";
import { SpendingTab } from "./statistics/SpendingTab";
import { ThroughputTab } from "./statistics/ThroughputTab";
import type { StatisticsTab } from "./statistics/queryParams";
import { useStatisticsPageData } from "./statistics/useStatisticsPageData";
import { useStatisticsPageState } from "./statistics/useStatisticsPageState";

export function StatisticsPage() {
  const { revision } = useProfileContext();
  const navigate = useNavigate();
  const state = useStatisticsPageState(revision);
  const data = useStatisticsPageData({
    revision,
    state,
  });

  if (data.showInitialLoading) {
    return <StatisticsPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statistics"
        description="Operational metrics and spending analytics"
      />

      <Tabs
        value={state.activeTab}
        onValueChange={(value) => state.setActiveTab(value as StatisticsTab)}
      >
        <TabsList className="w-fit">
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="throughput">Throughput</TabsTrigger>
          <TabsTrigger value="spending">Spending</TabsTrigger>
        </TabsList>

        <TabsContent value="operations">
          <OperationsTab
            {...data.operationsTabProps}
            onViewInRequestLogs={(requestId) => navigate(`/request-logs?request_id=${requestId}&detail_tab=overview`)}
          />
        </TabsContent>

        <TabsContent value="throughput">
          <ThroughputTab
            data={data.throughput}
            isLoading={data.throughputLoading}
            manualRefresh={data.refreshThroughput}
          />
        </TabsContent>
        <TabsContent value="spending">
          <SpendingTab {...data.spendingTabProps} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
