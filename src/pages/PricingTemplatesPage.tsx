import { useEffect, useState } from "react";
import { Coins, Plus, Pencil, Trash2 } from "lucide-react";
import { useProfileContext } from "@/context/ProfileContext";
import { api, ApiError } from "@/lib/api";
import { isValidCurrencyCode } from "@/lib/costing";
import type {
  PricingTemplate,
  PricingTemplateConnectionUsageItem,
  PricingTemplateCreate,
  PricingTemplateUpdate,
} from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

type PricingTemplateFormState = {
  name: string;
  description: string;
  pricing_currency_code: string;
  input_price: string;
  output_price: string;
  cached_input_price: string;
  cache_creation_price: string;
  reasoning_price: string;
  missing_special_token_price_policy: "MAP_TO_OUTPUT" | "ZERO_COST";
};

const DEFAULT_PRICING_TEMPLATE_FORM: PricingTemplateFormState = {
  name: "",
  description: "",
  pricing_currency_code: "USD",
  input_price: "",
  output_price: "",
  cached_input_price: "",
  cache_creation_price: "",
  reasoning_price: "",
  missing_special_token_price_policy: "MAP_TO_OUTPUT",
};

const normalizeOptionalTemplatePrice = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const isNonNegativeDecimalString = (value: string): boolean => {
  const trimmed = value.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return false;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0;
};

const parsePricingTemplateUsageRows = (
  detail: unknown
): PricingTemplateConnectionUsageItem[] => {
  if (!detail || typeof detail !== "object") {
    return [];
  }
  const payload = detail as { connections?: unknown; detail?: unknown };
  const maybeConnections =
    payload.connections ??
    (
      payload.detail &&
      typeof payload.detail === "object" &&
      "connections" in payload.detail
        ? (payload.detail as { connections?: unknown }).connections
        : undefined
    );
  if (!Array.isArray(maybeConnections)) {
    return [];
  }

  const rows: PricingTemplateConnectionUsageItem[] = [];
  for (const connection of maybeConnections) {
    if (!connection || typeof connection !== "object") {
      continue;
    }

    const entry = connection as Record<string, unknown>;
    const connectionId =
      typeof entry.connection_id === "number" ? entry.connection_id : null;
    const modelConfigId =
      typeof entry.model_config_id === "number" ? entry.model_config_id : null;
    const endpointId =
      typeof entry.endpoint_id === "number" ? entry.endpoint_id : null;
    if (connectionId === null || modelConfigId === null || endpointId === null) {
      continue;
    }

    const modelId =
      typeof entry.model_id === "string" && entry.model_id.trim().length > 0
        ? entry.model_id
        : "Unknown model";
    const endpointName =
      typeof entry.endpoint_name === "string" && entry.endpoint_name.trim().length > 0
        ? entry.endpoint_name
        : `Endpoint #${endpointId}`;

    rows.push({
      connection_id: connectionId,
      connection_name:
        typeof entry.connection_name === "string" ? entry.connection_name : null,
      model_config_id: modelConfigId,
      model_id: modelId,
      endpoint_id: endpointId,
      endpoint_name: endpointName,
    });
  }

  return rows;
};

