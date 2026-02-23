import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { useEndpointNavigation } from "@/hooks/useEndpointNavigation";
import type { AuditLogListItem, AuditLogDetail, AuditLogParams, Provider } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TypeBadge, ValueBadge, type BadgeIntent } from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, ArrowLeft, ArrowRight, Loader2, Copy, Check, X, Clock, AlertTriangle, FileSearch } from "lucide-react";
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
    case "GET": return "blue";
    case "POST": return "success";
    case "PUT": return "warning";
    case "DELETE": return "danger";
    default: return "muted";
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
      {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

export function AuditPage() {
  const [logs, setLogs] = useState<AuditLogListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<Provider[]>([]);
  const { navigateToEndpoint } = useEndpointNavigation();

  const [selectedLog, setSelectedLog] = useState<AuditLogDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const [providerId, setProviderId] = useState<string>("all");
  const [modelId, setModelId] = useState("");
  const [endpointId, setEndpointId] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    api.providers.list().then(setProviders).catch(() => toast.error("Failed to load providers"));
  }, []);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const params: AuditLogParams = { limit, offset };
        if (providerId !== "all") params.provider_id = parseInt(providerId);
        if (modelId) params.model_id = modelId;
        if (endpointId) params.endpoint_id = parseInt(endpointId);
        if (dateFrom) params.from_time = new Date(dateFrom).toISOString();
        if (dateTo) params.to_time = new Date(dateTo).toISOString();

        const response = await api.audit.list(params);
        let items = response.items;
        if (statusFilter === "2xx") items = items.filter(i => i.response_status >= 200 && i.response_status < 300);
        if (statusFilter === "4xx") items = items.filter(i => i.response_status >= 400 && i.response_status < 500);
        if (statusFilter === "5xx") items = items.filter(i => i.response_status >= 500);

        setLogs(items);
        setTotal(response.total);
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch audit logs");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [providerId, modelId, endpointId, statusFilter, dateFrom, dateTo, limit, offset]);

  const metrics = useMemo(() => {
    if (logs.length === 0) return { avgDuration: 0, errorRate: 0 };
    const totalDuration = logs.reduce((sum, l) => sum + l.duration_ms, 0);
    const errors = logs.filter(l => l.response_status >= 400).length;
    return {
      avgDuration: Math.round(totalDuration / logs.length),
      errorRate: ((errors / logs.length) * 100),
    };
  }, [logs]);

  const providersById = useMemo(() => {
    return new Map(providers.map((provider) => [provider.id, provider]));
  }, [providers]);

  const openDetail = async (id: number) => {
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

  const clearFilters = () => {
    setProviderId("all");
    setModelId("");
    setEndpointId("");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
    setOffset(0);
  };

  const hasFilters = providerId !== "all" || modelId || endpointId || statusFilter !== "all" || dateFrom || dateTo;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  const selectedEndpointId = selectedLog?.endpoint_id ?? null;

  if (loading && logs.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-[100px] rounded-xl" />)}
        </div>
        <Skeleton className="h-[500px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Logs" description="Inspect request and response details for debugging and compliance" />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Total Logs"
          value={total.toLocaleString()}
          detail={`${logs.length} shown`}
          icon={<FileSearch className="h-4 w-4" />}
        />
        <MetricCard
          label="Avg Duration"
          value={`${metrics.avgDuration}ms`}
          detail="Across visible logs"
          icon={<Clock className="h-4 w-4" />}
        />
        <MetricCard
          label="Error Rate"
          value={`${metrics.errorRate.toFixed(1)}%`}
          detail={`${logs.filter(l => l.response_status >= 400).length} errors`}
          icon={<AlertTriangle className="h-4 w-4" />}
          className={metrics.errorRate > 10 ? "[&_span.text-2xl]:text-destructive" : ""}
        />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <ProviderSelect value={providerId} onValueChange={(v) => { setProviderId(v); setOffset(0); }} valueType="provider_id" providers={providers} className="w-full sm:w-[160px]" />

            <Input
              placeholder="Model ID"
              value={modelId}
              onChange={(e) => { setModelId(e.target.value); setOffset(0); }}
              className="w-full sm:w-[140px]"
            />

            <Input
              placeholder="Endpoint ID"
              type="number"
              value={endpointId}
              onChange={(e) => { setEndpointId(e.target.value); setOffset(0); }}
              className="w-full sm:w-[120px]"
            />

            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setOffset(0); }}>
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
              onChange={(e) => { setDateFrom(e.target.value); setOffset(0); }}
              className="w-full sm:w-auto"
              aria-label="From date"
            />
            <Input
              type="datetime-local"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setOffset(0); }}
              className="w-full sm:w-auto"
              aria-label="To date"
            />

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                <X className="h-3.5 w-3.5" /> Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <EmptyState
              icon={<FileSearch className="h-6 w-6" />}
              title="No audit logs found"
              description={hasFilters ? "Try adjusting your filters" : "Audit logs will appear here when requests are proxied"}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[70px]">Status</TableHead>
                    <TableHead className="hidden md:table-cell w-[70px]">Method</TableHead>
                    <TableHead>Path</TableHead>
                    <TableHead className="hidden lg:table-cell">Model</TableHead>
                    <TableHead className="hidden md:table-cell">Provider</TableHead>
                    <TableHead className="hidden lg:table-cell text-right">Duration</TableHead>
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
                        className="cursor-pointer hover:bg-muted/50"
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
                          <ValueBadge
                            label={log.request_method}
                            intent={methodIntent(log.request_method)}
                          />
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-sm truncate block max-w-[200px] sm:max-w-[300px]">{requestPath}</span>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="max-w-md">
                                <p className="font-mono text-xs break-all">{requestPath}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-xs text-muted-foreground font-mono">{log.model_id}</span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-1.5">
                            {providerType && <ProviderIcon providerType={providerType} size={12} />}
                            <span className="text-xs text-muted-foreground">{provider?.name ?? `Provider #${log.provider_id}`}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-right">
                          <span className="text-xs tabular-nums text-muted-foreground">{log.duration_ms}ms</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openDetail(log.id); }}>
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
                  {offset + 1}–{Math.min(offset + limit, total)} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={offset === 0}
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                  >
                    <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Prev
                  </Button>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {currentPage} / {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={offset + limit >= total}
                    onClick={() => setOffset(offset + limit)}
                  >
                    Next <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col">
          <SheetHeader className="px-6 py-4 border-b shrink-0">
            <SheetTitle className="text-base">
              {selectedLog ? `Audit Log #${selectedLog.id}` : "Loading..."}
            </SheetTitle>
            {selectedLog && (
              <SheetDescription className="text-xs">
                {new Date(selectedLog.created_at).toLocaleString()} · {selectedLog.duration_ms}ms
                {selectedEndpointId === null ? (
                  <span> · Endpoint unavailable</span>
                ) : (
                  <>
                    {" · "}
                    <button
                      className="text-primary hover:underline"
                      onClick={() => navigateToEndpoint(selectedEndpointId)}
                    >
                      Endpoint #{selectedEndpointId}
                    </button>
                  </>
                )}
              </SheetDescription>
            )}
          </SheetHeader>

          {detailLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : selectedLog ? (
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-3 border-b bg-muted/30">
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
                <span className="text-xs text-muted-foreground font-mono truncate flex-1">{selectedLog.request_url}</span>
                {selectedLog.is_stream && <TypeBadge label="Stream" />}
              </div>

              <Tabs defaultValue="request" className="flex-1 flex flex-col h-[calc(100%-48px)]">
                <TabsList className="mx-6 mt-3 w-fit">
                  <TabsTrigger value="request">Request</TabsTrigger>
                  <TabsTrigger value="response">Response</TabsTrigger>
                </TabsList>

                <TabsContent value="request" className="flex-1 overflow-hidden mt-0 px-6 pb-6">
                  <ScrollArea className="h-full">
                    <div className="space-y-4 pt-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Headers</span>
                          <CopyButton text={formatJson(selectedLog.request_headers)} />
                        </div>
                        <pre className="bg-muted p-3 rounded-lg text-xs font-mono overflow-auto max-h-[30vh] scrollbar-thin whitespace-pre-wrap break-all">
                          {formatJson(selectedLog.request_headers)}
                        </pre>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Body</span>
                          {selectedLog.request_body && <CopyButton text={formatJson(selectedLog.request_body)} />}
                        </div>
                        {selectedLog.request_body ? (
                          <pre className="bg-muted p-3 rounded-lg text-xs font-mono overflow-auto max-h-[40vh] scrollbar-thin whitespace-pre-wrap break-all">
                            {formatJson(selectedLog.request_body)}
                          </pre>
                        ) : (
                          <div className="p-3 border border-dashed rounded-lg text-xs text-muted-foreground italic">
                            Body capture disabled for this provider.
                          </div>
                        )}
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="response" className="flex-1 overflow-hidden mt-0 px-6 pb-6">
                  <ScrollArea className="h-full">
                    <div className="space-y-4 pt-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Headers</span>
                          {selectedLog.response_headers && <CopyButton text={formatJson(selectedLog.response_headers)} />}
                        </div>
                        <pre className="bg-muted p-3 rounded-lg text-xs font-mono overflow-auto max-h-[30vh] scrollbar-thin whitespace-pre-wrap break-all">
                          {formatJson(selectedLog.response_headers)}
                        </pre>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Body</span>
                          {selectedLog.response_body && <CopyButton text={formatJson(selectedLog.response_body)} />}
                        </div>
                        {selectedLog.is_stream ? (
                          <div className="p-3 border border-dashed rounded-lg text-xs text-muted-foreground italic">
                            Response body not recorded for streaming requests.
                          </div>
                        ) : selectedLog.response_body ? (
                          <pre className="bg-muted p-3 rounded-lg text-xs font-mono overflow-auto max-h-[40vh] scrollbar-thin whitespace-pre-wrap break-all">
                            {formatJson(selectedLog.response_body)}
                          </pre>
                        ) : (
                          <div className="p-3 border border-dashed rounded-lg text-xs text-muted-foreground italic">
                            Body capture disabled for this provider.
                          </div>
                        )}
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Failed to load details.
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
