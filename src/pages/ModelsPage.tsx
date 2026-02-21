import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { formatProviderType, formatLabel } from "@/lib/utils";
import type { ModelConfigListItem, Provider, ModelConfigCreate, ModelConfigUpdate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, MoreHorizontal, Search, Server } from "lucide-react";
import { ProviderIcon } from "@/components/ProviderIcon";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ModelsPage() {
  const navigate = useNavigate();
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

  const [formData, setFormData] = useState<ModelConfigCreate>({
    provider_id: 0,
    model_id: "",
    display_name: "",
    model_type: "native",
    redirect_to: null,
    lb_strategy: "single",
    is_enabled: true,
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

  useEffect(() => { fetchData(); }, []);

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
        };
        await api.models.update(editingModel.id, updateData);
        toast.success("Model updated");
      } else {
        await api.models.create(formData);
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
        <Select value={providerFilter} onValueChange={setProviderFilter}>
          <SelectTrigger className="w-auto min-w-[130px] h-9">
            <SelectValue placeholder="Provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Providers</SelectItem>
            <SelectItem value="openai">OpenAI</SelectItem>
            <SelectItem value="anthropic">Anthropic</SelectItem>
            <SelectItem value="gemini">Gemini</SelectItem>
          </SelectContent>
        </Select>
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
                  <TableHead className="hidden sm:table-cell">Provider</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden lg:table-cell">Strategy</TableHead>
                  <TableHead className="hidden md:table-cell text-center">Endpoints</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((model) => (
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
                              ? `${model.model_id} → ${model.redirect_to}`
                              : model.model_id}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-1.5">
                        <ProviderIcon providerType={model.provider.provider_type} size={14} />
                        <span className="text-sm">{formatProviderType(model.provider.provider_type)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {model.model_type === "proxy" ? (
                        <div className="flex items-center gap-1.5">
                          <StatusBadge label="Proxy" intent="accent" />
                          {model.redirect_to && (
                            <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">{model.redirect_to}</span>
                          )}
                        </div>
                      ) : (
                        <StatusBadge label="Native" intent="info" />
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">{formatLabel(model.lb_strategy)}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-center">
                      <span className="text-sm tabular-nums">{model.active_endpoint_count}/{model.endpoint_count}</span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        label={model.is_enabled ? "On" : "Off"}
                        intent={model.is_enabled ? "success" : "muted"}
                      />
                    </TableCell>
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
                ))}
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
                <Select
                  value={String(formData.provider_id)}
                  onValueChange={(v) => setFormData({ ...formData, provider_id: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        <div className="flex items-center gap-2">
                          <ProviderIcon providerType={p.provider_type} size={14} />
                          {p.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="Optional friendly name"
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={formData.model_type}
                onValueChange={(v) => setFormData({ ...formData, model_type: v as "native" | "proxy" })}
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
                <Input
                  value={formData.redirect_to || ""}
                  onChange={(e) => setFormData({ ...formData, redirect_to: e.target.value || null })}
                  placeholder="Target model ID"
                  required
                />
              </div>
            )}

            {formData.model_type === "native" && (
              <div className="space-y-2">
                <Label>Load Balancing</Label>
                <Select
                  value={formData.lb_strategy}
                  onValueChange={(v) => setFormData({ ...formData, lb_strategy: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="round_robin">Round Robin</SelectItem>
                    <SelectItem value="failover">Failover</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">Turn this model on or off</p>
              </div>
              <Switch
                checked={formData.is_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
                className="data-[state=checked]:bg-emerald-500"
              />
            </div>

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
