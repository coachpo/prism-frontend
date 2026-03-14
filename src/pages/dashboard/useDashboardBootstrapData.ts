import { useCallback, useState } from "react";
import { api } from "@/lib/api";
import type {
  ModelConfigListItem,
  RequestLogEntry,
  SpendingReportResponse,
  StatsSummary,
} from "@/lib/types";
import { buildRoutingDiagramData, type RoutingDiagramData } from "./routingDiagram";
import { getEmptyRoutingDiagramData } from "./dashboardDataUtils";

type Params = {
  latestDashboardRequestIdRef: React.MutableRefObject<number>;
};

export function useDashboardBootstrapData({ latestDashboardRequestIdRef }: Params) {
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState<ModelConfigListItem[]>([]);
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [providerStats, setProviderStats] = useState<StatsSummary | null>(null);
  const [spending, setSpending] = useState<SpendingReportResponse | null>(null);
  const [recentRequests, setRecentRequests] = useState<RequestLogEntry[]>([]);
  const [routingDiagramData, setRoutingDiagramData] = useState<RoutingDiagramData | null>(null);
  const [routingDiagramLoading, setRoutingDiagramLoading] = useState(true);
  const [routingDiagramError, setRoutingDiagramError] = useState<string | null>(null);
  const requestVersionRef = useState(() => ({ current: 0 }))[0];

  const fetchDashboardData = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      const requestVersion = ++requestVersionRef.current;

      if (!silent) {
        setLoading(true);
        setRoutingDiagramLoading(true);
      }

      setRoutingDiagramError(null);
      const from24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const to24h = new Date().toISOString();
      const modelsPromise = api.models.list();
      const routeSuccessRatesPromise = api.stats.connectionSuccessRates({
        from_time: from24h,
        to_time: to24h,
      });

      const routingDiagramPromise = (async () => {
        const [modelsData, routeSuccessRates] = await Promise.all([
          modelsPromise,
          routeSuccessRatesPromise,
        ]);
        const connectionResults = await Promise.allSettled(
          modelsData.map(async (model) => ({
            model,
            connections: await api.connections.list(model.id),
          }))
        );
        const connectionsByModel = connectionResults.flatMap((result) =>
          result.status === "fulfilled" ? [result.value] : []
        );

        const failedConnectionFetches = connectionResults.length - connectionsByModel.length;
        const issues: string[] = [];
        if (failedConnectionFetches > 0) {
          issues.push(
            `Skipped ${failedConnectionFetches} model${failedConnectionFetches === 1 ? "" : "s"} because connection data could not be loaded.`
          );
        }

        const trafficResult = await api.stats.spending({
          preset: "custom",
          from_time: from24h,
          to_time: to24h,
          group_by: "model_endpoint",
          limit: 500,
        });

        return {
          data: buildRoutingDiagramData({
            connectionsByModel,
            connectionSuccessRates: routeSuccessRates,
            trafficGroups: trafficResult.groups,
          }),
          error: issues.length > 0 ? issues.join(" ") : null,
        };
      })();

      try {
        const [modelsData, statsData, providerStatsData, spendingData, requestsData] = await Promise.all([
          modelsPromise,
          api.stats.summary({ from_time: from24h }),
          api.stats.summary({ from_time: from24h, group_by: "provider" }),
          api.stats.spending({ preset: "last_30_days", top_n: 5 }),
          api.stats.requests({ limit: 12 }),
        ]);

        if (requestVersion !== requestVersionRef.current) {
          return;
        }

        setModels(modelsData);
        setStats(statsData);
        setProviderStats(providerStatsData);
        setSpending(spendingData);
        setRecentRequests(requestsData.items);
        latestDashboardRequestIdRef.current = requestsData.items.reduce(
          (maxId, request) => Math.max(maxId, request.id),
          0
        );
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        if (requestVersion === requestVersionRef.current) {
          setLoading(false);
        }
      }

      try {
        const routingResult = await routingDiagramPromise;
        if (requestVersion !== requestVersionRef.current) {
          return;
        }

        setRoutingDiagramData(routingResult.data);
        setRoutingDiagramError(routingResult.error);
      } catch (error) {
        console.error("Failed to fetch routing diagram data", error);
        if (requestVersion === requestVersionRef.current) {
          setRoutingDiagramData(getEmptyRoutingDiagramData());
          setRoutingDiagramError(
            "Routing diagram data could not be loaded. The rest of the dashboard is still available."
          );
        }
      } finally {
        if (requestVersion === requestVersionRef.current) {
          setRoutingDiagramLoading(false);
        }
      }
    },
    [latestDashboardRequestIdRef, requestVersionRef]
  );

  return {
    fetchDashboardData,
    loading,
    models,
    providerStats,
    recentRequests,
    routingDiagramData,
    routingDiagramError,
    routingDiagramLoading,
    setRecentRequests,
    setSpending,
    setStats,
    spending,
    stats,
  };
}
