import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Endpoint, ModelConfigListItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { useProfileContext } from "@/context/ProfileContext";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Pencil,
  Trash2,
  Plug,
  AlertTriangle,
  Boxes,
  Link2,
  Sparkles,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTimezone } from "@/hooks/useTimezone";
import { EndpointDialog, type EndpointFormValues } from "./endpoints/EndpointDialog";
import {
  buildDuplicateName,
  copyTextToClipboard,
  getEndpointHost,
  getMaskedApiKey,
  getModelBadgeClass,
} from "./endpoints/utils";

export function EndpointsPage() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [endpointModels, setEndpointModels] = useState<Record<number, ModelConfigListItem[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingEndpoint, setIsDeletingEndpoint] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<Endpoint | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Endpoint | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { revision } = useProfileContext();
  const { format: formatTime } = useTimezone();
  const fetchEndpoints = async () => {
    try {
      const data = await api.endpoints.list();
      setEndpoints(data);

      // Fetch attached models for each endpoint card.
      const modelsMap: Record<number, ModelConfigListItem[]> = {};
      await Promise.all(data.map(async (ep) => {
        try {
          const models = await api.models.byEndpoint(ep.id);
          modelsMap[ep.id] = models;
        } catch (e) {
          console.error(`Failed to fetch models for endpoint ${ep.id}`, e);
          modelsMap[ep.id] = [];
        }
      }));
      setEndpointModels(modelsMap);
    } catch {
      toast.error("Failed to load endpoints");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEndpoints();
  }, [revision]);

  const handleCreate = async (values: EndpointFormValues) => {
    try {
      await api.endpoints.create(values);
      toast.success("Endpoint created");
      setIsCreateOpen(false);
      fetchEndpoints();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create endpoint");
    }
  };

  const handleUpdate = async (values: EndpointFormValues) => {
    if (!editingEndpoint) return;
    try {
      await api.endpoints.update(editingEndpoint.id, values);
      toast.success("Endpoint updated");
      setEditingEndpoint(null);
      fetchEndpoints();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update endpoint");
    }
  };

  const handleDelete = async (id: number) => {
    setIsDeletingEndpoint(true);
    try {
      await api.endpoints.delete(id);
      toast.success("Endpoint deleted");
      setDeleteTarget(null);
      setDeleteError(null);
      fetchEndpoints();
    } catch (error) {
      setDeleteTarget(null);
      if (error instanceof Error) {
        const normalizedMessage = error.message.toLowerCase();
        if (
          normalizedMessage.includes("dependency") ||
          normalizedMessage.includes("409") ||
          normalizedMessage.includes("cannot delete endpoint") ||
          normalizedMessage.includes("referenced by connections")
        ) {
          setDeleteError(error.message);
          return;
        }
      }
      toast.error(error instanceof Error ? error.message : "Failed to delete endpoint");
    } finally {
      setIsDeletingEndpoint(false);
    }
  };

  const handleDuplicateEndpoint = async (endpoint: Endpoint) => {
    const existingNames = new Set(endpoints.map((item) => item.name));
    let nextName = buildDuplicateName(endpoint.name, existingNames);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const created = await api.endpoints.create({
          name: nextName,
          base_url: endpoint.base_url,
          api_key: endpoint.api_key,
        });
        toast.success(`Endpoint duplicated as ${created.name}`);
        fetchEndpoints();
        return;
      } catch (error) {
        if (error instanceof Error && error.message.toLowerCase().includes("already exists")) {
          existingNames.add(nextName);
          nextName = buildDuplicateName(endpoint.name, existingNames);
          continue;
        }
        toast.error(error instanceof Error ? error.message : "Failed to duplicate endpoint");
        return;
      }
    }

    toast.error("Failed to duplicate endpoint");
  };

  const handleCopyApiKey = async (endpoint: Endpoint) => {
    const copied = await copyTextToClipboard(endpoint.api_key);
    if (!copied) {
      toast.error("Failed to copy API key");
      return;
    }
    toast.success(`Copied API key for ${endpoint.name}`);
  };

  const totalAttachedModels = useMemo(
    () => Object.values(endpointModels).reduce((sum, models) => sum + models.length, 0),
    [endpointModels]
  );

  const uniqueAttachedModels = useMemo(() => {
    const ids = new Set<string>();
    Object.values(endpointModels).forEach((models) => {
      models.forEach((model) => {
        ids.add(model.model_id);
      });
    });
    return ids.size;
  }, [endpointModels]);

  const endpointsInUse = useMemo(
    () => endpoints.filter((endpoint) => (endpointModels[endpoint.id] ?? []).length > 0).length,
    [endpoints, endpointModels]
  );

  return (
    <div className="space-y-[var(--density-page-gap)]">
      <PageHeader
        title="Endpoints"
        description="Manage global API credentials and model routing targets."
      >
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Endpoint
        </Button>
      </PageHeader>

      {deleteError && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <h5 className="font-medium leading-none tracking-tight">Cannot Delete Endpoint</h5>
          </div>
          <div className="mt-2 text-sm opacity-90">{deleteError}</div>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 border-destructive/20 hover:bg-destructive/20"
            onClick={() => setDeleteError(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      {!isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Configured Endpoints
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums">{endpoints.length}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary">
                <Boxes className="h-4 w-4" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Attached Models
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums">{totalAttachedModels}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary">
                <Link2 className="h-4 w-4" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Unique Models In Use
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums">{uniqueAttachedModels}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {endpointsInUse} of {endpoints.length} endpoints mapped
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[280px] rounded-xl" />
          ))}
        </div>
      ) : endpoints.length === 0 ? (
        <EmptyState
          icon={<Plug className="h-6 w-6" />}
          title="No endpoints configured"
          description="Add your first endpoint to start routing requests."
          action={
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Endpoint
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {endpoints.map((endpoint) => {
            const models = endpointModels[endpoint.id] || [];
            const maskedKey = getMaskedApiKey(endpoint);

            return (
              <Card
                key={endpoint.id}
                className="group flex h-full flex-col border-border/80 bg-card transition-colors hover:border-border"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-2">
                      <CardTitle className="truncate pr-2 text-base font-semibold">
                        {endpoint.name}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className="max-w-full truncate border-border/70 bg-muted/30 px-2 py-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                      >
                        {getEndpointHost(endpoint.base_url)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Duplicate endpoint ${endpoint.name}`}
                        className="h-9 w-9 rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        onClick={() => {
                          void handleDuplicateEndpoint(endpoint);
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit endpoint ${endpoint.name}`}
                        className="h-9 w-9 rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        onClick={() => setEditingEndpoint(endpoint)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete endpoint ${endpoint.name}`}
                        className="h-9 w-9 rounded-md text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeleteTarget(endpoint)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-4">
                  <div className="space-y-2">
                    <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Base URL
                      </p>
                      <p className="mt-1 break-all font-mono text-xs text-foreground/90">
                        {endpoint.base_url}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            API Key
                          </p>
                          <p className="mt-1 break-all font-mono text-xs text-foreground/90">
                            {maskedKey}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Copy API key for ${endpoint.name}`}
                            className="h-8 w-8 rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            onClick={() => {
                              void handleCopyApiKey(endpoint);
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Attached Models
                      </p>
                      <Badge
                        variant="outline"
                        className="rounded-full border-border/70 bg-background px-2 py-0 text-[10px] font-medium text-muted-foreground"
                      >
                        {models.length}
                      </Badge>
                    </div>
                    {models.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {models.slice(0, 5).map((m) => (
                          <Badge
                            key={m.id}
                            variant="outline"
                            className={cn(
                              "rounded-full border px-2.5 py-0.5 text-[10px] font-medium",
                              getModelBadgeClass(m)
                            )}
                          >
                            {m.display_name || m.model_id}
                          </Badge>
                        ))}
                        {models.length > 5 && (
                          <Badge
                            variant="outline"
                            className="rounded-full border-border/70 bg-muted/30 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                          >
                            +{models.length - 5} more
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs italic text-muted-foreground">
                        Not attached to any models
                      </p>
                    )}
                  </div>

                  <div className="mt-auto border-t border-dashed border-border/70 pt-3">
                    <p className="text-[11px] text-muted-foreground">
                      Created {formatTime(endpoint.created_at, { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <EndpointDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreate}
        title="Add Endpoint"
        submitLabel="Create Endpoint"
      />

      <EndpointDialog
        open={!!editingEndpoint}
        onOpenChange={(open) => !open && setEditingEndpoint(null)}
        onSubmit={handleUpdate}
        initialValues={editingEndpoint || undefined}
        title="Edit Endpoint"
        submitLabel="Save Changes"
      />

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !isDeletingEndpoint) {
            setDeleteTarget(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Endpoint</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={isDeletingEndpoint}
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDeletingEndpoint || !deleteTarget}
              onClick={() => {
                if (!deleteTarget) return;
                void handleDelete(deleteTarget.id);
              }}
            >
              {isDeletingEndpoint ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
