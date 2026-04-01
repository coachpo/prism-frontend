import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SwitchController } from "@/components/SwitchController";
import { StatusBadge } from "@/components/StatusBadge";
import { useLocale } from "@/i18n/useLocale";
import { Loader2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeConnectionProbeIntervalSeconds } from "./useModelDetailDataSupport";
import { createHeaderRow } from "./useModelDetailDialogState";
import type {
  ApiFamily,
  Connection,
  ConnectionCreate,
  Endpoint,
  EndpointCreate,
  PricingTemplate,
} from "@/lib/types";
import type { HeaderRow } from "./useModelDetailDialogState";

interface ConnectionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingConnection: Connection | null;
  connectionForm: ConnectionCreate;
  setConnectionForm: (form: ConnectionCreate) => void;
  newEndpointForm: EndpointCreate;
  setNewEndpointForm: (form: EndpointCreate) => void;
  createMode: "select" | "new";
  setCreateMode: (mode: "select" | "new") => void;
  selectedEndpointId: string;
  setSelectedEndpointId: (id: string) => void;
  globalEndpoints: Endpoint[];
  headerRows: HeaderRow[];
  setHeaderRows: (rows: HeaderRow[]) => void;
  handleConnectionSubmit: (e: React.FormEvent) => Promise<void>;
  dialogTestingConnection: boolean;
  dialogTestResult: { status: string; detail: string } | null;
  handleDialogTestConnection: () => Promise<void>;
  endpointSourceDefaultName: string | null;
  modelApiFamily: ApiFamily | undefined;
  pricingTemplates: PricingTemplate[];
}

