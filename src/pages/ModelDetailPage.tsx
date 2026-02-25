import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { cn, formatProviderType, formatLabel } from "@/lib/utils";
import {
  formatMissingSpecialTokenPolicyLabel,
  formatPricingUnitLabel,
  isValidCurrencyCode,
} from "@/lib/costing";
import type { ModelConfig, Endpoint, EndpointCreate, EndpointUpdate, EndpointSuccessRate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, TypeBadge, ValueBadge } from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SwitchController } from "@/components/SwitchController";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { ArrowLeft, Plus, Pencil, Trash2, MoreHorizontal, Search, Activity, Loader2, X, ChevronRight, Shield, Coins } from "lucide-react";
import { ProviderIcon } from "@/components/ProviderIcon";
import { EmptyState } from "@/components/EmptyState";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [pricingSectionOpen, setPricingSectionOpen] = useState(false);
  const [pricingValidationError, setPricingValidationError] = useState<string | null>(null);
  const [successRates, setSuccessRates] = useState<Map<number, EndpointSuccessRate>>(new Map());
  const [focusedEndpointId, setFocusedEndpointId] = useState<number | null>(null);
  const endpointCardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const focusHandled = useRef(false);

  const [endpointForm, setEndpointForm] = useState<EndpointCreate>({
    base_url: "",
    api_key: "",
    priority: 0,
    description: "",
    is_active: true,
    custom_headers: null,
    pricing_enabled: false,
    pricing_unit: "PER_1M",
    pricing_currency_code: "USD",
    input_price: null,
    output_price: null,
    cached_input_price: null,
    cache_creation_price: null,
    reasoning_price: null,
    missing_special_token_price_policy: "MAP_TO_OUTPUT",
  });
  const [headerRows, setHeaderRows] = useState<{ key: string; value: string }[]>([]);

  const fetchModel = useCallback(async () => {
    if (!id) return;
    try {
      const [data, rates] = await Promise.all([
        api.models.get(parseInt(id)),
        api.stats.endpointSuccessRates(),
      ]);
      setModel(data);
      const rateMap = new Map<number, EndpointSuccessRate>();
      for (const r of rates) rateMap.set(r.endpoint_id, r);
      setSuccessRates(rateMap);
    } catch (error) {
      toast.error("Failed to fetch model details");
      console.error(error);
      navigate("/models");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchModel(); }, [fetchModel]);

  useEffect(() => {
    if (!model || focusHandled.current) return;
    const focusId = searchParams.get("focus_endpoint_id");
    if (!focusId) return;
    const eid = parseInt(focusId);
    setFocusedEndpointId(eid);
    focusHandled.current = true;
    setSearchParams({}, { replace: true });
    setTimeout(() => {
      const el = endpointCardRefs.current.get(eid);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => setFocusedEndpointId(null), 3000);
      }
    }, 200);
  }, [model, searchParams, setSearchParams]);

  const normalizeOptionalDecimal = (value: string | null | undefined): string | null => {
    if (value === null || value === undefined) {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  const isNonNegativeDecimal = (value: string): boolean => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0;
  };

  const validatePricingForm = (): string | null => {
    if (!endpointForm.pricing_enabled) {
      return null;
    }

    const currency = endpointForm.pricing_currency_code?.trim().toUpperCase() || "";
    if (!isValidCurrencyCode(currency)) {
      return "Pricing currency must be a valid 3-letter code (for example, USD).";
    }
    if (!endpointForm.pricing_unit) {
      return "Pricing unit is required when pricing is enabled.";
    }

    const decimalFields = [
      ["Input price", endpointForm.input_price],
      ["Output price", endpointForm.output_price],
      ["Cached input price", endpointForm.cached_input_price],
      ["Cache creation price", endpointForm.cache_creation_price],
      ["Reasoning price", endpointForm.reasoning_price],
    ] as const;

    for (const [label, fieldValue] of decimalFields) {
      const normalized = normalizeOptionalDecimal(fieldValue);
      if (normalized && !isNonNegativeDecimal(normalized)) {
        return `${label} must be a non-negative decimal value.`;
      }
    }

    return null;
  };

  const openEndpointDialog = (endpoint?: Endpoint) => {
    if (endpoint) {
      setEditingEndpoint(endpoint);
      const headers = endpoint.custom_headers
        ? Object.entries(endpoint.custom_headers).map(([key, value]) => ({ key, value }))
        : [];
      setHeaderRows(headers);
      setEndpointForm({
        base_url: endpoint.base_url,
        api_key: endpoint.api_key,
        priority: endpoint.priority,
        description: endpoint.description || "",
        is_active: endpoint.is_active,
        custom_headers: endpoint.custom_headers,
        pricing_enabled: endpoint.pricing_enabled,
        pricing_unit: endpoint.pricing_unit ?? "PER_1M",
        pricing_currency_code: endpoint.pricing_currency_code || "USD",
        input_price: endpoint.input_price,
        output_price: endpoint.output_price,
        cached_input_price: endpoint.cached_input_price,
        cache_creation_price: endpoint.cache_creation_price,
        reasoning_price: endpoint.reasoning_price,
        missing_special_token_price_policy: endpoint.missing_special_token_price_policy,
      });
      setPricingSectionOpen(endpoint.pricing_enabled);
    } else {
      setEditingEndpoint(null);
      setHeaderRows([]);
      setEndpointForm({
        base_url: "",
        api_key: "",
        priority: 0,
        description: "",
        is_active: true,
        custom_headers: null,
        pricing_enabled: false,
        pricing_unit: "PER_1M",
        pricing_currency_code: "USD",
        input_price: null,
        output_price: null,
        cached_input_price: null,
        cache_creation_price: null,
        reasoning_price: null,
        missing_special_token_price_policy: "MAP_TO_OUTPUT",
      });
      setPricingSectionOpen(false);
    }
    setPricingValidationError(null);
    setDialogTestResult(null);
    setIsEndpointDialogOpen(true);
  };

  const handleEndpointSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const customHeaders = headerRows.length > 0
      ? Object.fromEntries(headerRows.filter(r => r.key.trim()).map(r => [r.key.trim(), r.value]))
      : null;

    const pricingError = validatePricingForm();
    if (pricingError) {
      setPricingValidationError(pricingError);
      toast.error(pricingError);
      return;
    }

    setPricingValidationError(null);

    const payload: EndpointCreate = {
      ...endpointForm,
      custom_headers: customHeaders,
      pricing_currency_code: endpointForm.pricing_currency_code
        ? endpointForm.pricing_currency_code.trim().toUpperCase()
        : null,
      input_price: normalizeOptionalDecimal(endpointForm.input_price),
      output_price: normalizeOptionalDecimal(endpointForm.output_price),
      cached_input_price: normalizeOptionalDecimal(endpointForm.cached_input_price),
      cache_creation_price: normalizeOptionalDecimal(endpointForm.cache_creation_price),
      reasoning_price: normalizeOptionalDecimal(endpointForm.reasoning_price),
    };

    try {
      if (editingEndpoint) {
        const updateData: EndpointUpdate = { ...payload };
        await api.endpoints.update(editingEndpoint.id, updateData);
        toast.success("Endpoint updated");
      } else {
        await api.endpoints.create(parseInt(id!), payload);
        toast.success("Endpoint created");
      }
      setIsEndpointDialogOpen(false);
      fetchModel();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save endpoint");
    }
  };

  const handleDeleteEndpoint = async (endpointId: number) => {
    try {
      await api.endpoints.delete(endpointId);
      toast.success("Endpoint deleted");
      fetchModel();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete endpoint");
    }
  };

  const handleHealthCheck = async (endpointId: number) => {
    setHealthCheckingIds(prev => new Set(prev).add(endpointId));
    try {
      const result = await api.endpoints.healthCheck(endpointId);
      toast.success(`Health: ${result.health_status} (${result.response_time_ms}ms)`);
      fetchModel();
    } catch {
      toast.error("Health check failed");
    } finally {
      setHealthCheckingIds(prev => { const s = new Set(prev); s.delete(endpointId); return s; });
    }
  };

  const handleDialogTestConnection = async () => {
    if (!editingEndpoint) return;
    setDialogTestingConnection(true);
    setDialogTestResult(null);
    try {
      const result = await api.endpoints.healthCheck(editingEndpoint.id);
      setDialogTestResult({ status: result.health_status, detail: result.detail });
    } catch {
      setDialogTestResult({ status: "error", detail: "Connection test failed" });
    } finally {
      setDialogTestingConnection(false);
    }
  };

  const handleToggleActive = async (endpoint: Endpoint) => {
    try {
      await api.endpoints.update(endpoint.id, { is_active: !endpoint.is_active });
      fetchModel();
    } catch {
      toast.error("Failed to toggle endpoint");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-7 w-48" />
        </div>
        <Skeleton className="h-[120px] rounded-xl" />
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  if (!model) return null;

  const endpoints = model.endpoints || [];
  const filteredEndpoints = [...(endpointSearch
    ? endpoints.filter(ep =>
        (ep.description || "").toLowerCase().includes(endpointSearch.toLowerCase()) ||
        ep.base_url.toLowerCase().includes(endpointSearch.toLowerCase())
      )
    : endpoints
  )].sort((a, b) => a.priority - b.priority);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate("/models")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold tracking-tight truncate">
              {model.display_name || model.model_id}
            </h1>
            <TypeBadge
              label={model.model_type}
              intent={model.model_type === "proxy" ? "accent" : "info"}
            />
            <StatusBadge
              label={model.is_enabled ? "Enabled" : "Disabled"}
              intent={model.is_enabled ? "success" : "muted"}
            />
          </div>
          {model.display_name && (
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">{model.model_id}</p>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Provider</p>
              <div className="flex items-center gap-2">
                <ProviderIcon providerType={model.provider.provider_type} size={14} />
                <span className="text-sm font-medium">{formatProviderType(model.provider.provider_type)}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {model.model_type === "proxy" ? "Redirects To" : "Load Balancing"}
              </p>
              <span className="text-sm font-medium">
                {model.model_type === "proxy" ? (
                  <span className="flex items-center gap-1">
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    <span className="font-mono text-xs">{model.redirect_to}</span>
                  </span>
                ) : (
                  formatLabel(model.lb_strategy)
                )}
              </span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Recovery Policy</p>
              <span className="text-sm font-medium">
                {model.model_type === "native" && model.lb_strategy === "failover" ? (
                  model.failover_recovery_enabled ? (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Enabled ({model.failover_recovery_cooldown_seconds}s)
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Disabled</span>
                  )
                ) : (
                  <span className="text-muted-foreground">N/A</span>
                )}
              </span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Endpoints</p>
              <span className="text-sm font-medium">
                {endpoints.filter(e => e.is_active).length} active / {endpoints.length} total
              </span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Created</p>
              <span className="text-sm font-medium">
                {new Date(model.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold">
            Endpoints
            <span className="ml-2 text-xs font-normal text-muted-foreground">({endpoints.length})</span>
          </h2>
          <div className="flex items-center gap-2">
            {endpoints.length > 3 && (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Filter endpoints..."
                  value={endpointSearch}
                  onChange={(e) => setEndpointSearch(e.target.value)}
                  className="h-8 w-48 pl-8 text-xs"
                />
              </div>
            )}
            <Button size="sm" onClick={() => openEndpointDialog()}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Endpoint
            </Button>
          </div>
        </div>

        {filteredEndpoints.length === 0 ? (
          <EmptyState
            icon={<Shield className="h-6 w-6" />}
            title={endpointSearch ? "No endpoints match your filter" : "No endpoints configured"}
            description={endpointSearch ? "Try a different search term" : "Add an endpoint to start routing requests"}
            action={!endpointSearch ? (
              <Button size="sm" onClick={() => openEndpointDialog()}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Endpoint
              </Button>
            ) : undefined}
          />
        ) : (
          <div className="space-y-2">
            {filteredEndpoints.map((ep) => {
              const rate = successRates.get(ep.id);
              const isChecking = healthCheckingIds.has(ep.id);
              const isFocused = focusedEndpointId === ep.id;
              const successRate = rate?.success_rate ?? 0;
              const maskedKey = ep.api_key.length > 8
                ? `${ep.api_key.slice(0, 4)}••••••${ep.api_key.slice(-4)}`
                : "••••••";

              return (
                <div
                  key={ep.id}
                  ref={(el) => { if (el) endpointCardRefs.current.set(ep.id, el); }}
                  className={cn(
                    "rounded-lg border p-4 transition-all duration-300",
                    isFocused && "ring-2 ring-primary/50 bg-primary/5",
                    !isFocused && "hover:border-border/80"
                  )}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn(
                          "inline-block h-2 w-2 rounded-full shrink-0",
                          ep.health_status === "healthy" ? "bg-emerald-500" :
                          ep.health_status === "unhealthy" ? "bg-red-500" : "bg-gray-400"
                        )} />
                        <span className="text-sm font-medium truncate">
                          {ep.description || `Endpoint #${ep.id}`}
                        </span>
                        <ValueBadge
                          label={`P${ep.priority}`}
                          intent={ep.priority >= 10 ? "warning" : ep.priority >= 1 ? "info" : "muted"}
                        />
                        <StatusBadge
                          label={ep.pricing_enabled ? "Pricing On" : "Pricing Off"}
                          intent={ep.pricing_enabled ? "success" : "muted"}
                        />
                        {ep.pricing_enabled && ep.pricing_unit && (
                          <ValueBadge
                            label={formatPricingUnitLabel(ep.pricing_unit)}
                            intent="info"
                          />
                        )}
                        {ep.pricing_enabled && ep.pricing_currency_code && (
                          <ValueBadge label={ep.pricing_currency_code} intent="accent" />
                        )}
                        {ep.pricing_enabled && (
                          <ValueBadge
                            label={formatMissingSpecialTokenPolicyLabel(ep.missing_special_token_price_policy)}
                            intent={ep.missing_special_token_price_policy === "ZERO_COST" ? "warning" : "info"}
                          />
                        )}
                        {!ep.is_active && (
                          <StatusBadge label="Inactive" intent="muted" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono break-all">{ep.base_url}</p>
                      {ep.pricing_enabled ? (
                        <p className="text-[11px] text-muted-foreground">
                          Input {ep.input_price ?? "0"} / Output {ep.output_price ?? "0"} / Cached {ep.cached_input_price ?? "0"} / Cache Create {ep.cache_creation_price ?? "0"} / Reasoning {ep.reasoning_price ?? "0"}
                        </p>
                      ) : null}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Key: {maskedKey}</span>
                        {ep.last_health_check && (
                          <span>Checked {new Date(ep.last_health_check).toLocaleTimeString()}</span>
                        )}
                      </div>
                      {rate && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2 pt-0.5">
                                <Progress
                                  value={successRate}
                                  className={cn(
                                    "h-1.5",
                                    successRate >= 95 ? "[&>[data-slot=progress-indicator]]:bg-emerald-500" :
                                    successRate >= 80 ? "[&>[data-slot=progress-indicator]]:bg-amber-500" :
                                    "[&>[data-slot=progress-indicator]]:bg-red-500"
                                  )}
                                />
                                <span className={cn(
                                  "text-[10px] font-medium tabular-nums shrink-0",
                                  successRate >= 95 ? "text-emerald-600 dark:text-emerald-400" :
                                  successRate >= 80 ? "text-amber-600 dark:text-amber-400" :
                                  "text-red-600 dark:text-red-400"
                                )}>
                                  {successRate.toFixed(1)}%
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="pointer-events-none">
                              <p className="text-xs">
                                {rate.total_requests > 0
                                  ? `${rate.success_count}/${rate.total_requests} requests succeeded`
                                  : "No requests yet"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={ep.is_active}
                        onCheckedChange={() => handleToggleActive(ep)}
                        className="scale-90 data-[state=checked]:bg-emerald-500"
                      />

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEndpointDialog(ep)}>
                            <Pencil className="mr-2 h-3.5 w-3.5" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleHealthCheck(ep.id)} disabled={isChecking}>
                            {isChecking ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Activity className="mr-2 h-3.5 w-3.5" />}
                            Health Check
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteEndpoint(ep.id)}>
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={isEndpointDialogOpen} onOpenChange={setIsEndpointDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEndpoint ? "Edit Endpoint" : "Add Endpoint"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEndpointSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ep-url">Base URL</Label>
              <Input
                id="ep-url"
                placeholder="https://api.openai.com/v1"
                value={endpointForm.base_url}
                onChange={(e) => setEndpointForm({ ...endpointForm, base_url: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ep-key">API Key</Label>
              <Input
                id="ep-key"
                type="password"
                placeholder="sk-..."
                value={endpointForm.api_key}
                onChange={(e) => setEndpointForm({ ...endpointForm, api_key: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ep-priority">Priority</Label>
                <Input
                  id="ep-priority"
                  type="number"
                  min={0}
                  value={endpointForm.priority}
                  onChange={(e) => setEndpointForm({ ...endpointForm, priority: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ep-desc">Description</Label>
                <Input
                  id="ep-desc"
                  placeholder="Optional label"
                  value={endpointForm.description || ""}
                  onChange={(e) => setEndpointForm({ ...endpointForm, description: e.target.value })}
                />
              </div>
            </div>

            <SwitchController
              label="Active"
              description="Include in load balancing"
              checked={endpointForm.is_active}
              onCheckedChange={(checked) => setEndpointForm({ ...endpointForm, is_active: checked })}
            />

            <Collapsible
              open={pricingSectionOpen}
              onOpenChange={setPricingSectionOpen}
              className="rounded-lg border p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 text-sm font-medium">
                    <Coins className="h-4 w-4 text-muted-foreground" />
                    Token Pricing
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Configure per-endpoint token cost tracking.
                  </p>
                </div>
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="ghost" size="sm">
                    {pricingSectionOpen ? "Hide" : "Configure"}
                  </Button>
                </CollapsibleTrigger>
              </div>

              <CollapsibleContent className="space-y-3 pt-3">
                <SwitchController
                  label="Enable pricing"
                  description="When disabled, requests on this endpoint are tracked as unpriced."
                  checked={endpointForm.pricing_enabled ?? false}
                  onCheckedChange={(checked) =>
                    setEndpointForm({
                      ...endpointForm,
                      pricing_enabled: checked,
                      ...(checked && {
                        pricing_unit: endpointForm.pricing_unit ?? "PER_1M",
                        pricing_currency_code: endpointForm.pricing_currency_code || "USD",
                      }),
                    })
                  }
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pricing-unit">Pricing Unit</Label>
                    <Select
                      value={endpointForm.pricing_unit ?? "PER_1M"}
                      onValueChange={(value) =>
                        setEndpointForm({
                          ...endpointForm,
                          pricing_unit: value as "PER_1K" | "PER_1M",
                        })
                      }
                      disabled={!endpointForm.pricing_enabled}
                    >
                      <SelectTrigger id="pricing-unit">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PER_1K">Per 1K tokens</SelectItem>
                        <SelectItem value="PER_1M">Per 1M tokens</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pricing-currency">Currency Code</Label>
                    <Input
                      id="pricing-currency"
                      placeholder="USD"
                      maxLength={3}
                      value={endpointForm.pricing_currency_code ?? ""}
                      onChange={(e) =>
                        setEndpointForm({
                          ...endpointForm,
                          pricing_currency_code: e.target.value.toUpperCase(),
                        })
                      }
                      disabled={!endpointForm.pricing_enabled}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="input-price">Input Price</Label>
                    <Input
                      id="input-price"
                      placeholder="0"
                      inputMode="decimal"
                      value={endpointForm.input_price ?? ""}
                      onChange={(e) =>
                        setEndpointForm({ ...endpointForm, input_price: e.target.value })
                      }
                      disabled={!endpointForm.pricing_enabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="output-price">Output Price</Label>
                    <Input
                      id="output-price"
                      placeholder="0"
                      inputMode="decimal"
                      value={endpointForm.output_price ?? ""}
                      onChange={(e) =>
                        setEndpointForm({ ...endpointForm, output_price: e.target.value })
                      }
                      disabled={!endpointForm.pricing_enabled}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="cached-input-price">Cached Input Price</Label>
                    <Input
                      id="cached-input-price"
                      placeholder="0"
                      inputMode="decimal"
                      value={endpointForm.cached_input_price ?? ""}
                      onChange={(e) =>
                        setEndpointForm({
                          ...endpointForm,
                          cached_input_price: e.target.value,
                        })
                      }
                      disabled={!endpointForm.pricing_enabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cache-creation-price">Cache Creation Price</Label>
                    <Input
                      id="cache-creation-price"
                      placeholder="0"
                      inputMode="decimal"
                      value={endpointForm.cache_creation_price ?? ""}
                      onChange={(e) =>
                        setEndpointForm({
                          ...endpointForm,
                          cache_creation_price: e.target.value,
                        })
                      }
                      disabled={!endpointForm.pricing_enabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reasoning-price">Reasoning Price</Label>
                    <Input
                      id="reasoning-price"
                      placeholder="0"
                      inputMode="decimal"
                      value={endpointForm.reasoning_price ?? ""}
                      onChange={(e) =>
                        setEndpointForm({
                          ...endpointForm,
                          reasoning_price: e.target.value,
                        })
                      }
                      disabled={!endpointForm.pricing_enabled}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="missing-policy">Missing Special Token Policy</Label>
                  <Select
                    value={endpointForm.missing_special_token_price_policy ?? "MAP_TO_OUTPUT"}
                    onValueChange={(value) =>
                      setEndpointForm({
                        ...endpointForm,
                        missing_special_token_price_policy: value as "MAP_TO_OUTPUT" | "ZERO_COST",
                      })
                    }
                    disabled={!endpointForm.pricing_enabled}
                  >
                    <SelectTrigger id="missing-policy">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MAP_TO_OUTPUT">Map to output price</SelectItem>
                      <SelectItem value="ZERO_COST">Zero cost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {pricingValidationError && (
                  <p className="text-xs text-destructive">{pricingValidationError}</p>
                )}
              </CollapsibleContent>
            </Collapsible>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Custom Headers</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setHeaderRows([...headerRows, { key: "", value: "" }])}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add
                </Button>
              </div>
              {headerRows.map((row, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder="Header name"
                    value={row.key}
                    onChange={(e) => {
                      const updated = [...headerRows];
                      updated[i] = { ...updated[i], key: e.target.value };
                      setHeaderRows(updated);
                    }}
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="Value"
                    value={row.value}
                    onChange={(e) => {
                      const updated = [...headerRows];
                      updated[i] = { ...updated[i], value: e.target.value };
                      setHeaderRows(updated);
                    }}
                    className="h-8 text-xs"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => setHeaderRows(headerRows.filter((_, j) => j !== i))}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            {dialogTestResult && (
              <div className={cn(
                "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
                dialogTestResult.status === "healthy"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400"
              )}>
                <span className={cn(
                  "inline-block h-2.5 w-2.5 rounded-full",
                  dialogTestResult.status === "healthy" ? "bg-emerald-500" : "bg-red-500"
                )} />
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
                  size="sm"
                >
                  {dialogTestingConnection ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Activity className="mr-1.5 h-3.5 w-3.5" />}
                  Test
                </Button>
              )}
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEndpointDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
