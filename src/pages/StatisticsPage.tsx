import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import type {
  ConnectionDropdownItem,
  RequestLogEntry,
  SpendingGroupBy,
  SpendingReportResponse,
} from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProfileContext } from "@/context/ProfileContext";
import {
  DEFAULT_SPENDING_LIMIT,
  DEFAULT_SPENDING_TOP_N,
  OPERATIONS_STATUS_FILTERS,
  OPERATIONS_TIME_RANGES,
  SPENDING_GROUP_BY_OPTIONS,
  SPENDING_PRESETS,
  STATISTICS_TABS,
  type OperationsStatusFilter,
  type SpecialTokenFilter,
  parseBoundedIntParam,
  parseConnectionFilterParam,
  parseEnumParam,
  parseNonNegativeIntParam,
  parseSpendingConnectionParam,
  parseSpendingLimitParam,
  OPERATIONS_SPECIAL_TOKEN_FILTERS,
} from "./statistics/queryParams";
import { toIsoFromDateInput } from "./statistics/utils";
import { OperationsTab } from "./statistics/OperationsTab";
import { SpendingTab } from "./statistics/SpendingTab";

export function StatisticsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"operations" | "spending">(() =>
    parseEnumParam(searchParams.get("tab"), STATISTICS_TABS, "operations")
  );

  const [logs, setLogs] = useState<RequestLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { revision } = useProfileContext();

  const initialOperationsModelId = searchParams.get("model_id");
  const initialOperationsProviderType = searchParams.get("provider_type");
  const initialSpendingProviderType = searchParams.get("spending_provider_type");

  const [modelId, setModelId] = useState(
    initialOperationsModelId && initialOperationsModelId.trim() !== ""
      ? initialOperationsModelId
      : "__all__"
  );
  const [connectionId, setConnectionId] = useState(() =>
    parseConnectionFilterParam(searchParams.get("connection_id"))
  );
  const [providerType, setProviderType] = useState<string>(
    initialOperationsProviderType && initialOperationsProviderType.trim() !== ""
      ? initialOperationsProviderType
      : "all"
  );
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d" | "all">(() =>
    parseEnumParam(searchParams.get("time_range"), OPERATIONS_TIME_RANGES, "24h")
  );
  const [specialTokenFilter, setSpecialTokenFilter] = useState<SpecialTokenFilter>(() =>
    parseEnumParam(
      searchParams.get("special_token_filter"),
      OPERATIONS_SPECIAL_TOKEN_FILTERS,
      "all"
    )
  );
  const [operationsStatusFilter, setOperationsStatusFilter] = useState<OperationsStatusFilter>(() =>
    parseEnumParam(searchParams.get("status_filter"), OPERATIONS_STATUS_FILTERS, "all")
  );

  const [spending, setSpending] = useState<SpendingReportResponse | null>(null);
  const [spendingLoading, setSpendingLoading] = useState(false);
  const [spendingError, setSpendingError] = useState<string | null>(null);
  const [spendingUpdatedAt, setSpendingUpdatedAt] = useState<string | null>(null);
  const [spendingPreset, setSpendingPreset] = useState<
    "today" | "last_7_days" | "last_30_days" | "custom" | "all"
  >(() => parseEnumParam(searchParams.get("spending_preset"), SPENDING_PRESETS, "last_7_days"));
  const [spendingFrom, setSpendingFrom] = useState(searchParams.get("spending_from") ?? "");
  const [spendingTo, setSpendingTo] = useState(searchParams.get("spending_to") ?? "");
  const [spendingProviderType, setSpendingProviderType] = useState(
    initialSpendingProviderType && initialSpendingProviderType.trim() !== ""
      ? initialSpendingProviderType
      : "all"
  );
  const [spendingModelId, setSpendingModelId] = useState(searchParams.get("spending_model_id") ?? "");
  const [spendingConnectionId, setSpendingConnectionId] = useState(() =>
    parseSpendingConnectionParam(searchParams.get("spending_connection_id"))
  );
  const [spendingGroupBy, setSpendingGroupBy] =
    useState<SpendingGroupBy>(() =>
      parseEnumParam(
        searchParams.get("spending_group_by"),
        SPENDING_GROUP_BY_OPTIONS,
        "model"
      )
    );
  const [spendingLimit, setSpendingLimit] = useState(() =>
    parseSpendingLimitParam(searchParams.get("spending_limit"))
  );
  const [spendingOffset, setSpendingOffset] = useState(() =>
    parseNonNegativeIntParam(searchParams.get("spending_offset"), 0)
  );
  const [spendingTopN, setSpendingTopN] = useState(() =>
    parseBoundedIntParam(searchParams.get("spending_top_n"), DEFAULT_SPENDING_TOP_N, 1, 50)
  );
  const [models, setModels] = useState<{ model_id: string; display_name: string | null }[]>([]);
  const [connections, setConnections] = useState<ConnectionDropdownItem[]>([]);


  // Fetch models and connections for filter dropdowns
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [modelsData, connectionsData] = await Promise.all([
          api.models.list(),
          api.endpoints.connections(),
        ]);
        setModels(modelsData.map(m => ({ model_id: m.model_id, display_name: m.display_name })));
        setConnections(connectionsData.items);
      } catch (error) {
        console.error("Failed to fetch filter options:", error);
      }
    };
    fetchFilters();
  }, [revision]);

  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const setOrDelete = (key: string, value: string, defaultValue?: string) => {
          if (!value || (defaultValue !== undefined && value === defaultValue)) {
            next.delete(key);
            return;
          }
          next.set(key, value);
        };

        setOrDelete("tab", activeTab, "operations");
        setOrDelete("time_range", timeRange, "24h");
        setOrDelete("model_id", modelId, "__all__");
        setOrDelete("provider_type", providerType, "all");
        setOrDelete("connection_id", connectionId, "__all__");
        setOrDelete("special_token_filter", specialTokenFilter, "all");
        setOrDelete("status_filter", operationsStatusFilter, "all");

        setOrDelete("spending_preset", spendingPreset, "last_7_days");
        if (spendingPreset === "custom") {
          setOrDelete("spending_from", spendingFrom);
          setOrDelete("spending_to", spendingTo);
        } else {
          next.delete("spending_from");
          next.delete("spending_to");
        }
        setOrDelete("spending_provider_type", spendingProviderType, "all");
        setOrDelete("spending_model_id", spendingModelId);
        setOrDelete("spending_connection_id", spendingConnectionId);
        setOrDelete("spending_group_by", spendingGroupBy, "model");

        if (spendingLimit === DEFAULT_SPENDING_LIMIT) next.delete("spending_limit");
        else next.set("spending_limit", String(spendingLimit));

        if (spendingOffset <= 0) next.delete("spending_offset");
        else next.set("spending_offset", String(spendingOffset));

        if (spendingTopN === DEFAULT_SPENDING_TOP_N) next.delete("spending_top_n");
        else next.set("spending_top_n", String(spendingTopN));

        return next.toString() === prev.toString() ? prev : next;
      },
      { replace: true }
    );
  }, [
    activeTab,
    connectionId,
    modelId,
    providerType,
    setSearchParams,
    specialTokenFilter,
    spendingConnectionId,
    spendingFrom,
    spendingGroupBy,
    spendingLimit,
    spendingModelId,
    spendingOffset,
    spendingPreset,
    spendingProviderType,
    spendingTo,
    spendingTopN,
    operationsStatusFilter,
    timeRange,
  ]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const fetchData = async () => {
        setLoading(true);
        try {
          let fromTime: string | undefined;
          const now = new Date();
          if (timeRange === "1h") {
            fromTime = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
          } else if (timeRange === "24h") {
            fromTime = new Date(
              now.getTime() - 24 * 60 * 60 * 1000
            ).toISOString();
          } else if (timeRange === "7d") {
            fromTime = new Date(
              now.getTime() - 7 * 24 * 60 * 60 * 1000
            ).toISOString();
          }

          const params = {
            model_id: modelId && modelId !== "__all__" ? modelId : undefined,
            provider_type: providerType === "all" ? undefined : providerType,
            connection_id: connectionId && connectionId !== "__all__" ? Number.parseInt(connectionId, 10) : undefined,
            from_time: fromTime,
            limit: 500,
          };

          const logsData = await api.stats.requests(params);
          setLogs(logsData.items);
        } catch (error) {
          console.error("Failed to fetch statistics:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, 450);

    return () => clearTimeout(timeout);
  }, [connectionId, modelId, providerType, setLoading, timeRange, revision]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const fetchSpending = async () => {
        setSpendingLoading(true);
        setSpendingError(null);
        try {
          const response = await api.stats.spending({
            preset: spendingPreset,
            from_time:
              spendingPreset === "custom"
                ? toIsoFromDateInput(spendingFrom, "start")
                : undefined,
            to_time:
              spendingPreset === "custom"
                ? toIsoFromDateInput(spendingTo, "end")
                : undefined,
            provider_type:
              spendingProviderType === "all" ? undefined : spendingProviderType,
            model_id: spendingModelId || undefined,
            connection_id: spendingConnectionId
              ? Number.parseInt(spendingConnectionId, 10)
              : undefined,
            group_by: spendingGroupBy,
            limit: spendingLimit,
            offset: spendingOffset,
            top_n: spendingTopN,
          });
          setSpending(response);
          setSpendingUpdatedAt(new Date().toISOString());
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to fetch spending report";
          setSpendingError(message);
        } finally {
          setSpendingLoading(false);
        }
      };

      fetchSpending();
    }, 300);

    return () => clearTimeout(timeout);
  }, [
    spendingPreset,
    spendingFrom,
    spendingTo,
    spendingProviderType,
    spendingModelId,
    spendingConnectionId,
    spendingGroupBy,
    spendingLimit,
    spendingOffset,
    spendingTopN,
    revision,
  ]);

  useEffect(() => {
    setSpendingOffset(0);
  }, [revision]);

  if (loading && logs.length === 0 && spending === null && spendingLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[100px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statistics"
        description="Operational metrics and spending analytics"
      />

      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "operations" | "spending")
        }
      >
        <TabsList className="w-fit">
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="spending">Spending</TabsTrigger>
        </TabsList>

        <TabsContent value="operations">
          <OperationsTab
            logs={logs}
            models={models}
            connections={connections}
            modelId={modelId}
            setModelId={setModelId}
            providerType={providerType}
            setProviderType={setProviderType}
            connectionId={connectionId}
            setConnectionId={setConnectionId}
            timeRange={timeRange}
            setTimeRange={setTimeRange}
            specialTokenFilter={specialTokenFilter}
            setSpecialTokenFilter={setSpecialTokenFilter}
            operationsStatusFilter={operationsStatusFilter}
            setOperationsStatusFilter={setOperationsStatusFilter}
          />
        </TabsContent>

        <TabsContent value="spending">
          <SpendingTab
            spending={spending}
            spendingLoading={spendingLoading}
            spendingError={spendingError}
            spendingUpdatedAt={spendingUpdatedAt}
            spendingPreset={spendingPreset}
            setSpendingPreset={setSpendingPreset}
            spendingFrom={spendingFrom}
            setSpendingFrom={setSpendingFrom}
            spendingTo={spendingTo}
            setSpendingTo={setSpendingTo}
            spendingProviderType={spendingProviderType}
            setSpendingProviderType={setSpendingProviderType}
            spendingModelId={spendingModelId}
            setSpendingModelId={setSpendingModelId}
            spendingConnectionId={spendingConnectionId}
            setSpendingConnectionId={setSpendingConnectionId}
            spendingGroupBy={spendingGroupBy}
            setSpendingGroupBy={setSpendingGroupBy}
            spendingLimit={spendingLimit}
            setSpendingLimit={setSpendingLimit}
            spendingOffset={spendingOffset}
            setSpendingOffset={setSpendingOffset}
            spendingTopN={spendingTopN}
            setSpendingTopN={setSpendingTopN}
            models={models}
            connections={connections}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