export function PricingTemplatesPage() {
  const { selectedProfile, revision } = useProfileContext();
  const selectedProfileLabel = selectedProfile
    ? `${selectedProfile.name} (#${selectedProfile.id})`
    : "the selected profile";

  const [pricingTemplates, setPricingTemplates] = useState<PricingTemplate[]>([]);
  const [pricingTemplatesLoading, setPricingTemplatesLoading] = useState(false);
  const [pricingTemplateDialogOpen, setPricingTemplateDialogOpen] = useState(false);
  const [editingPricingTemplate, setEditingPricingTemplate] = useState<PricingTemplate | null>(null);
  const [pricingTemplateForm, setPricingTemplateForm] = useState<PricingTemplateFormState>(DEFAULT_PRICING_TEMPLATE_FORM);
  const [pricingTemplateSaving, setPricingTemplateSaving] = useState(false);
  const [pricingTemplateUsageDialogOpen, setPricingTemplateUsageDialogOpen] = useState(false);
  const [pricingTemplateUsageRows, setPricingTemplateUsageRows] = useState<PricingTemplateConnectionUsageItem[]>([]);
  const [pricingTemplateUsageLoading, setPricingTemplateUsageLoading] = useState(false);
  const [pricingTemplateUsageTemplate, setPricingTemplateUsageTemplate] = useState<PricingTemplate | null>(null);
  const [deletePricingTemplateConfirm, setDeletePricingTemplateConfirm] = useState<PricingTemplate | null>(null);
  const [deletePricingTemplateConflict, setDeletePricingTemplateConflict] = useState<PricingTemplateConnectionUsageItem[] | null>(null);
  const [pricingTemplateDeleting, setPricingTemplateDeleting] = useState(false);

  useEffect(() => {
    void fetchPricingTemplates();
  }, [revision]);

  const fetchPricingTemplates = async () => {
    setPricingTemplatesLoading(true);
    try {
      const data = await api.pricingTemplates.list();
      setPricingTemplates(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load pricing templates");
    } finally {
      setPricingTemplatesLoading(false);
    }
  };

  const handleEditPricingTemplate = (template: PricingTemplate) => {
    setEditingPricingTemplate(template);
    setPricingTemplateForm({
      name: template.name,
      description: template.description ?? "",
      pricing_currency_code: template.pricing_currency_code,
      input_price: template.input_price,
      output_price: template.output_price,
      cached_input_price: template.cached_input_price ?? "",
      cache_creation_price: template.cache_creation_price ?? "",
      reasoning_price: template.reasoning_price ?? "",
      missing_special_token_price_policy: template.missing_special_token_price_policy,
    });
    setPricingTemplateDialogOpen(true);
  };

  const handleSavePricingTemplate = async () => {
    if (!pricingTemplateForm.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!isValidCurrencyCode(pricingTemplateForm.pricing_currency_code)) {
      toast.error("Pricing currency must be a valid 3-letter code (for example, USD)");
      return;
    }
    if (!isNonNegativeDecimalString(pricingTemplateForm.input_price)) {
      toast.error("Input price must be a non-negative number");
      return;
    }
    if (!isNonNegativeDecimalString(pricingTemplateForm.output_price)) {
      toast.error("Output price must be a non-negative number");
      return;
    }

    const cachedInputPrice = normalizeOptionalTemplatePrice(pricingTemplateForm.cached_input_price);
    if (cachedInputPrice && !isNonNegativeDecimalString(cachedInputPrice)) {
      toast.error("Cached input price must be a non-negative number");
      return;
    }

    const cacheCreationPrice = normalizeOptionalTemplatePrice(pricingTemplateForm.cache_creation_price);
    if (cacheCreationPrice && !isNonNegativeDecimalString(cacheCreationPrice)) {
      toast.error("Cache creation price must be a non-negative number");
      return;
    }

    const reasoningPrice = normalizeOptionalTemplatePrice(pricingTemplateForm.reasoning_price);
    if (reasoningPrice && !isNonNegativeDecimalString(reasoningPrice)) {
      toast.error("Reasoning price must be a non-negative number");
      return;
    }

    setPricingTemplateSaving(true);
    try {
      if (editingPricingTemplate) {
        const payload: PricingTemplateUpdate = {
          name: pricingTemplateForm.name.trim(),
          description: pricingTemplateForm.description.trim() || null,
          pricing_currency_code: pricingTemplateForm.pricing_currency_code.trim().toUpperCase(),
          input_price: pricingTemplateForm.input_price.trim(),
          output_price: pricingTemplateForm.output_price.trim(),
          cached_input_price: cachedInputPrice,
          cache_creation_price: cacheCreationPrice,
          reasoning_price: reasoningPrice,
          missing_special_token_price_policy: pricingTemplateForm.missing_special_token_price_policy,
        };
        await api.pricingTemplates.update(editingPricingTemplate.id, payload);
        toast.success("Pricing template updated");
      } else {
        const payload: PricingTemplateCreate = {
          name: pricingTemplateForm.name.trim(),
          description: pricingTemplateForm.description.trim() || null,
          pricing_currency_code: pricingTemplateForm.pricing_currency_code.trim().toUpperCase(),
          input_price: pricingTemplateForm.input_price.trim(),
          output_price: pricingTemplateForm.output_price.trim(),
          cached_input_price: cachedInputPrice,
          cache_creation_price: cacheCreationPrice,
          reasoning_price: reasoningPrice,
          missing_special_token_price_policy: pricingTemplateForm.missing_special_token_price_policy,
        };
        await api.pricingTemplates.create(payload);
        toast.success("Pricing template created");
      }
      setPricingTemplateDialogOpen(false);
      void fetchPricingTemplates();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save pricing template");
    } finally {
      setPricingTemplateSaving(false);
    }
  };

  const handleViewPricingTemplateUsage = async (template: PricingTemplate) => {
    setPricingTemplateUsageTemplate(template);
    setPricingTemplateUsageDialogOpen(true);
    setPricingTemplateUsageLoading(true);
    try {
      const data = await api.pricingTemplates.connections(template.id);
      setPricingTemplateUsageRows(data.items);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load template usage");
      setPricingTemplateUsageRows([]);
    } finally {
      setPricingTemplateUsageLoading(false);
    }
  };

  const handleDeletePricingTemplateClick = async (template: PricingTemplate) => {
    setDeletePricingTemplateConfirm(template);
    setDeletePricingTemplateConflict(null);
    setPricingTemplateUsageLoading(true);
    try {
      const data = await api.pricingTemplates.connections(template.id);
      setPricingTemplateUsageRows(data.items);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load template usage");
      setPricingTemplateUsageRows([]);
    } finally {
      setPricingTemplateUsageLoading(false);
    }
  };

  const handleDeletePricingTemplate = async () => {
    if (!deletePricingTemplateConfirm) return;
    setPricingTemplateDeleting(true);
    try {
      await api.pricingTemplates.delete(deletePricingTemplateConfirm.id);
      toast.success("Pricing template deleted");
      setDeletePricingTemplateConfirm(null);
      void fetchPricingTemplates();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const conflictRows = parsePricingTemplateUsageRows(error.detail);
        setDeletePricingTemplateConflict(conflictRows);
        toast.error("Cannot delete template because it is in use");
      } else {
        toast.error(error instanceof Error ? error.message : "Failed to delete pricing template");
      }
    } finally {
      setPricingTemplateDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pricing Templates"
        description="Manage reusable pricing templates for models and endpoints"
      />

      <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Badge
            variant="outline"
            className="w-fit border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300"
          >
            Profile-scoped settings
          </Badge>
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Changes here affect {selectedProfileLabel} and its runtime traffic.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Coins className="h-4 w-4" />
                Pricing Templates
              </CardTitle>
              <CardDescription className="text-xs">
                Manage reusable pricing templates for models and endpoints.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setEditingPricingTemplate(null);
                  setPricingTemplateForm(DEFAULT_PRICING_TEMPLATE_FORM);
                  setPricingTemplateDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-3.5 w-3.5" />
                Add Template
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {pricingTemplatesLoading ? (
            <div className="space-y-2">
              <div className="h-12 animate-pulse rounded-md bg-muted/50" />
              <div className="h-12 animate-pulse rounded-md bg-muted/50" />
            </div>
          ) : pricingTemplates.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">No pricing templates configured.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Input</TableHead>
                    <TableHead>Output</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricingTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{template.name}</span>
                          {template.description && (
                            <span className="text-xs text-muted-foreground">
                              {template.description}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{template.pricing_currency_code}</TableCell>
                      <TableCell>{template.input_price}</TableCell>
                      <TableCell>{template.output_price}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={() => void handleViewPricingTemplateUsage(template)}
                          >
                            View Usage
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditPricingTemplate(template)}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => void handleDeletePricingTemplateClick(template)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={pricingTemplateDialogOpen} onOpenChange={setPricingTemplateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPricingTemplate ? "Edit Pricing Template" : "Add Pricing Template"}
            </DialogTitle>
            <DialogDescription>
              Configure pricing rates per 1M tokens.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Name</Label>
                <Input
                  id="template-name"
                  value={pricingTemplateForm.name}
                  onChange={(e) =>
                    setPricingTemplateForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., GPT-4o Standard"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-currency">Currency Code</Label>
                <Input
                  id="template-currency"
                  value={pricingTemplateForm.pricing_currency_code}
                  onChange={(e) =>
                    setPricingTemplateForm((prev) => ({
                      ...prev,
                      pricing_currency_code: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="USD"
                  maxLength={3}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-description">Description (Optional)</Label>
              <Input
                id="template-description"
                value={pricingTemplateForm.description}
                onChange={(e) =>
                  setPricingTemplateForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Optional details about this template"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-md border bg-muted/20 p-4">
              <div className="space-y-2">
                <Label htmlFor="template-input-price">Input Price (per 1M tokens)</Label>
                <Input
                  id="template-input-price"
                  value={pricingTemplateForm.input_price}
                  onChange={(e) =>
                    setPricingTemplateForm((prev) => ({ ...prev, input_price: e.target.value }))
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-output-price">Output Price (per 1M tokens)</Label>
                <Input
                  id="template-output-price"
                  value={pricingTemplateForm.output_price}
                  onChange={(e) =>
                    setPricingTemplateForm((prev) => ({ ...prev, output_price: e.target.value }))
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-md border bg-muted/20 p-4">
              <div className="space-y-2">
                <Label htmlFor="template-cached-input-price">
                  Cached Input Price (Optional)
                </Label>
                <Input
                  id="template-cached-input-price"
                  value={pricingTemplateForm.cached_input_price}
                  onChange={(e) =>
                    setPricingTemplateForm((prev) => ({
                      ...prev,
                      cached_input_price: e.target.value,
                    }))
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-cache-creation-price">
                  Cache Creation Price (Optional)
                </Label>
                <Input
                  id="template-cache-creation-price"
                  value={pricingTemplateForm.cache_creation_price}
                  onChange={(e) =>
                    setPricingTemplateForm((prev) => ({
                      ...prev,
                      cache_creation_price: e.target.value,
                    }))
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-reasoning-price">
                  Reasoning Price (Optional)
                </Label>
                <Input
                  id="template-reasoning-price"
                  value={pricingTemplateForm.reasoning_price}
                  onChange={(e) =>
                    setPricingTemplateForm((prev) => ({
                      ...prev,
                      reasoning_price: e.target.value,
                    }))
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Missing Special Token Policy</Label>
              <Select
                value={pricingTemplateForm.missing_special_token_price_policy}
                onValueChange={(value: "MAP_TO_OUTPUT" | "ZERO_COST") =>
                  setPricingTemplateForm((prev) => ({
                    ...prev,
                    missing_special_token_price_policy: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAP_TO_OUTPUT">Map to Output Price</SelectItem>
                  <SelectItem value="ZERO_COST">Zero Cost</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How to price special tokens (like reasoning) if their specific price is not set.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPricingTemplateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSavePricingTemplate()} disabled={pricingTemplateSaving}>
              {pricingTemplateSaving ? "Saving..." : "Save Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pricingTemplateUsageDialogOpen} onOpenChange={setPricingTemplateUsageDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Template Usage</DialogTitle>
            <DialogDescription>
              Connections currently using the &quot;{pricingTemplateUsageTemplate?.name}&quot; template.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {pricingTemplateUsageLoading ? (
              <div className="space-y-2">
                <div className="h-10 animate-pulse rounded-md bg-muted/50" />
                <div className="h-10 animate-pulse rounded-md bg-muted/50" />
              </div>
            ) : pricingTemplateUsageRows.length === 0 ? (
              <div className="rounded-md border border-dashed p-8 text-center">
                <p className="text-sm text-muted-foreground">This template is not currently used by any connections.</p>
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Model</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Connection</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pricingTemplateUsageRows.map((row) => (
                      <TableRow key={row.connection_id}>
                        <TableCell className="font-medium">{row.model_id}</TableCell>
                        <TableCell>{row.endpoint_name}</TableCell>
                        <TableCell>
                          {row.connection_name || <span className="text-muted-foreground italic">Unnamed</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setPricingTemplateUsageDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deletePricingTemplateConfirm !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeletePricingTemplateConfirm(null);
            setDeletePricingTemplateConflict(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Pricing Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the template &quot;
              {deletePricingTemplateConfirm?.name}&quot;?
            </DialogDescription>
          </DialogHeader>

          {pricingTemplateUsageLoading ? (
            <div className="py-4">
              <div className="h-10 animate-pulse rounded-md bg-muted/50" />
            </div>
          ) : deletePricingTemplateConflict ? (
            <div className="space-y-4 py-4">
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Cannot delete this template because it is currently used by {deletePricingTemplateConflict.length} connection(s).
              </div>
              <div className="max-h-[200px] overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Model</TableHead>
                      <TableHead>Endpoint</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deletePricingTemplateConflict.map((row) => (
                      <TableRow key={row.connection_id}>
                        <TableCell className="font-medium">{row.model_id}</TableCell>
                        <TableCell>{row.endpoint_name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : pricingTemplateUsageRows.length > 0 ? (
            <div className="space-y-4 py-4">
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Cannot delete this template because it is currently used by {pricingTemplateUsageRows.length} connection(s).
              </div>
            </div>
          ) : (
            <div className="py-4">
              <p className="text-sm">This action cannot be undone.</p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeletePricingTemplateConfirm(null);
                setDeletePricingTemplateConflict(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDeletePricingTemplate()}
              disabled={
                pricingTemplateDeleting ||
                pricingTemplateUsageLoading ||
                (deletePricingTemplateConflict !== null && deletePricingTemplateConflict.length > 0) ||
                pricingTemplateUsageRows.length > 0
              }
            >
              {pricingTemplateDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