export function ConnectionDialog({
  isOpen,
  onOpenChange,
  editingConnection,
  connectionForm,
  setConnectionForm,
  newEndpointForm,
  setNewEndpointForm,
  createMode,
  setCreateMode,
  selectedEndpointId,
  setSelectedEndpointId,
  globalEndpoints,
  headerRows,
  setHeaderRows,
  handleConnectionSubmit,
  dialogTestingConnection,
  dialogTestResult,
  handleDialogTestConnection,
  endpointSourceDefaultName,
  modelApiFamily,
  pricingTemplates,
}: ConnectionDialogProps) {
  const selectedEndpoint = globalEndpoints.find(
    (endpoint) => endpoint.id === Number.parseInt(selectedEndpointId, 10)
  );
  const { messages } = useLocale();
  const copy = messages.modelDetail;
  const showOpenAiProbeEndpointVariant = modelApiFamily === "openai";

  const limiterFields: Array<{
    field: "qps_limit" | "max_in_flight_non_stream" | "max_in_flight_stream";
    id: string;
    label: string;
    value: number | null | undefined;
  }> = [
    {
      field: "qps_limit",
      id: "conn-qps-limit",
      label: copy.qpsLimit,
      value: connectionForm.qps_limit,
    },
    {
      field: "max_in_flight_non_stream",
      id: "conn-max-in-flight-non-stream",
      label: copy.maxInFlightNonStream,
      value: connectionForm.max_in_flight_non_stream,
    },
    {
      field: "max_in_flight_stream",
      id: "conn-max-in-flight-stream",
      label: copy.maxInFlightStream,
      value: connectionForm.max_in_flight_stream,
    },
  ];

  const handleLimiterChange = (
    field: "qps_limit" | "max_in_flight_non_stream" | "max_in_flight_stream",
    rawValue: string,
  ) => {
    const nextValue = rawValue === "" ? null : Number.parseInt(rawValue, 10);
    setConnectionForm({
      ...connectionForm,
      [field]: Number.isNaN(nextValue) ? null : nextValue,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(92vh,60rem)] max-h-[92vh] max-w-4xl flex-col overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="shrink-0 border-b px-6 pt-6 pb-4">
          <DialogTitle>{editingConnection ? copy.editConnection : copy.addConnection}</DialogTitle>
          <DialogDescription>{copy.connectionDialogDescription}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleConnectionSubmit} className="flex min-h-0 flex-1 flex-col">
          <input type="hidden" name="create_mode" value={createMode} />
          <input
            type="hidden"
            name="selected_endpoint_id"
            value={createMode === "select" ? selectedEndpointId : ""}
          />
          <input type="hidden" name="is_active" value={String(connectionForm.is_active ?? true)} />
          <input
            type="hidden"
            name="pricing_template_id"
            value={connectionForm.pricing_template_id === null ? "" : String(connectionForm.pricing_template_id)}
          />
          <input
            type="hidden"
            name="openai_probe_endpoint_variant"
            value={connectionForm.openai_probe_endpoint_variant ?? "responses"}
          />
          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-5 px-6 py-4 pb-32">
              <div className="space-y-3 rounded-xl border bg-muted/20 p-3.5 lg:p-4" data-testid="connection-dialog-endpoint-source-section">
                <div className="flex items-start justify-between gap-2.5">
                  <div>
                    <Label className="text-sm font-medium">{copy.endpointSource}</Label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {editingConnection ? copy.endpointSourceEditHint : copy.endpointSourceCreateHint}
                    </p>
                  </div>
                  {editingConnection && <StatusBadge label={copy.editable} intent="info" />}
                </div>

                <Tabs
                  value={createMode}
                  onValueChange={(value) => setCreateMode(value as "select" | "new")}
                  className="gap-3"
                >
                  <TabsList className="grid w-full md:max-w-sm grid-cols-2">
                    <TabsTrigger value="select">{copy.selectExisting}</TabsTrigger>
                    <TabsTrigger value="new">{copy.createNew}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="select" className="space-y-2.5">
                    <div className="space-y-2">
                      <Label htmlFor="conn-selected-endpoint">{copy.selectEndpoint}</Label>
                      <Select value={selectedEndpointId} onValueChange={setSelectedEndpointId}>
                        <SelectTrigger id="conn-selected-endpoint">
                          <SelectValue placeholder={copy.selectEndpointPlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {globalEndpoints.map((endpoint) => (
                            <SelectItem key={endpoint.id} value={String(endpoint.id)}>
                              {endpoint.name} ({endpoint.base_url})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedEndpoint ? (
                      <p className="text-[11px] text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {copy.selectedEndpoint(selectedEndpoint.name)}
                        </span>
                      </p>
                    ) : null}
                    {globalEndpoints.length === 0 ? (
                      <p className="text-xs text-muted-foreground">{copy.noProfileEndpointsFound}</p>
                    ) : null}
                  </TabsContent>

                  <TabsContent value="new" className="grid gap-3 md:grid-cols-2" data-testid="connection-dialog-create-new-grid">
                    <div className="space-y-2">
                      <Label htmlFor="endpoint-name">{copy.endpointName}</Label>
                      <Input
                        id="endpoint-name"
                        name="endpoint_name"
                        placeholder={copy.endpointNamePlaceholder}
                        value={newEndpointForm.name}
                        onChange={(e) => setNewEndpointForm({ ...newEndpointForm, name: e.target.value })}
                        required={createMode === "new"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endpoint-base-url">{copy.endpointBaseUrl}</Label>
                      <Input
                        id="endpoint-base-url"
                        name="endpoint_base_url"
                        autoComplete="url"
                        placeholder={copy.endpointBaseUrlPlaceholder}
                        value={newEndpointForm.base_url}
                        onChange={(e) => setNewEndpointForm({ ...newEndpointForm, base_url: e.target.value })}
                        required={createMode === "new"}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="endpoint-api-key">{copy.endpointApiKey}</Label>
                      <Input
                        id="endpoint-api-key"
                        name="endpoint_api_key"
                        type="password"
                        autoComplete="off"
                        placeholder={copy.endpointApiKeyPlaceholder}
                        value={newEndpointForm.api_key}
                        onChange={(e) => setNewEndpointForm({ ...newEndpointForm, api_key: e.target.value })}
                        required={createMode === "new"}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]" data-testid="connection-dialog-main-grid">
                <div className="space-y-5" data-testid="connection-dialog-left-column">
                  <div className="space-y-2">
                    <Label htmlFor="conn-name">{copy.connectionNameOptional}</Label>
                    <Input
                      id="conn-name"
                      name="name"
                      placeholder={copy.connectionDisplayNamePlaceholder}
                      value={connectionForm.name || ""}
                      onChange={(e) => setConnectionForm({ ...connectionForm, name: e.target.value })}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      {copy.useEndpointNameFallback(endpointSourceDefaultName)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{copy.routingPriorityHint}</p>
                  </div>

                  <div>
                    <SwitchController
                      label={copy.active}
                      description={copy.includeInLoadBalancing}
                      checked={connectionForm.is_active ?? true}
                      onCheckedChange={(checked) => setConnectionForm({ ...connectionForm, is_active: checked })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="conn-pricing-template">{copy.pricingTemplate}</Label>
                    <Select
                      value={connectionForm.pricing_template_id ? String(connectionForm.pricing_template_id) : "unpriced"}
                      onValueChange={(value) => {
                        setConnectionForm({
                          ...connectionForm,
                          pricing_template_id: value === "unpriced" ? null : parseInt(value, 10),
                        });
                      }}
                    >
                      <SelectTrigger id="conn-pricing-template">
                        <SelectValue placeholder={copy.pricingTemplatePlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unpriced">{copy.unpricedNoCostTracking}</SelectItem>
                        {pricingTemplates.map((template) => (
                          <SelectItem key={template.id} value={String(template.id)}>
                            {template.name} v{template.version}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">{copy.pricingTemplateHint}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="conn-monitoring-probe-interval-seconds">
                      {copy.monitoringProbeIntervalSeconds}
                    </Label>
                    <Input
                      id="conn-monitoring-probe-interval-seconds"
                      name="monitoring_probe_interval_seconds"
                      type="number"
                      min="30"
                      max="3600"
                      step="1"
                      value={connectionForm.monitoring_probe_interval_seconds ?? 300}
                      onChange={(e) => {
                        const rawValue = e.target.value;
                        const parsedValue = Number.parseInt(rawValue, 10);
                        setConnectionForm({
                          ...connectionForm,
                          monitoring_probe_interval_seconds:
                            rawValue === "" || Number.isNaN(parsedValue)
                              ? 300
                              : normalizeConnectionProbeIntervalSeconds(parsedValue),
                        });
                      }}
                    />
                    <p className="text-[11px] text-muted-foreground">{copy.monitoringProbeIntervalHint}</p>
                  </div>

                  {showOpenAiProbeEndpointVariant ? (
                    <div className="space-y-2">
                      <Label htmlFor="conn-openai-probe-endpoint-variant">{copy.openaiProbeEndpointVariant}</Label>
                      <Select
                        value={connectionForm.openai_probe_endpoint_variant ?? "responses"}
                        onValueChange={(value) => {
                          setConnectionForm({
                            ...connectionForm,
                            openai_probe_endpoint_variant:
                              value === "chat_completions" ? "chat_completions" : "responses",
                          });
                        }}
                      >
                        <SelectTrigger
                          id="conn-openai-probe-endpoint-variant"
                          aria-label={copy.openaiProbeEndpointVariant}
                        >
                          <SelectValue placeholder={copy.openaiProbeEndpointVariant} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="responses">{copy.openaiProbeResponses}</SelectItem>
                          <SelectItem value="chat_completions">{copy.openaiProbeChatCompletions}</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-muted-foreground">
                        {copy.openaiProbeEndpointVariantHint}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-4" data-testid="connection-dialog-right-column">
                  <div className="rounded-xl border bg-muted/15 p-3.5" data-testid="connection-dialog-limiter-card">
                    <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                      {limiterFields.map((field) => (
                        <div key={field.field} className="grid content-start gap-1.5">
                          <div className="min-h-14 space-y-1">
                            <Label htmlFor={field.id}>{field.label}</Label>
                            <p className="text-[11px] text-muted-foreground">{copy.leaveBlankForUnlimited}</p>
                          </div>
                          <Input
                            id={field.id}
                            name={field.field}
                            type="number"
                            min="0"
                            value={field.value ?? ""}
                            onChange={(e) => handleLimiterChange(field.field, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 rounded-xl border bg-muted/10 p-3.5" data-testid="connection-dialog-custom-headers-card">
                    <div className="flex items-center justify-between gap-3">
                      <Label>{copy.customHeaders}</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setHeaderRows([...headerRows, createHeaderRow()])}
                      >
                        <Plus className="mr-1.5 h-3 w-3" />
                        {copy.addHeader}
                      </Button>
                    </div>
                    {headerRows.length === 0 ? (
                      <p className="text-xs italic text-muted-foreground">{copy.noCustomHeadersConfigured}</p>
                    ) : null}
                    <div className="space-y-2">
                      {headerRows.map((row, index) => (
                        <div key={row.id} className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center">
                          <Input
                            id={`connection-header-key-${index}`}
                            name={`custom_headers.${index}.key`}
                            aria-label={copy.headerKey}
                            placeholder={copy.headerKey}
                            value={row.key}
                            onChange={(e) => {
                              const newRows = [...headerRows];
                              newRows[index].key = e.target.value;
                              setHeaderRows(newRows);
                            }}
                            className="flex-1"
                          />
                          <Input
                            id={`connection-header-value-${index}`}
                            name={`custom_headers.${index}.value`}
                            aria-label={copy.headerValue}
                            placeholder={copy.headerValue}
                            value={row.value}
                            onChange={(e) => {
                              const newRows = [...headerRows];
                              newRows[index].value = e.target.value;
                              setHeaderRows(newRows);
                            }}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newRows = [...headerRows];
                              newRows.splice(index, 1);
                              setHeaderRows(newRows);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="shrink-0 border-t px-6 py-4">
            {dialogTestResult ? (
              <div
                className={cn(
                  "mb-3 rounded-md p-3 text-sm",
                  dialogTestResult.status === "healthy"
                    ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"
                    : "bg-red-50 text-red-900 dark:bg-red-950/30 dark:text-red-200",
                )}
              >
                <p className="font-medium">
                  {dialogTestResult.status === "healthy" ? copy.connectionHealthy : copy.connectionUnhealthy}
                </p>
                <p className="mt-1 text-xs opacity-90">{dialogTestResult.detail}</p>
              </div>
            ) : null}

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleDialogTestConnection}
                disabled={dialogTestingConnection}
              >
                {dialogTestingConnection ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {copy.testingConnection}
                  </>
                ) : (
                  copy.testConnection
                )}
              </Button>
              <div className="flex-1" />
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {copy.cancel}
              </Button>
              <Button type="submit">{copy.saveConnection}</Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
