import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { formatProviderType, formatLabel, cn } from "@/lib/utils";
import { formatMoneyMicros } from "@/lib/costing";
import type { ModelConfigListItem, Provider, ModelConfigCreate, ModelConfigUpdate, LoadBalancingStrategy } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge, TypeBadge } from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SwitchController } from "@/components/SwitchController";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, MoreHorizontal, Search, Server, Columns3 } from "lucide-react";
import { ProviderIcon } from "@/components/ProviderIcon";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ProviderSelect } from "@/components/ProviderSelect";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useProfileContext } from "@/context/ProfileContext";

type ModelColumnKey =
  | "provider"
  | "type"
  | "strategy"
  | "endpoints"
  | "success"
  | "p95"
  | "requests"
  | "spend"
  | "status";

type ModelDerivedMetric = {
  success_rate: number | null;
  request_count_24h: number;
  p95_latency_ms: number | null;
};

const DEFAULT_VISIBLE_COLUMNS: Record<ModelColumnKey, boolean> = {
  provider: true,
  type: true,
  strategy: true,
  endpoints: true,
  success: true,
  p95: true,
  requests: true,
  spend: true,
  status: true,
};

const getLast24hFromTime = (): string =>
  new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

const formatLatencyCell = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) return "-";
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 1 : 2)}s`;
  return `${Math.round(value)}ms`;
};
export function ModelsPage() {
  const navigate = useNavigate();
  const { revision } = useProfileContext();
  const [models, setModels] = useState<ModelConfigListItem[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelConfigListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ModelConfigListItem | null>(null);
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [visibleColumns, setVisibleColumns] = useState<Record<ModelColumnKey, boolean>>(DEFAULT_VISIBLE_COLUMNS);
  const [modelMetrics24h, setModelMetrics24h] = useState<Record<number, ModelDerivedMetric>>({});
  const [modelSpend30dMicros, setModelSpend30dMicros] = useState<Record<number, number>>({});
  const [metricsLoading, setMetricsLoading] = useState(false);

  const [formData, setFormData] = useState<ModelConfigCreate>({
    provider_id: 0,
    model_id: "",
    display_name: "",
    model_type: "native",
    redirect_to: null,
    lb_strategy: "single",
    is_enabled: true,
    failover_recovery_enabled: true,
    failover_recovery_cooldown_seconds: 60,
  });

  const fetchData = async () => {
    try {
      const [modelsData, providersData] = await Promise.all([
        api.models.list(),
        api.providers.list(),
      ]);
      setModels(modelsData);
      setProviders(providersData);
    } catch (error) {
      toast.error("Failed to fetch data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [revision]);

  useEffect(() => {
    let cancelled = false;

    const fetchModelMetrics = async () => {
      if (models.length === 0) {
        setModelMetrics24h({});
        setModelSpend30dMicros({});
        return;
      }

      setMetricsLoading(true);
      const fromTime = getLast24hFromTime();

      try {
        const rows = await Promise.all(
          models.map(async (model) => {
            try {
              const [summary, spending] = await Promise.all([
                api.stats.summary({ model_id: model.model_id, from_time: fromTime }),
                api.stats.spending({ model_id: model.model_id, preset: "last_30_days", group_by: "none" }),
              ]);
              return {
                id: model.id,
                success_rate: summary.success_rate,
                request_count_24h: summary.total_requests,
                p95_latency_ms: summary.p95_response_time_ms,
                spend_30d_micros: spending.summary.total_cost_micros,
              };
            } catch {
              return {
                id: model.id,
                success_rate: null,
                request_count_24h: 0,
                p95_latency_ms: null,
                spend_30d_micros: 0,
              };
            }
          })
        );

        if (cancelled) return;

        const nextMetrics: Record<number, ModelDerivedMetric> = {};
        const nextSpend: Record<number, number> = {};

        for (const row of rows) {
          nextMetrics[row.id] = {
            success_rate: row.success_rate,
            request_count_24h: row.request_count_24h,
            p95_latency_ms: row.p95_latency_ms,
          };
          nextSpend[row.id] = row.spend_30d_micros;
        }

        setModelMetrics24h(nextMetrics);
        setModelSpend30dMicros(nextSpend);
      } finally {
        if (!cancelled) {
          setMetricsLoading(false);
        }
      }
    };

    fetchModelMetrics();

    return () => {
      cancelled = true;
    };
  }, [models]);

  const handleOpenDialog = (model?: ModelConfigListItem) => {
    if (model) {
      setEditingModel(model);
      setFormData({
        provider_id: model.provider_id,
        model_id: model.model_id,
        display_name: model.display_name || "",
        model_type: model.model_type,
        redirect_to: model.redirect_to,
        lb_strategy: model.lb_strategy,
        is_enabled: model.is_enabled,
        failover_recovery_enabled: model.failover_recovery_enabled,
        failover_recovery_cooldown_seconds: model.failover_recovery_cooldown_seconds,
      });
    } else {
      setEditingModel(null);
      setFormData({
        provider_id: providers[0]?.id ?? 0,
        model_id: "",
        display_name: "",
        model_type: "native",
        redirect_to: null,
        lb_strategy: "single",
        is_enabled: true,
        failover_recovery_enabled: true,
        failover_recovery_cooldown_seconds: 60,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingModel) {
        const updateData: ModelConfigUpdate = {
          display_name: formData.display_name || null,
          model_type: formData.model_type,
          redirect_to: formData.model_type === "proxy" ? formData.redirect_to : null,
          lb_strategy: formData.model_type === "native" ? formData.lb_strategy : "single",
          is_enabled: formData.is_enabled,
          failover_recovery_enabled: formData.model_type === "native" && formData.lb_strategy === "failover" ? formData.failover_recovery_enabled : true,
          failover_recovery_cooldown_seconds: formData.model_type === "native" && formData.lb_strategy === "failover" ? formData.failover_recovery_cooldown_seconds : 60,
        };
        await api.models.update(editingModel.id, updateData);
        toast.success("Model updated");
      } else {
        const createData: ModelConfigCreate = {
          ...formData,
          redirect_to: formData.model_type === "proxy" ? formData.redirect_to : null,
          lb_strategy: formData.model_type === "native" ? formData.lb_strategy : "single",
          failover_recovery_enabled: formData.model_type === "native" && formData.lb_strategy === "failover" ? formData.failover_recovery_enabled : true,
          failover_recovery_cooldown_seconds: formData.model_type === "native" && formData.lb_strategy === "failover" ? formData.failover_recovery_cooldown_seconds : 60,
        };
        await api.models.create(createData);
        toast.success("Model created");
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save model");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.models.delete(deleteTarget.id);
      toast.success("Model deleted");
      setDeleteTarget(null);
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete model");
    }
  };

  const selectedProvider = providers.find(p => p.id === formData.provider_id);
  const nativeModelsForProvider = models.filter(
    m => m.model_type === "native" && m.provider_id === formData.provider_id && (!editingModel || m.model_id !== formData.model_id)
  );

  const filtered = models.filter((m) => {
    if (search) {
      const q = search.toLowerCase();
      if (!m.model_id.toLowerCase().includes(q) && !(m.display_name || "").toLowerCase().includes(q)) return false;
    }
    if (providerFilter !== "all" && m.provider.provider_type !== providerFilter) return false;
    if (statusFilter === "enabled" && !m.is_enabled) return false;
    if (statusFilter === "disabled" && m.is_enabled) return false;
    if (typeFilter !== "all" && m.model_type !== typeFilter) return false;
    return true;
  });
  const activeColumns = useMemo(
    () => ({
      provider: visibleColumns.provider,
      type: visibleColumns.type,
      strategy: visibleColumns.strategy,
      endpoints: visibleColumns.endpoints,
      success: visibleColumns.success,
      p95: visibleColumns.p95,
      requests: visibleColumns.requests,
      spend: visibleColumns.spend,
      status: visibleColumns.status,
    }),
    [visibleColumns]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="flex gap-3">
          <Skeleton className="h-9 flex-1 max-w-sm" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Skeleton className="h-[500px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Models" description={`${models.length} model configurations`}>
        <Button size="sm" onClick={() => handleOpenDialog()}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Model
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search models..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <ProviderSelect value={providerFilter} onValueChange={setProviderFilter} providers={providers} className="w-auto min-w-[130px] h-9" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-auto min-w-[110px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="enabled">On</SelectItem>
            <SelectItem value="disabled">Off</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-auto min-w-[110px] h-9">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="native">Native</SelectItem>
            <SelectItem value="proxy">Proxy</SelectItem>
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <Columns3 className="h-4 w-4" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Visible Columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={visibleColumns.provider}
              onCheckedChange={(checked) =>
                setVisibleColumns((prev) => ({ ...prev, provider: Boolean(checked) }))
              }
            >
              Provider
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.type}
              onCheckedChange={(checked) =>
                setVisibleColumns((prev) => ({ ...prev, type: Boolean(checked) }))
              }
            >
              Type
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.strategy}
              onCheckedChange={(checked) =>
                setVisibleColumns((prev) => ({ ...prev, strategy: Boolean(checked) }))
              }
            >
              Strategy
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.endpoints}
              onCheckedChange={(checked) =>
                setVisibleColumns((prev) => ({ ...prev, endpoints: Boolean(checked) }))
              }
            >
              Endpoints
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.success}
              onCheckedChange={(checked) =>
                setVisibleColumns((prev) => ({ ...prev, success: Boolean(checked) }))
              }
            >
              Success (24h)
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.p95}
              onCheckedChange={(checked) =>
                setVisibleColumns((prev) => ({ ...prev, p95: Boolean(checked) }))
              }
            >
              P95 (24h)
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.requests}
              onCheckedChange={(checked) =>
                setVisibleColumns((prev) => ({ ...prev, requests: Boolean(checked) }))
              }
            >
              Requests (24h)
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.spend}
              onCheckedChange={(checked) =>
                setVisibleColumns((prev) => ({ ...prev, spend: Boolean(checked) }))
              }
            >
              Spend (30d)
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.status}
              onCheckedChange={(checked) =>
                setVisibleColumns((prev) => ({ ...prev, status: Boolean(checked) }))
              }
            >
              Status
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setVisibleColumns(DEFAULT_VISIBLE_COLUMNS)}>
              Reset Defaults
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Server className="h-6 w-6" />}
              title={search || providerFilter !== "all" || statusFilter !== "all" || typeFilter !== "all" ? "No models match filters" : "No models configured"}
              description={search ? "Try adjusting your search or filters" : "Create your first model to get started"}
              action={!search ? <Button size="sm" onClick={() => handleOpenDialog()}><Plus className="mr-1.5 h-4 w-4" />New Model</Button> : undefined}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  {activeColumns.provider && (
                    <TableHead className="hidden sm:table-cell">Provider</TableHead>
                  )}
                  {activeColumns.type && (
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                  )}
                  {activeColumns.strategy && (
                    <TableHead className="hidden lg:table-cell">Strategy</TableHead>
                  )}
                  {activeColumns.endpoints && (
                    <TableHead className="hidden md:table-cell text-center">Endpoints</TableHead>
                  )}
                  {activeColumns.success && (
                    <TableHead className="hidden lg:table-cell text-right">Success (24h)</TableHead>
                  )}
                  {activeColumns.p95 && (
                    <TableHead className="hidden lg:table-cell text-right">P95 (24h)</TableHead>
                  )}
                  {activeColumns.requests && (
                    <TableHead className="hidden lg:table-cell text-right">Requests (24h)</TableHead>
                  )}
                  {activeColumns.spend && (
                    <TableHead className="hidden xl:table-cell text-right">Spend (30d)</TableHead>
                  )}
                  {activeColumns.status && <TableHead>Status</TableHead>}
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((model) => {
                  const metrics24h = modelMetrics24h[model.id];
                  const successRate = metrics24h?.success_rate ?? null;
                  const requestCount = metrics24h?.request_count_24h ?? 0;
                  const p95LatencyMs = metrics24h?.p95_latency_ms ?? null;
                  const spend30dMicros = modelSpend30dMicros[model.id] ?? 0;

                  return (
                    <TableRow
                      key={model.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/models/${model.id}`)}
                    >
                      <TableCell>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="sm:hidden">
                              <ProviderIcon providerType={model.provider.provider_type} size={14} />
                            </span>
                            <span className="text-sm font-medium truncate">
                              {model.display_name || model.model_id}
                            </span>
                          </div>
                          {(model.display_name || (model.model_type === "proxy" && model.redirect_to)) && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {model.model_type === "proxy" && model.redirect_to
                                ? `Resolves to ${model.redirect_to}`
                                : model.model_id}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {activeColumns.provider && (
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-1.5">
                            <ProviderIcon providerType={model.provider.provider_type} size={14} />
                            <span className="text-sm">{formatProviderType(model.provider.provider_type)}</span>
                          </div>
                        </TableCell>
                      )}

                      {activeColumns.type && (
                        <TableCell className="hidden md:table-cell">
                          {model.model_type === "proxy" ? (
                            <div className="flex items-center">
                              <TypeBadge label="Proxy" intent="accent" />
                            </div>
                          ) : (
                            <TypeBadge label="Native" intent="info" />
                          )}
                        </TableCell>
                      )}

                      {activeColumns.strategy && (
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-xs text-muted-foreground">{formatLabel(model.lb_strategy)}</span>
                        </TableCell>
                      )}

                      {activeColumns.endpoints && (
                        <TableCell className="hidden md:table-cell text-center">
                      <span className="text-sm tabular-nums">{model.active_connection_count}/{model.connection_count}</span>
                        </TableCell>
                      )}

                      {activeColumns.success && (
                        <TableCell className="hidden lg:table-cell text-right">
                          {metricsLoading && !metrics24h ? (
                            <span className="text-sm tabular-nums text-muted-foreground">...</span>
                          ) : (
                            <span
                              className={cn(
                                "text-sm tabular-nums",
                                successRate === null
                                  ? "text-muted-foreground"
                                  : successRate >= 95
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : successRate >= 80
                                      ? "text-amber-600 dark:text-amber-400"
                                      : "text-red-600 dark:text-red-400"
                              )}
                            >
                              {successRate === null ? "-" : `${successRate.toFixed(1)}%`}
                            </span>
                          )}
                        </TableCell>
                      )}

                      {activeColumns.p95 && (
                        <TableCell className="hidden lg:table-cell text-right text-sm tabular-nums text-muted-foreground">
                          {metricsLoading ? "..." : formatLatencyCell(p95LatencyMs)}
                        </TableCell>
                      )}

                      {activeColumns.requests && (
                        <TableCell className="hidden lg:table-cell text-right text-sm tabular-nums text-muted-foreground">
                          {metricsLoading && !metrics24h
                            ? "..."
                            : requestCount > 0
                              ? requestCount.toLocaleString()
                              : "-"}
                        </TableCell>
                      )}

                      {activeColumns.spend && (
                        <TableCell className="hidden xl:table-cell text-right text-sm tabular-nums">
                          {metricsLoading
                            ? "..."
                            : formatMoneyMicros(spend30dMicros, "$", undefined, 2, 6)}
                        </TableCell>
                      )}

                      {activeColumns.status && (
                        <TableCell>
                          <StatusBadge
                            label={model.is_enabled ? "On" : "Off"}
                            intent={model.is_enabled ? "success" : "muted"}
                          />
                        </TableCell>
                      )}

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => handleOpenDialog(model)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteTarget(model)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingModel ? "Edit Model" : "New Model"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingModel && (
              <div className="space-y-2">
                <Label>Provider</Label>
                <ProviderSelect
                  value={String(formData.provider_id)}
                  onValueChange={(v) => setFormData({ ...formData, provider_id: parseInt(v), redirect_to: null })}
                  valueType="provider_id"
                  providers={providers}
                  showAll={false}
                  placeholder="Select provider"
                />
              </div>
            )}

            {!editingModel && (
              <div className="space-y-2">
                <Label>Model ID</Label>
                <Input
                  value={formData.model_id}
                  onChange={(e) => setFormData({ ...formData, model_id: e.target.value })}
                  placeholder="e.g. gpt-4o"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input
                value={formData.display_name ?? ""}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="Optional friendly name"
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={formData.model_type}
                onValueChange={(v) => setFormData({ ...formData, model_type: v as "native" | "proxy", redirect_to: v === "native" ? null : formData.redirect_to })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="native">Native</SelectItem>
                  <SelectItem value="proxy">Proxy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.model_type === "proxy" && (
              <div className="space-y-2">
                <Label>Redirect To</Label>
                {nativeModelsForProvider.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No native models available for {selectedProvider?.name || "this provider"}. Create a native model first.
                  </p>
                ) : (
                  <Select
                    value={formData.redirect_to || ""}
                    onValueChange={(val) => setFormData({ ...formData, redirect_to: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select target model" />
                    </SelectTrigger>
                    <SelectContent>
                      {nativeModelsForProvider.map((m) => (
                        <SelectItem key={m.model_id} value={m.model_id}>
                          {m.display_name || m.model_id}
                          {m.display_name && ` (${m.model_id})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {formData.model_type === "native" && (
              <div className="space-y-2">
                <Label>Load Balancing</Label>
                <Select
                  value={formData.lb_strategy}
                  onValueChange={(v) => setFormData({ ...formData, lb_strategy: v as LoadBalancingStrategy })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>

                    <SelectItem value="failover">Failover</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {formData.model_type === "native" && formData.lb_strategy === "failover" && (
              <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
                <div className="space-y-2">
                  <Label className="text-base font-medium">Recovery Policy</Label>
                  <p className="text-sm text-muted-foreground">
                    Configure how the system attempts to recover failed endpoints.
                  </p>
                </div>
                
                <SwitchController
                  label="Auto-Recovery"
                  description="Periodically check failed endpoints"
                  checked={formData.failover_recovery_enabled ?? true}
                  onCheckedChange={(checked) => setFormData({ ...formData, failover_recovery_enabled: checked })}
                />

                {formData.failover_recovery_enabled && (
                  <div className="space-y-2">
                    <Label>Cooldown Period (seconds)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={3600}
                      value={formData.failover_recovery_cooldown_seconds}
                      onChange={(e) => setFormData({ ...formData, failover_recovery_cooldown_seconds: parseInt(e.target.value) || 60 })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Wait time before retrying a failed endpoint (1-3600s).
                    </p>
                  </div>
                )}
              </div>
            )}

            <SwitchController
              label="Active"
              description="Turn this model on or off"
              checked={formData.is_enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Model</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteTarget?.display_name || deleteTarget?.model_id}"? This will also delete all associated endpoints.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
