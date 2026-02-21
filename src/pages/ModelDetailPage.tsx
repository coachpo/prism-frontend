import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { formatProviderType } from "@/lib/utils";
import type { ModelConfig, Endpoint, EndpointCreate, EndpointUpdate, EndpointSuccessRate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { ArrowLeft, Plus, Pencil, Trash2, MoreHorizontal, Search, ArrowRight, Activity, Loader2, X } from "lucide-react";
import { ProviderIcon } from "@/components/ProviderIcon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function ModelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [model, setModel] = useState<ModelConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEndpointDialogOpen, setIsEndpointDialogOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<Endpoint | null>(null);
  const [endpointSearch, setEndpointSearch] = useState("");
  const [healthCheckingIds, setHealthCheckingIds] = useState<Set<number>>(new Set());
  const [dialogTestingConnection, setDialogTestingConnection] = useState(false);
  const [dialogTestResult, setDialogTestResult] = useState<{ status: string; detail: string } | null>(null);
  const [successRates, setSuccessRates] = useState<Map<number, EndpointSuccessRate>>(new Map());
  const [focusedEndpointId, setFocusedEndpointId] = useState<number | null>(null);
  const endpointRowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map());
  const focusHandled = useRef(false);

  // Endpoint Form State
  const [endpointForm, setEndpointForm] = useState<EndpointCreate>({
    base_url: "",
    api_key: "",
    priority: 0,
    description: "",
    is_active: true,
    custom_headers: null,
  });
  const [headerRows, setHeaderRows] = useState<{ key: string; value: string }[]>([]);

  const fetchModel = async () => {
    if (!id) return;
    try {
      const [data, rates] = await Promise.all([
        api.models.get(parseInt(id)),
        api.stats.endpointSuccessRates(),
      ]);
      setModel(data);
      const rateMap = new Map<number, EndpointSuccessRate>();
      for (const r of rates) {
        rateMap.set(r.endpoint_id, r);
      }
      setSuccessRates(rateMap);
    } catch (error) {
      toast.error("Failed to fetch model details");
      console.error(error);
      navigate("/models");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModel();
  }, [id]);

  // Handle focus_endpoint_id query param: scroll + highlight
  useEffect(() => {
    if (!model || loading || focusHandled.current) return;

    const focusParam = searchParams.get("focus_endpoint_id");
    if (!focusParam) return;

    const targetId = parseInt(focusParam);
    if (isNaN(targetId)) return;

    focusHandled.current = true;
    setSearchParams({}, { replace: true });

    const endpoint = model.endpoints.find(ep => ep.id === targetId);
    if (!endpoint) {
      toast.error(`Endpoint #${targetId} not found in this model`);
      return;
    }

    if (endpointSearch) {
      const q = endpointSearch.toLowerCase();
      const matchesSearch =
        endpoint.base_url.toLowerCase().includes(q) ||
        (endpoint.description?.toLowerCase().includes(q)) ||
        String(endpoint.id).includes(q) ||
        `#${endpoint.id}`.includes(q);
      if (!matchesSearch) {
        setEndpointSearch("");
      }
    }

    setFocusedEndpointId(targetId);

    requestAnimationFrame(() => {
      const row = endpointRowRefs.current.get(targetId);
      if (row) {
        row.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });

    const timer = setTimeout(() => setFocusedEndpointId(null), 5000);
    return () => clearTimeout(timer);
  }, [model, loading, searchParams]);

  const handleOpenEndpointDialog = (endpoint?: Endpoint) => {
    if (endpoint) {
      setEditingEndpoint(endpoint);
      setEndpointForm({
        base_url: endpoint.base_url,
        api_key: "",
        priority: endpoint.priority,
        description: endpoint.description || "",
        is_active: endpoint.is_active,
        custom_headers: endpoint.custom_headers,
      });
      if (endpoint.custom_headers) {
        setHeaderRows(Object.entries(endpoint.custom_headers).map(([key, value]) => ({ key, value })));
      } else {
        setHeaderRows([]);
      }
    } else {
      setEditingEndpoint(null);
      setEndpointForm({
        base_url: "",
        api_key: "",
        priority: 0,
        description: "",
        is_active: true,
        custom_headers: null,
      });
      setHeaderRows([]);
    }
    setIsEndpointDialogOpen(true);
    setDialogTestResult(null);
  };

  const handleAddHeaderRow = () => {
    setHeaderRows([...headerRows, { key: "", value: "" }]);
  };

  const handleRemoveHeaderRow = (index: number) => {
    const newRows = [...headerRows];
    newRows.splice(index, 1);
    setHeaderRows(newRows);
  };

  const handleHeaderRowChange = (index: number, field: "key" | "value", value: string) => {
    const newRows = [...headerRows];
    newRows[index][field] = value;
    setHeaderRows(newRows);
  };

  const handleDialogTestConnection = async () => {
    if (!editingEndpoint) return;
    setDialogTestingConnection(true);
    setDialogTestResult(null);
    try {
      const result = await api.endpoints.healthCheck(editingEndpoint.id);
      setDialogTestResult({ status: result.health_status, detail: result.detail });
      fetchModel();
    } catch (error: any) {
      setDialogTestResult({ status: "error", detail: error.message || "Test failed" });
    } finally {
      setDialogTestingConnection(false);
    }
  };

  const handleEndpointSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!model) return;

    const headers: Record<string, string> = {};
    headerRows.forEach(row => {
      if (row.key.trim()) {
        headers[row.key.trim()] = row.value;
      }
    });
    const hasHeaders = Object.keys(headers).length > 0;

    try {
      if (editingEndpoint) {
        const updateData: EndpointUpdate = {
          base_url: endpointForm.base_url,
          priority: endpointForm.priority,
          description: endpointForm.description,
          is_active: endpointForm.is_active,
          custom_headers: hasHeaders ? headers : null,
        };
        if (endpointForm.api_key) {
          updateData.api_key = endpointForm.api_key;
        }

        await api.endpoints.update(editingEndpoint.id, updateData);
        toast.success("Endpoint updated");
      } else {
        await api.endpoints.create(model.id, {
          ...endpointForm,
          custom_headers: hasHeaders ? headers : null,
        });
        toast.success("Endpoint added");
      }
      setIsEndpointDialogOpen(false);
      fetchModel();
    } catch (error: any) {
      toast.error(error.message || "Operation failed");
    }
  };

  const handleDeleteEndpoint = async (endpointId: number) => {
    if (!confirm("Delete this endpoint?")) return;
    try {
      await api.endpoints.delete(endpointId);
      toast.success("Endpoint deleted");
      fetchModel();
    } catch (error: any) {
      toast.error(error.message || "Delete failed");
    }
  };

  const handleToggleActive = async (endpoint: Endpoint, checked: boolean) => {
    try {
      await api.endpoints.update(endpoint.id, { is_active: checked });
      toast.success(`Endpoint ${checked ? "enabled" : "disabled"}`);
      fetchModel();
    } catch (error: any) {
      toast.error(error.message || "Update failed");
    }
  };

  const handleHealthCheck = async (endpointId: number) => {
    setHealthCheckingIds(prev => new Set(prev).add(endpointId));
    try {
      const result = await api.endpoints.healthCheck(endpointId);
      toast.success(`Health check: ${result.health_status} — ${result.detail}`);
      fetchModel();
    } catch (error: any) {
      toast.error(error.message || "Health check failed");
    } finally {
      setHealthCheckingIds(prev => {
        const next = new Set(prev);
        next.delete(endpointId);
        return next;
      });
    }
  };

  const maskApiKey = (key: string) => {
    if (!key) return "";
    if (key.length <= 4) return key;
    return `••••${key.slice(-4)}`;
  };

  if (loading) return <div className="p-8">Loading model details...</div>;
  if (!model) return <div className="p-8">Model not found</div>;

  const filteredEndpoints = model.endpoints
    .filter(ep => {
      if (!endpointSearch) return true;
      const q = endpointSearch.toLowerCase();
      return (
        ep.base_url.toLowerCase().includes(q) ||
        (ep.description?.toLowerCase().includes(q)) ||
        String(ep.id).includes(q) ||
        `#${ep.id}`.includes(q)
      );
    })
    .sort((a, b) => a.priority - b.priority || a.id - b.id);
  const activeCount = model.endpoints.filter(e => e.is_active).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/models")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Model Details</h2>
      </div>

      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle>{model.display_name || model.model_id}</CardTitle>
                <Badge 
                  variant="outline"
                  className={model.model_type === "native" 
                    ? "bg-teal-500/15 text-teal-700 border-teal-500/30 dark:text-teal-400 dark:border-teal-400/30"
                    : "bg-violet-500/15 text-violet-700 border-violet-500/30 dark:text-violet-400 dark:border-violet-400/30"}
                >
                  {model.model_type === "native" ? "Native" : "Proxy"}
                </Badge>
              </div>
              <CardDescription>
                <span className="inline-flex items-center gap-1.5">
                  <ProviderIcon providerType={model.provider.provider_type} size={14} />
                  {model.provider.name}
                </span>
                {" • "}{model.model_id}
              </CardDescription>
              {model.model_type === "proxy" && model.redirect_to && (
                <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                  <ArrowRight className="h-3 w-3" /> Proxies to: <span className="font-medium text-foreground">{model.redirect_to}</span>
                </div>
              )}
            </div>
            <Badge
              variant="outline"
              className={model.is_enabled 
                ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400 dark:border-emerald-400/30"
                : "bg-gray-500/15 text-gray-500 border-gray-500/30 dark:text-gray-400 dark:border-gray-400/30"}
            >
              {model.is_enabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-sm">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Load Balancing</div>
              <div className="mt-1 capitalize">{model.lb_strategy.replace("_", " ")}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Provider Type</div>
              <div className="mt-1">{formatProviderType(model.provider.provider_type)}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Endpoints</div>
              <div className="mt-1">{model.endpoints.length} total, {activeCount} active</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-tight">Endpoints</h3>
            <p className="text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ProviderIcon providerType={model.provider.provider_type} size={14} />
                {model.provider.name}
              </span>
              {model.provider.description && ` — ${model.provider.description}`}
            </p>
          </div>
          {model.model_type === "native" && (
            <Button onClick={() => handleOpenEndpointDialog()} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Add Endpoint
            </Button>
          )}
          {model.model_type === "proxy" && (
            <p className="text-sm text-muted-foreground italic">Proxy models use the target model's endpoints</p>
          )}
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search endpoints..." value={endpointSearch} onChange={e => setEndpointSearch(e.target.value)} className="pl-9" />
        </div>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                   <TableHead className="w-[80px]">ID</TableHead>
                   <TableHead>Base URL</TableHead>
                   <TableHead>API Key</TableHead>
                   <TableHead>
                     <TooltipProvider>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <span className="cursor-help border-b border-dotted border-muted-foreground/50">Priority</span>
                         </TooltipTrigger>
                         <TooltipContent>
                           <p className="text-xs">Lower numbers are tried first</p>
                         </TooltipContent>
                       </Tooltip>
                     </TooltipProvider>
                   </TableHead>
                   <TableHead>Success Rate</TableHead>
                   <TableHead>Active</TableHead>
                   <TableHead className="text-right">Actions</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEndpoints.map((endpoint) => (
                  <TableRow
                    key={endpoint.id}
                    ref={(el) => {
                      if (el) endpointRowRefs.current.set(endpoint.id, el);
                      else endpointRowRefs.current.delete(endpoint.id);
                    }}
                    className={focusedEndpointId === endpoint.id ? "bg-primary/10 transition-colors duration-1000" : ""}
                  >
                     <TableCell className="font-mono text-xs text-muted-foreground">#{endpoint.id}</TableCell>
                     <TableCell className="font-medium max-w-[200px] truncate" title={endpoint.base_url}>
                       {endpoint.base_url}
                       {endpoint.description && (
                         <div className="text-xs text-muted-foreground">{endpoint.description}</div>
                       )}
                     </TableCell>
                     <TableCell className="font-mono text-xs">
                      {maskApiKey(endpoint.api_key)}
                    </TableCell>
                    <TableCell>{endpoint.priority}</TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {(() => {
                              const rate = successRates.get(endpoint.id);
                              if (!rate || rate.total_requests === 0) {
                                return (
                                  <Badge variant="secondary" className="text-xs">
                                    N/A
                                  </Badge>
                                );
                              }
                              const pct = rate.success_rate ?? 0;
                              const color =
                                pct >= 98
                                  ? "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30"
                                  : pct >= 75
                                    ? "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30"
                                    : "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30";
                              return (
                                <Badge variant="outline" className={`text-xs ${color}`}>
                                  {pct.toFixed(1)}%
                                </Badge>
                              );
                            })()}
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <div className="space-y-1">
                              {(() => {
                                const rate = successRates.get(endpoint.id);
                                if (!rate || rate.total_requests === 0) {
                                  return <div className="text-xs">No requests recorded (last 24h)</div>;
                                }
                                return (
                                  <>
                                    <div className="text-xs">
                                      {rate.success_count}/{rate.total_requests} successful ({rate.success_rate?.toFixed(1)}%)
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {rate.error_count} errors (last 24h)
                                    </div>
                                  </>
                                );
                              })()}
                              {endpoint.health_detail && (
                                <div className="text-xs text-muted-foreground">{endpoint.health_detail}</div>
                              )}
                              {endpoint.last_health_check && (
                                <div className="text-xs text-muted-foreground">
                                  Last check: {new Date(endpoint.last_health_check).toLocaleString()}
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={endpoint.is_active}
                        onCheckedChange={(checked) => handleToggleActive(endpoint, checked)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleHealthCheck(endpoint.id)}
                            disabled={healthCheckingIds.has(endpoint.id)}
                          >
                            {healthCheckingIds.has(endpoint.id) ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Activity className="mr-2 h-4 w-4" />
                            )}
                            Health Check
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleOpenEndpointDialog(endpoint)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteEndpoint(endpoint.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredEndpoints.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {model.endpoints.length === 0 ? "No endpoints configured. Add one to start routing requests." : "No endpoints match your search."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEndpointDialogOpen} onOpenChange={setIsEndpointDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEndpoint ? "Edit Endpoint" : "Add Endpoint"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEndpointSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="base_url">Base URL</Label>
              <Input
                id="base_url"
                value={endpointForm.base_url}
                onChange={(e) => setEndpointForm({ ...endpointForm, base_url: e.target.value })}
                placeholder="https://api.openai.com/v1"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="api_key">API Key</Label>
              <Input
                id="api_key"
                type="password"
                value={endpointForm.api_key}
                onChange={(e) => setEndpointForm({ ...endpointForm, api_key: e.target.value })}
                placeholder={editingEndpoint ? "Leave blank to keep unchanged" : "sk-..."}
                required={!editingEndpoint}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Input
                  id="priority"
                  type="number"
                  value={endpointForm.priority}
                  onChange={(e) => setEndpointForm({ ...endpointForm, priority: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">Lower numbers are tried first</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="is_active" className="mb-2 block">Active Status</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={endpointForm.is_active}
                    onCheckedChange={(checked) => setEndpointForm({ ...endpointForm, is_active: checked })}
                  />
                  <Label htmlFor="is_active" className="font-normal">
                    {endpointForm.is_active ? "Active" : "Inactive"}
                  </Label>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={endpointForm.description || ""}
                onChange={(e) => setEndpointForm({ ...endpointForm, description: e.target.value })}
                placeholder="Optional notes"
              />
            </div>

            <div className="grid gap-2">
              <Label>Custom Headers</Label>
              <div className="space-y-2">
                {headerRows.map((row, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder="Key"
                      value={row.key}
                      onChange={(e) => handleHeaderRowChange(index, "key", e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Value"
                      value={row.value}
                      onChange={(e) => handleHeaderRowChange(index, "value", e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveHeaderRow(index)}
                      className="h-10 w-10 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddHeaderRow}
                  className="w-full border-dashed"
                >
                  <Plus className="mr-2 h-3 w-3" /> Add Header
                </Button>
              </div>
            </div>

            {dialogTestResult && (
              <div className={`flex items-center gap-2 rounded-md border p-3 text-sm ${
                dialogTestResult.status === "healthy" ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400" :
                "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400"
              }`}>
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${
                  dialogTestResult.status === "healthy" ? "bg-green-500" : "bg-red-500"
                }`} />
                {dialogTestResult.detail}
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              {editingEndpoint && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDialogTestConnection}
                  disabled={dialogTestingConnection}
                  className="mr-auto"
                >
                  {dialogTestingConnection ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Activity className="mr-2 h-4 w-4" />
                  )}
                  Test Connection
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => setIsEndpointDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
