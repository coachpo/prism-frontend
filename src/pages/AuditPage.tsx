import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useEndpointNavigation } from "@/hooks/useEndpointNavigation";
import type { AuditLogListItem, AuditLogDetail, AuditLogParams, Provider } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Eye, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function AuditPage() {
  const [logs, setLogs] = useState<AuditLogListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<Provider[]>([]);
  const { navigateToEndpoint } = useEndpointNavigation();
  
  const [selectedLog, setSelectedLog] = useState<AuditLogDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [providerId, setProviderId] = useState<string>("all");
  const [modelId, setModelId] = useState("");
  const [endpointId, setEndpointId] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [activeTab, setActiveTab] = useState<"request" | "response">("request");

  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    api.providers.list()
      .then(setProviders)
      .catch(() => toast.error("Failed to load providers"));
  }, []);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const params: AuditLogParams = {
          limit,
          offset,
        };

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

    const timeoutId = setTimeout(fetchLogs, 300);
    return () => clearTimeout(timeoutId);
  }, [limit, offset, providerId, modelId, endpointId, statusFilter, dateFrom, dateTo]);

  const handleViewDetail = async (id: number) => {
    setIsDialogOpen(true);
    setDetailLoading(true);
    setSelectedLog(null);
    setActiveTab("request");
    try {
      const detail = await api.audit.get(id);
      setSelectedLog(detail);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load log details");
      setIsDialogOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const getProviderName = (id: number) => {
    return providers.find(p => p.id === id)?.name || `ID: ${id}`;
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "default";
    if (status >= 400 && status < 500) return "secondary";
    if (status >= 500) return "destructive";
    return "outline";
  };

  const formatJson = (str: string | null) => {
    if (!str) return null;
    try {
      const parsed = JSON.parse(str);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return str;
    }
  };

  return (
    <div className="space-y-6 p-6 pb-16">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Select value={providerId} onValueChange={setProviderId}>
          <SelectTrigger>
            <SelectValue placeholder="Provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Providers</SelectItem>
            {providers.map(p => (
              <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input 
          placeholder="Model ID" 
          value={modelId} 
          onChange={(e) => setModelId(e.target.value)} 
        />

        <Input 
          placeholder="Endpoint ID" 
          value={endpointId} 
          onChange={(e) => setEndpointId(e.target.value)} 
        />

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="2xx">2xx (Success)</SelectItem>
            <SelectItem value="4xx">4xx (Client Error)</SelectItem>
            <SelectItem value="5xx">5xx (Server Error)</SelectItem>
          </SelectContent>
        </Select>

        <Input 
          type="datetime-local" 
          value={dateFrom} 
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-full"
        />
        <Input 
          type="datetime-local" 
          value={dateTo} 
          onChange={(e) => setDateTo(e.target.value)}
          className="w-full"
        />
      </div>

      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Showing {logs.length} records
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Stream</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                      No logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">{log.model_id}</TableCell>
                      <TableCell>{getProviderName(log.provider_id)}</TableCell>
                      <TableCell className="max-w-[150px] truncate text-xs text-muted-foreground">
                        {log.endpoint_id ? (
                          <button
                            type="button"
                            className="text-left hover:underline cursor-pointer text-primary"
                            onClick={() => navigateToEndpoint(log.endpoint_id!)}
                          >
                            {log.endpoint_description ? (
                              <span>{log.endpoint_description} <span className="opacity-50">#{log.endpoint_id}</span></span>
                            ) : log.endpoint_base_url ? (
                              <span>{log.endpoint_base_url.replace(/^https?:\/\//, '').substring(0, 20)}... <span className="opacity-50">#{log.endpoint_id}</span></span>
                            ) : (
                              <span>#{log.endpoint_id}</span>
                            )}
                          </button>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="opacity-50 cursor-help">Legacy</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Legacy log: endpoint link unavailable</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.request_method}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={log.request_url}>
                        {log.request_url}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(log.response_status)}>
                          {log.response_status}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.duration_ms}ms</TableCell>
                      <TableCell>
                        {log.is_stream && <Badge variant="secondary">Stream</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetail(log.id)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {Math.min(offset + 1, total)}-{Math.min(offset + logs.length, total)} of {total}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0 || loading}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setOffset(offset + limit)}
            disabled={offset + logs.length >= total || loading}
          >
            Next
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] w-[96vw] sm:w-auto overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Audit Log Detail #{selectedLog?.id}</DialogTitle>
            <DialogDescription>
              {selectedLog && new Date(selectedLog.created_at).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          
          {detailLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : selectedLog ? (
            <div className="flex flex-col h-full overflow-hidden gap-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-muted/50 rounded-lg shrink-0">
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Status</div>
                  <Badge variant={getStatusColor(selectedLog.response_status)} className="mt-1">
                    {selectedLog.response_status}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Duration</div>
                  <div className="mt-1 font-mono text-sm">{selectedLog.duration_ms}ms</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Model</div>
                  <div className="mt-1 text-sm font-medium">{selectedLog.model_id}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Provider</div>
                  <div className="mt-1 text-sm">{getProviderName(selectedLog.provider_id)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Endpoint</div>
                  <div className="mt-1 text-sm truncate" title={selectedLog.endpoint_description || selectedLog.endpoint_base_url || `Endpoint #${selectedLog.endpoint_id}`}>
                    {selectedLog.endpoint_id ? (
                      <button
                        type="button"
                        className="text-left hover:underline cursor-pointer text-primary"
                        onClick={() => navigateToEndpoint(selectedLog.endpoint_id!)}
                      >
                        {selectedLog.endpoint_description ? (
                          <span>{selectedLog.endpoint_description} <span className="opacity-50">#{selectedLog.endpoint_id}</span></span>
                        ) : selectedLog.endpoint_base_url ? (
                          <span>{selectedLog.endpoint_base_url.replace(/^https?:\/\//, '').substring(0, 20)}... <span className="opacity-50">#{selectedLog.endpoint_id}</span></span>
                        ) : (
                          <span>#{selectedLog.endpoint_id}</span>
                        )}
                      </button>
                    ) : (
                      <span className="opacity-50">N/A</span>
                    )}
                  </div>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "request" | "response")} className="min-h-0 flex-1 overflow-hidden flex flex-col">
                <TabsList className="grid w-full grid-cols-2 shrink-0">
                  <TabsTrigger value="request">Request</TabsTrigger>
                  <TabsTrigger value="response">Response</TabsTrigger>
                </TabsList>
                
                <TabsContent value="request" className="mt-0 h-full overflow-y-auto p-1 space-y-4">
                  <div className="flex items-center gap-2 pt-2">
                    <Badge variant="outline">{selectedLog.request_method}</Badge>
                    <span className="font-mono text-xs text-muted-foreground break-all">{selectedLog.request_url}</span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Headers</div>
                    <pre className="bg-muted p-3 rounded-md text-xs font-mono overflow-auto max-h-[40vh]">
                      {formatJson(selectedLog.request_headers)}
                    </pre>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Body</div>
                    {selectedLog.request_body ? (
                      <pre className="bg-muted p-3 rounded-md text-xs font-mono overflow-auto max-h-[40vh] whitespace-pre-wrap">
                        {formatJson(selectedLog.request_body)}
                      </pre>
                    ) : (
                      <div className="p-3 border border-dashed rounded-md text-xs text-muted-foreground italic">
                        Body capture disabled for this provider.
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="response" className="mt-0 h-full overflow-y-auto p-1 space-y-4">
                  <div className="flex items-center gap-2 pt-2">
                    <Badge variant={getStatusColor(selectedLog.response_status)}>
                      {selectedLog.response_status}
                    </Badge>
                    {selectedLog.is_stream && <Badge variant="secondary">Stream</Badge>}
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Headers</div>
                    <pre className="bg-muted p-3 rounded-md text-xs font-mono overflow-auto max-h-[40vh]">
                      {formatJson(selectedLog.response_headers)}
                    </pre>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Body</div>
                    {selectedLog.is_stream ? (
                      <div className="p-3 border border-dashed rounded-md text-xs text-muted-foreground italic">
                        Response body not recorded for streaming requests.
                      </div>
                    ) : selectedLog.response_body ? (
                      <pre className="bg-muted p-3 rounded-md text-xs font-mono overflow-auto max-h-[40vh] whitespace-pre-wrap">
                        {formatJson(selectedLog.response_body)}
                      </pre>
                    ) : (
                      <div className="p-3 border border-dashed rounded-md text-xs text-muted-foreground italic">
                        Body capture disabled for this provider.
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Failed to load details.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
