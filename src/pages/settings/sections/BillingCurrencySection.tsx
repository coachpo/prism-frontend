import type { ReactNode } from "react";
import { Check, Coins, Pencil, Plus, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Connection, CostingSettingsUpdate, EndpointFxMapping, ModelConfigListItem } from "@/lib/types";
import { formatFxRateDisplay, getMappingKey } from "../settingsPageHelpers";

interface BillingCurrencySectionProps {
  billingDirty: boolean;
  renderSectionSaveState: (section: "billing" | "timezone", isDirty: boolean) => ReactNode;
  handleSaveCostingSettings: (section: "billing" | "timezone") => Promise<void>;
  costingUnavailable: boolean;
  costingLoading: boolean;
  costingSaving: boolean;
  costingForm: CostingSettingsUpdate;
  setCostingForm: React.Dispatch<React.SetStateAction<CostingSettingsUpdate>>;
  normalizedCurrentCosting: CostingSettingsUpdate;
  nativeModels: ModelConfigListItem[];
  modelLabelMap: Map<string, string>;
  mappingModelId: string;
  setMappingModelId: (id: string) => void;
  loadMappingConnections: (modelConfigId: number) => Promise<void>;
  mappingEndpointId: string;
  setMappingEndpointId: (id: string) => void;
  mappingConnections: Connection[];
  mappingLoading: boolean;
  mappingEndpointOptions: { endpointId: number; label: string }[];
  mappingFxRate: string;
  setMappingFxRate: (rate: string) => void;
  addMappingFxError: string | null;
  handleAddFxMapping: () => void;
  editingMappingKey: string | null;
  editingMappingFxRate: string;
  setEditingMappingFxRate: (rate: string) => void;
  editMappingFxError: string | null;
  handleSaveEditFxMapping: () => void;
  handleCancelEditFxMapping: () => void;
  handleStartEditFxMapping: (mapping: EndpointFxMapping) => void;
  handleDeleteFxMapping: (mapping: EndpointFxMapping) => void;
}

