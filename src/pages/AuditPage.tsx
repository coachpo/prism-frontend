import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useConnectionNavigation } from "@/hooks/useConnectionNavigation";
import { useProfileContext } from "@/context/ProfileContext";
import type {
  AuditLogDetail,
  AuditLogListItem,
  AuditLogParams,
  ConnectionDropdownItem,
  Provider,
} from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Clock, FileSearch } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";

import { AuditFilters } from "@/pages/audit/AuditFilters";
import { toDatetimeLocalValue } from "@/pages/audit/utils";
import { AuditTable } from "@/pages/audit/AuditTable";
import { AuditDetailSheet } from "@/pages/audit/AuditDetailSheet";

export function AuditPage() {
  const navigate = useNavigate();
  const { navigateToConnection } = useConnectionNavigation();
  const { revision } = useProfileContext();

  const [logs, setLogs] = useState<AuditLogListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [historicalTotal, setHistoricalTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<{ model_id: string; display_name: string | null }[]>([]);
  const [connections, setConnections] = useState<ConnectionDropdownItem[]>([]);

  const [selectedLog, setSelectedLog] = useState<AuditLogDetail | null>(null);
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const [providerId, setProviderId] = useState("all");
  const [modelId, setModelId] = useState("__all__");
  const [connectionId, setConnectionId] = useState("__all__");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [offset, setOffset] = useState(0);
  const limit = 50;

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [modelsData, connectionsData] = await Promise.all([
          api.models.list(),
          api.endpoints.connections(),
        ]);
        setModels(modelsData.map((model) => ({ model_id: model.model_id, display_name: model.display_name })));
        setConnections(connectionsData.items);
      } catch (error) {
        console.error("Failed to fetch filter options:", error);
      }
    };

    fetchFilters();
  }, [revision]);

  useEffect(() => {
    api.providers
      .list()
      .then(setProviders)
      .catch(() => toast.error("Failed to load providers"));
  }, [revision]);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const params: AuditLogParams = { limit, offset };
        if (providerId !== "all") params.provider_id = Number.parseInt(providerId, 10);
        if (modelId !== "__all__") params.model_id = modelId;
        if (connectionId !== "__all__") params.connection_id = Number.parseInt(connectionId, 10);
        if (dateFrom) params.from_time = new Date(dateFrom).toISOString();
        if (dateTo) params.to_time = new Date(dateTo).toISOString();

        const [response, historicalResponse] = await Promise.all([
          api.audit.list(params),
          api.audit.list({ limit: 1, offset: 0 }).catch(() => null),
        ]);

        let items = response.items;
        if (statusFilter === "2xx") {
          items = items.filter((item) => item.response_status >= 200 && item.response_status < 300);
        }
        if (statusFilter === "4xx") {
          items = items.filter((item) => item.response_status >= 400 && item.response_status < 500);
        }
        if (statusFilter === "5xx") {
          items = items.filter((item) => item.response_status >= 500);
        }

        setLogs(items);
        setTotal(response.total);
        setHistoricalTotal(historicalResponse?.total ?? null);
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch audit logs");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [providerId, modelId, connectionId, statusFilter, dateFrom, dateTo, offset, revision]);

  useEffect(() => {
    setOffset(0);
  }, [revision]);

  const metrics = useMemo(() => {
    if (logs.length === 0) {
      return {
        avgDuration: null as number | null,
        errorRate: null as number | null,
      };
    }

    const totalDuration = logs.reduce((sum, log) => sum + log.duration_ms, 0);
    const errorCount = logs.filter((log) => log.response_status >= 400).length;

    return {
      avgDuration: Math.round(totalDuration / logs.length),
      errorRate: (errorCount / logs.length) * 100,
    };
  }, [logs]);

  const providersById = useMemo(
    () => new Map(providers.map((provider) => [provider.id, provider])),
    [providers]
  );

  const isAuditingEnabled = useMemo(
    () => providers.some((provider) => provider.audit_enabled),
    [providers]
  );

  const canEditAuditSettings = providers.length > 0;
  const auditingActionLabel = !isAuditingEnabled && canEditAuditSettings ? "Enable Auditing" : "View Audit Settings";
  const auditConfigPath = "/settings#audit-configuration";

  const applyTimeWindow = (hours: number) => {
    const now = new Date();
    const from = new Date(now.getTime() - hours * 60 * 60 * 1000);
    setDateFrom(toDatetimeLocalValue(from));
    setDateTo(toDatetimeLocalValue(now));
    setOffset(0);
  };

  const expandToAllTime = () => {
    setDateFrom("");
    setDateTo("");
    setOffset(0);
  };

  const clearFilters = () => {
    setProviderId("all");
    setModelId("__all__");
    setConnectionId("__all__");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
    setOffset(0);
  };

  const hasHistoricalLogs = (historicalTotal ?? 0) > 0;
  const isTrueEmpty = logs.length === 0 && !hasHistoricalLogs;
  const isFilterEmpty = logs.length === 0 && hasHistoricalLogs;

  const openDetail = async (id: number) => {
    setSelectedLogId(id);
    setIsSheetOpen(true);
    setDetailLoading(true);
    setSelectedLog(null);

    try {
      const detail = await api.audit.get(id);
      setSelectedLog(detail);
    } catch {
      toast.error("Failed to load audit detail");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSheetOpenChange = (open: boolean) => {
    setIsSheetOpen(open);
    if (!open) {
      setSelectedLogId(null);
      setSelectedLog(null);
      setDetailLoading(false);
    }
  };

  if (loading && logs.length === 0 && historicalTotal === null) {
    return (
      <div className="space-y-[var(--density-page-gap)]">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-[100px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[500px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-[var(--density-page-gap)]">
      <PageHeader
        title="Audit Logs"
        description="Inspect request and response details for debugging and compliance"
      >
        <StatusBadge
          label={isAuditingEnabled ? "Auditing: On" : "Auditing: Off"}
          intent={isAuditingEnabled ? "success" : "muted"}
          className="text-[11px]"
        />
      </PageHeader>

      {!isAuditingEnabled ? (
        <p className="-mt-4 text-xs text-muted-foreground">
          Auditing is currently off. Existing logs are still available, but new requests won't be recorded.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Total Logs"
          value={logs.length.toLocaleString()}
          detail="On current page"
          icon={<FileSearch className="h-4 w-4" />}
        />
        <MetricCard
          label="Avg Duration"
          value={metrics.avgDuration === null ? "-" : `${metrics.avgDuration}ms`}
          detail="On current page"
          icon={<Clock className="h-4 w-4" />}
        />
        <MetricCard
          label="Error Rate"
          value={metrics.errorRate === null ? "-" : `${metrics.errorRate.toFixed(1)}%`}
          detail="On current page"
          icon={<AlertTriangle className="h-4 w-4" />}
          className={metrics.errorRate !== null && metrics.errorRate > 10 ? "[&_span.text-2xl]:text-destructive" : ""}
        />
      </div>

      <AuditFilters
        providers={providers}
        models={models}
        connections={connections}
        providerId={providerId}
        setProviderId={setProviderId}
        modelId={modelId}
        setModelId={setModelId}
        connectionId={connectionId}
        setConnectionId={setConnectionId}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        setOffset={setOffset}
      />

      <Card>
        <CardContent className="p-0">
          {!isAuditingEnabled && hasHistoricalLogs ? (
            <div className="border-b bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
              Auditing is off - showing previously recorded logs.
            </div>
          ) : null}

          {isTrueEmpty ? (
            <EmptyState
              icon={<FileSearch className="h-6 w-6" />}
              title="No audit logs yet"
              description={
                isAuditingEnabled
                  ? "Audit logs appear here for requests recorded while auditing is enabled."
                  : "Audit logs appear here for requests recorded while auditing is enabled. Auditing is currently off, so new requests won't be recorded."
              }
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button size="sm" onClick={() => navigate(auditConfigPath)}>
                    {auditingActionLabel}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate(auditConfigPath)}>
                    Learn what's captured
                  </Button>
                </div>
              }
            />
          ) : isFilterEmpty ? (
            <EmptyState
              icon={<FileSearch className="h-6 w-6" />}
              title="No audit logs for the selected filters"
              description="Try expanding the time range or clearing filters."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => applyTimeWindow(24)}>
                    Last 24h
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => applyTimeWindow(24 * 7)}>
                    Expand to 7d
                  </Button>
                  <Button variant="outline" size="sm" onClick={expandToAllTime}>
                    Expand to All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                </div>
              }
            />
          ) : (
            <AuditTable
              logs={logs}
              providersById={providersById}
              isSheetOpen={isSheetOpen}
              selectedLogId={selectedLogId}
              openDetail={openDetail}
              offset={offset}
              limit={limit}
              total={total}
              setOffset={setOffset}
            />
          )}
        </CardContent>
      </Card>

      <AuditDetailSheet
        isSheetOpen={isSheetOpen}
        handleSheetOpenChange={handleSheetOpenChange}
        detailLoading={detailLoading}
        selectedLog={selectedLog}
        navigateToConnection={navigateToConnection}
      />
    </div>
  );
}
