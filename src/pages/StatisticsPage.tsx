import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useEndpointNavigation } from "@/hooks/useEndpointNavigation";
import type { RequestLogEntry, StatsSummary } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Activity, Clock, CheckCircle, Coins, AlertCircle } from "lucide-react";

function formatErrorDetail(detail: string | null): string | null {
  if (!detail) return null;
  try {
    const parsed = JSON.parse(detail);
    const msg =
      parsed?.error?.message ||
      parsed?.error?.msg ||
      parsed?.detail ||
      parsed?.message;
    if (msg) return String(msg);
    return detail;
  } catch {
    return detail;
  }
}

export function StatisticsPage() {
  const [logs, setLogs] = useState<RequestLogEntry[]>([]);
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { navigateToEndpoint } = useEndpointNavigation();
  
  const [modelId, setModelId] = useState("");
  const [endpointId, setEndpointId] = useState("");
  const [providerType, setProviderType] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d" | "all">("24h");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let fromTime: string | undefined;
        const now = new Date();
        
        if (timeRange === "1h") {
          fromTime = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
        } else if (timeRange === "24h") {
          fromTime = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        } else if (timeRange === "7d") {
          fromTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        }

        const params = {
          model_id: modelId || undefined,
          provider_type: providerType === "all" ? undefined : providerType,
          endpoint_id: endpointId ? parseInt(endpointId) : undefined,
          from_time: fromTime,
          limit: 100
        };

        const [logsData, summaryData] = await Promise.all([
          api.stats.requests(params),
          api.stats.summary(params)
        ]);

        setLogs(logsData.items);
        setSummary(summaryData);
      } catch (error) {
        console.error("Failed to fetch statistics:", error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchData();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [modelId, providerType, timeRange, endpointId]);

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "default";
    if (status >= 400 && status < 500) return "destructive";
    if (status >= 500) return "destructive";
    return "secondary";
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleString();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Statistics</h2>
        
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Button 
              variant={timeRange === "1h" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setTimeRange("1h")}
            >
              Last 1h
            </Button>
            <Button 
              variant={timeRange === "24h" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setTimeRange("24h")}
            >
              Last 24h
            </Button>
            <Button 
              variant={timeRange === "7d" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setTimeRange("7d")}
            >
              Last 7d
            </Button>
            <Button 
              variant={timeRange === "all" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setTimeRange("all")}
            >
              All
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="w-full md:w-1/2 lg:w-1/3">
          <Input 
            placeholder="Filter by Model ID..." 
            value={modelId} 
            onChange={(e) => setModelId(e.target.value)}
          />
        </div>
        <div className="w-full md:w-1/3 lg:w-1/4">
          <Select value={providerType} onValueChange={setProviderType}>
            <SelectTrigger>
              <SelectValue placeholder="Provider Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="anthropic">Anthropic</SelectItem>
              <SelectItem value="gemini">Gemini</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-1/3 lg:w-1/4">
          <Input 
            placeholder="Endpoint ID" 
            value={endpointId} 
            onChange={(e) => setEndpointId(e.target.value)}
            type="number"
            min="1"
          />
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : summary?.total_requests.toLocaleString() ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? "..." : `${summary?.success_count.toLocaleString() ?? 0} successful`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : `${Math.round(summary?.avg_response_time_ms ?? 0)}ms`}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? "..." : `P95: ${Math.round(summary?.p95_response_time_ms ?? 0)}ms`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : `${(summary?.success_rate ?? 0).toFixed(1)}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? "..." : `${summary?.error_count.toLocaleString() ?? 0} errors`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : summary?.total_tokens.toLocaleString() ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? "..." : `In: ${summary?.total_input_tokens.toLocaleString() ?? 0} / Out: ${summary?.total_output_tokens.toLocaleString() ?? 0}`}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-[1100px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Latency</TableHead>
                  <TableHead>In Tokens</TableHead>
                  <TableHead>Out Tokens</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Stream</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      Loading data...
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      No requests found for the selected period.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => {
                    const errorMsg = formatErrorDetail(log.error_detail);
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {formatTime(log.created_at)}
                        </TableCell>
                        <TableCell className="font-medium">{log.model_id}</TableCell>
                        <TableCell className="capitalize">{log.provider_type}</TableCell>
                        <TableCell className="text-xs max-w-[150px] truncate">
                          {log.endpoint_id ? (
                            <button
                              type="button"
                              className="text-left hover:underline cursor-pointer text-primary"
                              onClick={() => navigateToEndpoint(log.endpoint_id!)}
                            >
                              {log.endpoint_description ? (
                                `${log.endpoint_description} #${log.endpoint_id}`
                              ) : log.endpoint_base_url ? (
                                `${log.endpoint_base_url.length > 20 ? log.endpoint_base_url.substring(0, 20) + '...' : log.endpoint_base_url} #${log.endpoint_id}`
                              ) : (
                                `#${log.endpoint_id}`
                              )}
                            </button>
                          ) : (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-muted-foreground cursor-help">Legacy</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Legacy log: endpoint link unavailable</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(log.status_code)}>
                            {log.status_code}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.response_time_ms}ms</TableCell>
                        <TableCell className="text-xs">
                          {log.input_tokens != null ? log.input_tokens.toLocaleString() : "-"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {log.output_tokens != null ? log.output_tokens.toLocaleString() : "-"}
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {log.total_tokens != null ? log.total_tokens.toLocaleString() : "-"}
                        </TableCell>
                        <TableCell>
                          {log.is_stream ? (
                            <Badge variant="outline" className="text-xs">Stream</Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          {errorMsg ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1 text-destructive cursor-help">
                                    <AlertCircle className="h-3 w-3 shrink-0" />
                                    <span className="truncate text-xs">{errorMsg}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-sm">
                                  <pre className="whitespace-pre-wrap text-xs">{log.error_detail}</pre>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