export function BillingCurrencySection({
  billingDirty,
  renderSectionSaveState,
  handleSaveCostingSettings,
  costingUnavailable,
  costingLoading,
  costingSaving,
  costingForm,
  setCostingForm,
  normalizedCurrentCosting,
  nativeModels,
  modelLabelMap,
  mappingModelId,
  setMappingModelId,
  loadMappingConnections,
  mappingEndpointId,
  setMappingEndpointId,
  mappingEndpointOptions,
  mappingLoading,
  mappingFxRate,
  setMappingFxRate,
  addMappingFxError,
  handleAddFxMapping,
  editingMappingKey,
  editingMappingFxRate,
  setEditingMappingFxRate,
  editMappingFxError,
  handleSaveEditFxMapping,
  handleCancelEditFxMapping,
  handleStartEditFxMapping,
  handleDeleteFxMapping,
}: BillingCurrencySectionProps) {
  return (
    <section id="billing-currency" tabIndex={-1} className="scroll-mt-24">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Coins className="h-4 w-4" />
                Billing & Currency
              </CardTitle>
              <CardDescription className="text-xs">
                Configure reporting currency and endpoint FX overrides used by spending dashboards.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {renderSectionSaveState("billing", billingDirty)}
              <Button
                type="button"
                size="sm"
                onClick={() => void handleSaveCostingSettings("billing")}
                disabled={
                  costingUnavailable ||
                  costingLoading ||
                  costingSaving ||
                  !billingDirty
                }
              >
                {costingSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {costingUnavailable ? (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
              Costing settings API is currently unavailable. Upgrade the backend to enable this
              feature.
            </div>
          ) : costingLoading ? (
            <div className="space-y-2">
              <div className="h-9 animate-pulse rounded bg-muted" />
              <div className="h-9 animate-pulse rounded bg-muted" />
              <div className="h-24 animate-pulse rounded bg-muted" />
            </div>
          ) : (
            <>
              <div className="rounded-lg border p-4">
                <div className="space-y-3">
                  <Label htmlFor="report-currency-code">Reporting currency</Label>
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="report-currency-code" className="text-xs text-muted-foreground">
                        Code
                      </Label>
                      <Input
                        id="report-currency-code"
                        maxLength={3}
                        value={costingForm.report_currency_code}
                        onChange={(event) =>
                          setCostingForm((prev) => ({
                            ...prev,
                            report_currency_code: event.target.value.toUpperCase(),
                          }))
                        }
                        placeholder="USD"
                        className="w-28"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="report-currency-symbol" className="text-xs text-muted-foreground">
                        Symbol
                      </Label>
                      <Input
                        id="report-currency-symbol"
                        maxLength={5}
                        value={costingForm.report_currency_symbol}
                        onChange={(event) =>
                          setCostingForm((prev) => ({
                            ...prev,
                            report_currency_symbol: event.target.value,
                          }))
                        }
                        placeholder="$"
                        className="w-24"
                      />
                    </div>
                    <p className="pb-2 text-sm font-medium">
                      Reporting currency: {normalizedCurrentCosting.report_currency_code || "---"} ({" "}
                      {normalizedCurrentCosting.report_currency_symbol || "-"})
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Used for spending reports and dashboards.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-medium">FX mappings</h4>
                  <Badge variant="outline">Default FX = 1.0</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Mapping overrides default.
                </p>

                {normalizedCurrentCosting.endpoint_fx_mappings.length === 0 ? (
                  <div className="mt-3 rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">
                    No endpoint FX mappings configured.
                  </div>
                ) : (
                  <div className="mt-3 rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Model</TableHead>
                          <TableHead>Endpoint</TableHead>
                          <TableHead>FX rate</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {normalizedCurrentCosting.endpoint_fx_mappings.map((mapping) => {
                          const mappingKey = getMappingKey(mapping);
                          const isEditing = editingMappingKey === mappingKey;
                          return (
                            <TableRow key={mappingKey}>
                              <TableCell className="font-medium">
                                {modelLabelMap.get(mapping.model_id) || mapping.model_id}
                              </TableCell>
                              <TableCell>#{mapping.endpoint_id}</TableCell>
                              <TableCell>
                                {isEditing ? (
                                  <div className="space-y-1">
                                    <Input
                                      value={editingMappingFxRate}
                                      onChange={(event) =>
                                        setEditingMappingFxRate(event.target.value)
                                      }
                                      className={cn(
                                        "h-8 w-32",
                                        editMappingFxError && "border-destructive"
                                      )}
                                      inputMode="decimal"
                                      aria-invalid={Boolean(editMappingFxError)}
                                    />
                                    {editMappingFxError && (
                                      <p className="text-xs text-destructive">
                                        {editMappingFxError}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  formatFxRateDisplay(mapping.fx_rate)
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">Override</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  {isEditing ? (
                                    <>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={handleSaveEditFxMapping}
                                        disabled={Boolean(editMappingFxError)}
                                        aria-label="Save FX mapping"
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={handleCancelEditFxMapping}
                                        aria-label="Cancel FX mapping edit"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => handleStartEditFxMapping(mapping)}
                                        aria-label="Edit FX mapping"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                        onClick={() => handleDeleteFxMapping(mapping)}
                                        aria-label="Delete FX mapping"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px_auto]">
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Select
                      value={mappingModelId}
                      onValueChange={(value) => {
                        setMappingModelId(value);
                        const selectedModel = nativeModels.find(
                          (model) => model.model_id === value
                        );
                        if (selectedModel) {
                          void loadMappingConnections(selectedModel.id);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {nativeModels.map((model) => (
                          <SelectItem key={model.id} value={model.model_id}>
                            {model.display_name || model.model_id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Endpoint</Label>
                    <Select
                      value={mappingEndpointId}
                      onValueChange={setMappingEndpointId}
                      disabled={!mappingModelId || mappingLoading}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            mappingLoading ? "Loading endpoints..." : "Select endpoint"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {mappingEndpointOptions.map((endpoint) => (
                          <SelectItem
                            key={endpoint.endpointId}
                            value={String(endpoint.endpointId)}
                          >
                            #{endpoint.endpointId} {endpoint.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mapping-fx-rate">FX rate</Label>
                    <Input
                      id="mapping-fx-rate"
                      value={mappingFxRate}
                      onChange={(event) => setMappingFxRate(event.target.value)}
                      placeholder="1.000000"
                      inputMode="decimal"
                      aria-invalid={Boolean(addMappingFxError)}
                      className={cn(addMappingFxError && "border-destructive")}
                    />
                    {addMappingFxError && (
                      <p className="text-xs text-destructive">{addMappingFxError}</p>
                    )}
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleAddFxMapping}
                      disabled={
                        !mappingModelId ||
                        !mappingEndpointId ||
                        !mappingFxRate.trim() ||
                        Boolean(addMappingFxError)
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Mapping
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
