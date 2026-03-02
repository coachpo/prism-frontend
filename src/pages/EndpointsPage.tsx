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
import { Input } from "@/components/ui/input";
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
  Eye,
  EyeOff,
  Boxes,
  Link2,
  Sparkles,
  Copy,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

const endpointSchema = z.object({
  name: z.string().min(1, "Name is required"),
  base_url: z.string().url("Must be a valid URL"),
  api_key: z.string().min(1, "API Key is required"),
});

type EndpointFormValues = z.infer<typeof endpointSchema>;

const MODEL_BADGE_STYLES = [
  "border-sky-500/30 bg-sky-500/10 text-sky-800 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-200",
  "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200",
  "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200",
  "border-rose-500/30 bg-rose-500/10 text-rose-800 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-200",
  "border-indigo-500/30 bg-indigo-500/10 text-indigo-800 dark:border-indigo-400/30 dark:bg-indigo-400/10 dark:text-indigo-200",
  "border-teal-500/30 bg-teal-500/10 text-teal-800 dark:border-teal-400/30 dark:bg-teal-400/10 dark:text-teal-200",
  "border-orange-500/30 bg-orange-500/10 text-orange-800 dark:border-orange-400/30 dark:bg-orange-400/10 dark:text-orange-200",
  "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-800 dark:border-fuchsia-400/30 dark:bg-fuchsia-400/10 dark:text-fuchsia-200",
] as const;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function normalizeModelColorKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function getModelBadgeClass(model: ModelConfigListItem): string {
  const colorKey = normalizeModelColorKey(model.display_name || model.model_id);
  return MODEL_BADGE_STYLES[hashString(colorKey) % MODEL_BADGE_STYLES.length];
}

function getEndpointHost(baseUrl: string): string {
  try {
    return new URL(baseUrl).host;
  } catch {
    return baseUrl;
  }
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function buildDuplicateName(sourceName: string, existingNames: Set<string>): string {
  const baseName = `${sourceName.trim()} copy`;
  if (!existingNames.has(baseName)) {
    return baseName;
  }

  let suffix = 2;
  while (existingNames.has(`${baseName} ${suffix}`)) {
    suffix += 1;
  }
  return `${baseName} ${suffix}`;
}

function fallbackCopyText(text: string): boolean {
  if (typeof document === "undefined") return false;
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  // Try fallback first so copy still works in restricted/insecure contexts.
  if (fallbackCopyText(text)) {
    return true;
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // No-op: fall through to false.
    }
  }

  return false;
}

export function EndpointsPage() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [endpointModels, setEndpointModels] = useState<Record<number, ModelConfigListItem[]>>({});
  const [revealedApiKeys, setRevealedApiKeys] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingEndpoint, setIsDeletingEndpoint] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<Endpoint | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Endpoint | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { revision } = useProfileContext();

  const fetchEndpoints = async () => {
    try {
      const data = await api.endpoints.list();
      setEndpoints(data);
      setRevealedApiKeys({});

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
    <div className="space-y-7">
      <PageHeader
        title="Endpoints"
        description="Manage global API credentials and model routing targets."
      >
        <Button onClick={() => setIsCreateOpen(true)} className="shadow-sm">
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
          <div className="rounded-xl border border-border/70 bg-gradient-to-br from-background via-background to-muted/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Configured Endpoints
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums">{endpoints.length}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300">
                <Boxes className="h-4 w-4" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border/70 bg-gradient-to-br from-background via-background to-muted/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Attached Models
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums">{totalAttachedModels}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                <Link2 className="h-4 w-4" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border/70 bg-gradient-to-br from-background via-background to-muted/40 p-4 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Unique Models In Use
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums">{uniqueAttachedModels}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300">
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
            const isApiKeyRevealed = revealedApiKeys[endpoint.id] ?? false;
            const maskedKey = endpoint.api_key.length > 8
              ? `${endpoint.api_key.slice(0, 4)}••••••${endpoint.api_key.slice(-4)}`
              : "••••••";

            return (
              <Card
                key={endpoint.id}
                className="group relative flex h-full flex-col overflow-hidden border-border/70 bg-gradient-to-b from-card via-card to-muted/20 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500/70 via-cyan-500/30 to-emerald-500/70"
                />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-2">
                      <CardTitle className="truncate pr-2 text-base font-semibold">
                        {endpoint.name}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className="max-w-full truncate border-border/70 bg-muted/40 px-2 py-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                      >
                        {getEndpointHost(endpoint.base_url)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Duplicate endpoint ${endpoint.name}`}
                        className="h-9 w-9 rounded-full text-muted-foreground hover:bg-muted/70 hover:text-foreground"
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
                        className="h-9 w-9 rounded-full text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                        onClick={() => setEditingEndpoint(endpoint)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete endpoint ${endpoint.name}`}
                        className="h-9 w-9 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeleteTarget(endpoint)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-4">
                  <div className="space-y-2">
                    <div className="rounded-lg border border-border/70 bg-background/80 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Base URL
                      </p>
                      <p className="mt-1 break-all font-mono text-xs text-foreground/90">
                        {endpoint.base_url}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-background/80 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            API Key
                          </p>
                          <p className="mt-1 break-all font-mono text-xs text-foreground/90">
                            {isApiKeyRevealed ? endpoint.api_key : maskedKey}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`${isApiKeyRevealed ? "Hide" : "Reveal"} API key for ${endpoint.name}`}
                            className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                            onClick={() => {
                              setRevealedApiKeys((prev) => ({
                                ...prev,
                                [endpoint.id]: !prev[endpoint.id],
                              }));
                            }}
                          >
                            {isApiKeyRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Copy API key for ${endpoint.name}`}
                            className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted/70 hover:text-foreground"
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
                            className="rounded-full border-border/70 bg-muted/40 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground"
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
                      Created {formatDate(endpoint.created_at)}
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

interface EndpointDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: EndpointFormValues) => Promise<void>;
  initialValues?: Endpoint;
  title: string;
  submitLabel: string;
}

function EndpointDialog({
  open,
  onOpenChange,
  onSubmit,
  initialValues,
  title,
  submitLabel,
}: EndpointDialogProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const form = useForm<EndpointFormValues>({
    resolver: zodResolver(endpointSchema),
    defaultValues: {
      name: "",
      base_url: "",
      api_key: "",
    },
  });

  useEffect(() => {
    if (open && initialValues) {
      form.reset({
        name: initialValues.name,
        base_url: initialValues.base_url,
        api_key: initialValues.api_key,
      });
    } else if (open) {
      form.reset({
        name: "",
        base_url: "",
        api_key: "",
      });
    }
  }, [open, initialValues, form]);

  const handleSubmit = async (values: EndpointFormValues) => {
    await onSubmit(values);
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setShowApiKey(false);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Configure the endpoint details.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. OpenAI Production" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="base_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://api.openai.com/v1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="api_key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showApiKey ? "text" : "password"}
                        className="pr-10"
                        placeholder="sk-..."
                        {...field}
                      />
                      <button
                        type="button"
                        aria-label={showApiKey ? "Hide API key" : "Show API key"}
                        className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                        onClick={() => setShowApiKey((prev) => !prev)}
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">{submitLabel}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
