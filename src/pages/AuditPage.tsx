import { useTimezone } from "@/hooks/useTimezone";
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
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  StatusBadge,
  TypeBadge,
  ValueBadge,
  type BadgeIntent,
} from "@/components/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Copy,
  Eye,
  FileSearch,
  Filter,
  Loader2,
  Search,
  WrapText,
  X,
} from "lucide-react";
import { ProviderIcon } from "@/components/ProviderIcon";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ProviderSelect } from "@/components/ProviderSelect";
import { toast } from "sonner";

function formatJson(raw: string | null): string {
  if (!raw) return "";
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

function statusIntent(status: number): BadgeIntent {
  if (status >= 200 && status < 300) return "success";
  if (status >= 400 && status < 500) return "warning";
  if (status >= 500) return "danger";
  return "muted";
}

function methodIntent(method: string): BadgeIntent {
  switch (method.toUpperCase()) {
    case "GET":
      return "blue";
    case "POST":
      return "success";
    case "PUT":
      return "warning";
    case "DELETE":
      return "danger";
    default:
      return "muted";
  }
}

function formatRequestPath(requestUrl: string): string {
  try {
    const url = new URL(requestUrl);
    return `${url.pathname}${url.search}`;
  } catch {
    return requestUrl;
  }
}

function toDatetimeLocalValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatFilterDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

type HighlightSegment = {
  text: string;
  match: boolean;
};

function getHighlightSegments(text: string, query: string): { segments: HighlightSegment[]; count: number } {
  if (!query) {
    return { segments: [{ text, match: false }], count: 0 };
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  if (lowerQuery.length === 0) {
    return { segments: [{ text, match: false }], count: 0 };
  }

  const segments: HighlightSegment[] = [];
  let cursor = 0;
  let count = 0;

  while (cursor < text.length) {
    const matchIndex = lowerText.indexOf(lowerQuery, cursor);
    if (matchIndex === -1) {
      segments.push({ text: text.slice(cursor), match: false });
      break;
    }

    if (matchIndex > cursor) {
      segments.push({ text: text.slice(cursor, matchIndex), match: false });
    }

    const end = matchIndex + lowerQuery.length;
    segments.push({ text: text.slice(matchIndex, end), match: true });
    count += 1;
    cursor = end;
  }

  if (segments.length === 0) {
    segments.push({ text, match: false });
  }

  return { segments, count };
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleCopy}>
      {copied ? (
        <Check className="h-3.5 w-3.5 text-success" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}

interface BodyInspectorProps {
  content: string | null;
  emptyMessage: string;
}

function BodyInspector({ content, emptyMessage }: BodyInspectorProps) {
  const [mode, setMode] = useState<"pretty" | "raw">("pretty");
  const [wrap, setWrap] = useState(true);
  const [query, setQuery] = useState("");

  const rawContent = content ?? "";
  const prettyContent = useMemo(() => formatJson(rawContent), [rawContent]);
  const displayContent = mode === "pretty" ? prettyContent : rawContent;


  const { segments, count } = useMemo(
    () => getHighlightSegments(displayContent, query),
    [displayContent, query]
  );

  if (!content) {
    return (
      <div className="p-3 border border-dashed rounded-lg text-xs text-muted-foreground italic">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/30 p-2">
        <div className="flex items-center gap-1">
          <Button
            variant={mode === "pretty" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setMode("pretty")}
          >
            Pretty
          </Button>
          <Button
            variant={mode === "raw" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setMode("raw")}
          >
            Raw
          </Button>
          <Button
            variant={wrap ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setWrap((prev) => !prev)}
          >
            <WrapText className="h-3 w-3" />
            Wrap
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find in body"
              className="h-7 w-[150px] pl-7 text-xs"
              aria-label="Find in body"
            />
          </div>
          {query ? (
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {count} match{count === 1 ? "" : "es"}
            </span>
          ) : null}
          <CopyButton text={displayContent} />
        </div>
      </div>

      <pre
        className={cn(
          "bg-muted p-3 rounded-lg text-xs font-mono overflow-auto max-h-[40vh] scrollbar-thin",
          wrap ? "whitespace-pre-wrap break-all" : "whitespace-pre"
        )}
      >
        {segments.map((segment, index) =>
          segment.match ? (
            <mark
              key={`${index}-${segment.text}`}
              className="rounded-sm bg-yellow-200 px-0.5 text-black dark:bg-yellow-700 dark:text-white"
            >
              {segment.text}
            </mark>
          ) : (
            <span key={`${index}-${segment.text}`}>{segment.text}</span>
          )
        )}
      </pre>
    </div>
  );
}

const getConnectionLabel = (
  connection: Pick<ConnectionDropdownItem, "id" | "name" | "description">
): string => connection.name || connection.description || `Connection #${connection.id}`;

export function AuditPage() {
  const navigate = useNavigate();
  const { navigateToConnection } = useConnectionNavigation();
  const { format: formatTime } = useTimezone();
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
  const clearFilters = () => {
    setProviderId("all");
    setModelId("__all__");
    setConnectionId("__all__");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
    setOffset(0);
  };

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

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onClear: () => void }[] = [];

    if (providerId !== "all") {
      const providerName = providers.find((provider) => String(provider.id) === providerId)?.name ?? providerId;
      chips.push({
        key: "provider",
        label: `Provider: ${providerName}`,
        onClear: () => {
          setProviderId("all");
          setOffset(0);
        },
      });
    }

    if (modelId !== "__all__") {
      chips.push({
        key: "model",
        label: `Model: ${modelId}`,
        onClear: () => {
          setModelId("__all__");
          setOffset(0);
        },
      });
    }

    if (connectionId !== "__all__") {
      const connectionName =
        connections.find((connection) => String(connection.id) === connectionId)?.name ??
        `#${connectionId}`;
      chips.push({
        key: "connection",
        label: `Connection: ${connectionName}`,
        onClear: () => {
          setConnectionId("__all__");
          setOffset(0);
        },
      });
    }

    if (statusFilter !== "all") {
      chips.push({
        key: "status",
        label: `Status: ${statusFilter}`,
        onClear: () => {
          setStatusFilter("all");
          setOffset(0);
        },
      });
    }

    if (dateFrom) {
      chips.push({
        key: "from",
        label: `From: ${formatFilterDate(dateFrom)}`,
        onClear: () => {
          setDateFrom("");
          setOffset(0);
        },
      });
    }

    if (dateTo) {
      chips.push({
        key: "to",
        label: `To: ${formatFilterDate(dateTo)}`,
        onClear: () => {
          setDateTo("");
          setOffset(0);
        },
      });
    }

    return chips;
  }, [providerId, providers, modelId, connectionId, connections, statusFilter, dateFrom, dateTo]);

  const hasFilters = activeFilterChips.length > 0;
  const hasHistoricalLogs = (historicalTotal ?? 0) > 0;
  const isTrueEmpty = logs.length === 0 && !hasHistoricalLogs;
  const isFilterEmpty = logs.length === 0 && hasHistoricalLogs;

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const rangeStart = total === 0 ? 0 : offset + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(offset + limit, total);
  const selectedConnectionId = selectedLog?.connection_id ?? null;

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
      <div className="space-y-6">
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
    <div className="space-y-6">
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

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <ProviderSelect
              value={providerId}
              onValueChange={(value) => {
                setProviderId(value);
                setOffset(0);
              }}
              valueType="provider_id"
              providers={providers}
              className="w-full sm:w-[160px]"
            />

            <Select
              value={modelId}
              onValueChange={(value) => {
                setModelId(value);
                setOffset(0);
              }}
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Model ID" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Models</SelectItem>
                {models.map((model) => (
                  <SelectItem key={model.model_id} value={model.model_id}>
                    {model.display_name || model.model_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={connectionId}
              onValueChange={(value) => {
                setConnectionId(value);
                setOffset(0);
              }}
            >
              <SelectTrigger className="w-full sm:w-[130px]">
                <SelectValue placeholder="Connection" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Connections</SelectItem>
                {connections.map((connection) => (
                  <SelectItem key={connection.id} value={String(connection.id)}>
                    {getConnectionLabel(connection)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setOffset(0);
              }}
            >
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="2xx">2xx</SelectItem>
                <SelectItem value="4xx">4xx</SelectItem>
                <SelectItem value="5xx">5xx</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="datetime-local"
              value={dateFrom}
              onChange={(event) => {
                setDateFrom(event.target.value);
                setOffset(0);
              }}
              className="w-full sm:w-auto"
              aria-label="From date"
            />

            <Input
              type="datetime-local"
              value={dateTo}
              onChange={(event) => {
                setDateTo(event.target.value);
                setOffset(0);
              }}
              className="w-full sm:w-auto"
              aria-label="To date"
            />

            {hasFilters ? (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                <X className="h-3.5 w-3.5" />
                Clear
              </Button>
            ) : null}
          </div>

          {hasFilters ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Filter className="h-3 w-3" />
                Active filters:
              </span>
              {activeFilterChips.map((chip) => (
                <Badge key={chip.key} variant="secondary" className="gap-1.5 font-normal">
                  {chip.label}
                  <button
                    type="button"
                    onClick={chip.onClear}
                    className="rounded-sm p-0.5 hover:bg-muted-foreground/15"
                    aria-label={`Clear ${chip.label}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="ml-auto h-6 px-2 text-xs"
              >
                Clear all
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {!isAuditingEnabled && hasHistoricalLogs ? (
            <div className="border-b bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
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
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[72px]">Status</TableHead>
                    <TableHead className="hidden w-[72px] md:table-cell">Method</TableHead>
                    <TableHead>Path</TableHead>
                    <TableHead className="hidden lg:table-cell">Model</TableHead>
                    <TableHead className="hidden md:table-cell">Provider</TableHead>
                    <TableHead className="hidden text-right lg:table-cell">Duration</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const requestPath = formatRequestPath(log.request_url);
                    const provider = providersById.get(log.provider_id);
                    const providerType = provider?.provider_type;

                    return (
                      <TableRow
                        key={log.id}
                        className={cn(
                          "group cursor-pointer hover:bg-muted/50",
                          isSheetOpen && selectedLogId === log.id && "bg-muted/60"
                        )}
                        onClick={() => openDetail(log.id)}
                      >
                        <TableCell>
                          <ValueBadge
                            label={String(log.response_status)}
                            intent={statusIntent(log.response_status)}
                            className="text-xs tabular-nums"
                          />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <ValueBadge label={log.request_method} intent={methodIntent(log.request_method)} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="block max-w-[210px] truncate text-sm sm:max-w-[320px]">
                                    {requestPath}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="max-w-md">
                                  <p className="break-all font-mono text-xs">{requestPath}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                              onClick={(event) => {
                                event.stopPropagation();
                                navigator.clipboard.writeText(requestPath).then(() => {
                                  toast.success("Path copied");
                                });
                              }}
                              aria-label="Copy path"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="font-mono text-xs text-muted-foreground">{log.model_id}</span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-1.5">
                            {providerType ? <ProviderIcon providerType={providerType} size={12} /> : null}
                            <span className="text-xs text-muted-foreground">
                              {provider?.name ?? `Provider #${log.provider_id}`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-right lg:table-cell">
                          <span className="text-xs tabular-nums text-muted-foreground">{log.duration_ms}ms</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="whitespace-nowrap text-xs text-muted-foreground">
                            {formatTime(log.created_at, {
                              hour: "numeric",
                              minute: "numeric",
                              second: "numeric",
                            })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(event) => {
                              event.stopPropagation();
                              openDetail(log.id);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  {rangeStart}-{rangeEnd} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={offset === 0}
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                  >
                    <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                    Prev
                  </Button>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={offset + limit >= total}
                    onClick={() => setOffset(offset + limit)}
                  >
                    Next
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent className="flex w-full flex-col p-0 sm:max-w-xl">
          <SheetHeader className="shrink-0 border-b px-6 py-4">
            <div className="flex items-center justify-between gap-2">
              <SheetTitle className="text-base">
                {selectedLog ? `Audit Log #${selectedLog.id}` : "Loading..."}
              </SheetTitle>
              {selectedLog ? <CopyButton text={`Audit Log #${selectedLog.id}`} /> : null}
            </div>
            {selectedLog ? (
              <SheetDescription className="text-xs">
                {formatTime(selectedLog.created_at)}
                {" · "}
                {selectedLog.duration_ms}ms
                {" · "}
                {selectedLog.endpoint_id === null ? "Endpoint unavailable" : `Endpoint #${selectedLog.endpoint_id}`}
                {" · "}
                HTTP {selectedLog.response_status}
                {selectedConnectionId === null ? (
                  <span> · Connection unavailable</span>
                ) : (
                  <>
                    {" · "}
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={() => navigateToConnection(selectedConnectionId)}
                    >
                      Connection #{selectedConnectionId}
                    </button>
                  </>
                )}
              </SheetDescription>
            ) : null}
          </SheetHeader>

          {detailLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : selectedLog ? (
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center gap-2 border-b bg-muted/30 px-6 py-3">
                <ValueBadge
                  label={selectedLog.request_method}
                  intent={methodIntent(selectedLog.request_method)}
                  className="text-xs"
                />
                <ValueBadge
                  label={String(selectedLog.response_status)}
                  intent={statusIntent(selectedLog.response_status)}
                  className="text-xs"
                />
                <span className="flex-1 truncate font-mono text-xs text-muted-foreground">
                  {selectedLog.request_url}
                </span>
                {selectedLog.is_stream ? <TypeBadge label="Stream" /> : null}
              </div>

              <Tabs defaultValue="request" className="flex h-[calc(100%-48px)] flex-1 flex-col">
                <TabsList className="mx-6 mt-3 w-fit">
                  <TabsTrigger value="request">Request</TabsTrigger>
                  <TabsTrigger value="response">Response</TabsTrigger>
                </TabsList>

                <TabsContent value="request" className="mt-0 flex-1 overflow-hidden px-6 pb-6">
                  <ScrollArea className="h-full">
                    <div className="space-y-4 pt-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Headers</span>
                          <CopyButton text={formatJson(selectedLog.request_headers)} />
                        </div>
                        <p className="text-[11px] text-muted-foreground">API keys are always redacted.</p>
                        <pre className="max-h-[30vh] overflow-auto rounded-lg bg-muted p-3 font-mono text-xs whitespace-pre-wrap break-all scrollbar-thin">
                          {formatJson(selectedLog.request_headers)}
                        </pre>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Body</span>
                        </div>
                        <BodyInspector
                          content={selectedLog.request_body}
                          emptyMessage="Body capture disabled for this provider."
                        />
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="response" className="mt-0 flex-1 overflow-hidden px-6 pb-6">
                  <ScrollArea className="h-full">
                    <div className="space-y-4 pt-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Headers</span>
                          {selectedLog.response_headers ? (
                            <CopyButton text={formatJson(selectedLog.response_headers)} />
                          ) : null}
                        </div>
                        <p className="text-[11px] text-muted-foreground">API keys are always redacted.</p>
                        <pre className="max-h-[30vh] overflow-auto rounded-lg bg-muted p-3 font-mono text-xs whitespace-pre-wrap break-all scrollbar-thin">
                          {formatJson(selectedLog.response_headers)}
                        </pre>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Body</span>
                        </div>
                        <BodyInspector
                          content={selectedLog.response_body}
                          emptyMessage={
                            selectedLog.is_stream
                              ? "Response body not recorded for streaming requests."
                              : "Body capture disabled for this provider."
                          }
                        />
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Failed to load details.
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
