import { useEffect, useState } from "react";
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
import { Plus, Pencil, Trash2, Plug, AlertTriangle } from "lucide-react";
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

const endpointSchema = z.object({
  name: z.string().min(1, "Name is required"),
  base_url: z.string().url("Must be a valid URL"),
  api_key: z.string().min(1, "API Key is required"),
});

type EndpointFormValues = z.infer<typeof endpointSchema>;

export function EndpointsPage() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [endpointModels, setEndpointModels] = useState<Record<number, ModelConfigListItem[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<Endpoint | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { revision } = useProfileContext();

  const fetchEndpoints = async () => {
    try {
      const data = await api.endpoints.list();
      setEndpoints(data);
      
      // Fetch models for each endpoint
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
    try {
      await api.endpoints.delete(id);
      toast.success("Endpoint deleted");
      setDeleteError(null);
      fetchEndpoints();
    } catch (error) {
      if (error instanceof Error && (error.message.includes("dependency") || error.message.includes("409"))) {
        setDeleteError(error.message);
      } else {
        toast.error(error instanceof Error ? error.message : "Failed to delete endpoint");
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Endpoints"
        description="Manage global API credentials for LLM providers."
      >
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Endpoint
        </Button>
      </PageHeader>

      {deleteError && (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
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

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[200px] rounded-xl" />
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {endpoints.map((endpoint) => {
            const models = endpointModels[endpoint.id] || [];
            const maskedKey = endpoint.api_key.length > 8
              ? `${endpoint.api_key.slice(0, 4)}••••••${endpoint.api_key.slice(-4)}`
              : "••••••";

            return (
              <Card key={endpoint.id} className="flex flex-col">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium truncate pr-2">
                    {endpoint.name}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground"
                      onClick={() => setEditingEndpoint(endpoint)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this endpoint?")) {
                          handleDelete(endpoint.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-mono break-all">
                      {endpoint.base_url}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Key: <span className="font-mono">{maskedKey}</span>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Used by {models.length} model{models.length !== 1 ? "s" : ""}
                    </p>
                    {models.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {models.slice(0, 5).map((m) => (
                          <Badge key={m.id} variant="secondary" className="text-[10px] font-normal">
                            {m.display_name || m.model_id}
                          </Badge>
                        ))}
                        {models.length > 5 && (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            +{models.length - 5} more
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Not attached to any models
                      </p>
                    )}
                  </div>

                  <div className="pt-2 mt-auto">
                    <p className="text-[10px] text-muted-foreground">
                      Created {new Date(endpoint.created_at).toLocaleDateString()}
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                    <Input type="password" placeholder="sk-..." {...field} />
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
