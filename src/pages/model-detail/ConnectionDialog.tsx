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
import { SwitchController } from "@/components/SwitchController";
import { StatusBadge } from "@/components/StatusBadge";
import { useLocale } from "@/i18n/useLocale";
import { Loader2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Connection, ConnectionCreate, Endpoint, EndpointCreate, PricingTemplate } from "@/lib/types";

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
  headerRows: { key: string; value: string }[];
  setHeaderRows: (rows: { key: string; value: string }[]) => void;
  handleConnectionSubmit: (e: React.FormEvent) => Promise<void>;
  dialogTestingConnection: boolean;
  dialogTestResult: { status: string; detail: string } | null;
  handleDialogTestConnection: () => Promise<void>;
  endpointSourceDefaultName: string | null;
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
  pricingTemplates,
}: ConnectionDialogProps) {
  const selectedEndpoint = globalEndpoints.find(
    (endpoint) => endpoint.id === Number.parseInt(selectedEndpointId, 10)
  );
  const { messages } = useLocale();
  const copy = messages.modelDetail;

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
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingConnection ? copy.editConnection : copy.addConnection}</DialogTitle>
          <DialogDescription>{copy.connectionDialogDescription}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleConnectionSubmit} className="space-y-5">
          <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Label className="text-sm font-medium">{copy.endpointSource}</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  {editingConnection
                    ? copy.endpointSourceEditHint
                    : copy.endpointSourceCreateHint}
                </p>
              </div>
              {editingConnection && (
                <StatusBadge label={copy.editable} intent="info" />
              )}
            </div>

            <Tabs
              value={createMode}
              onValueChange={(value) => setCreateMode(value as "select" | "new")}
              className="gap-3"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="select">{copy.selectExisting}</TabsTrigger>
                <TabsTrigger value="new">{copy.createNew}</TabsTrigger>
              </TabsList>

              <TabsContent value="select" className="space-y-2">
                <Label>{copy.selectEndpoint}</Label>
                <Select value={selectedEndpointId} onValueChange={setSelectedEndpointId}>
                  <SelectTrigger>
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
                {selectedEndpoint && (
                  <p className="text-[11px] text-muted-foreground">
                    <span className="font-medium text-foreground">{copy.selectedEndpoint(selectedEndpoint.name)}</span>
                  </p>
                )}
                {globalEndpoints.length === 0 && (
                  <p className="text-xs text-muted-foreground">{copy.noProfileEndpointsFound}</p>
                )}
              </TabsContent>

              <TabsContent value="new" className="space-y-3">
                <div className="space-y-2">
                  <Label>{copy.endpointName}</Label>
                  <Input
                    placeholder={copy.endpointNamePlaceholder}
                    value={newEndpointForm.name}
                    onChange={(e) => setNewEndpointForm({ ...newEndpointForm, name: e.target.value })}
                    required={createMode === "new"}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{copy.endpointBaseUrl}</Label>
                  <Input
                    placeholder={copy.endpointBaseUrlPlaceholder}
                    value={newEndpointForm.base_url}
                    onChange={(e) => setNewEndpointForm({ ...newEndpointForm, base_url: e.target.value })}
                    required={createMode === "new"}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{copy.endpointApiKey}</Label>
                  <Input
                    type="password"
                    placeholder={copy.endpointApiKeyPlaceholder}
                    value={newEndpointForm.api_key}
                    onChange={(e) => setNewEndpointForm({ ...newEndpointForm, api_key: e.target.value })}
                    required={createMode === "new"}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="conn-name">{copy.connectionNameOptional}</Label>
              <Input
                id="conn-name"
                placeholder={copy.connectionDisplayNamePlaceholder}
                value={connectionForm.name || ""}
                onChange={(e) => setConnectionForm({ ...connectionForm, name: e.target.value })}
              />
              <p className="text-[11px] text-muted-foreground">
                {copy.useEndpointNameFallback(endpointSourceDefaultName)}
              </p>
            </div>
            <div className="rounded-xl border border-dashed bg-muted/20 p-3 text-[11px] text-muted-foreground">
              {copy.routingPriorityHint}
            </div>
          </div>

          <SwitchController
            label={copy.active}
            description={copy.includeInLoadBalancing}
            checked={connectionForm.is_active ?? true}
            onCheckedChange={(checked) => setConnectionForm({ ...connectionForm, is_active: checked })}
          />

          <div className="space-y-2">
            <Label>{copy.pricingTemplate}</Label>
            <Select
              value={connectionForm.pricing_template_id ? String(connectionForm.pricing_template_id) : "unpriced"}
              onValueChange={(value) => {
                setConnectionForm({
                  ...connectionForm,
                  pricing_template_id: value === "unpriced" ? null : parseInt(value, 10),
                });
              }}
            >
              <SelectTrigger>
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
            <p className="text-[11px] text-muted-foreground">
              {copy.pricingTemplateHint}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {limiterFields.map((field) => (
              <div key={field.field} className="grid content-start gap-2">
                <div className="min-h-14 space-y-1">
                  <Label htmlFor={field.id}>{field.label}</Label>
                  <p className="text-[11px] text-muted-foreground">{copy.leaveBlankForUnlimited}</p>
                </div>
                <Input
                  id={field.id}
                  type="number"
                  min="0"
                  value={field.value ?? ""}
                  onChange={(e) => handleLimiterChange(field.field, e.target.value)}
                />
              </div>
            ))}
          </div>

          {/* Custom Headers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{copy.customHeaders}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setHeaderRows([...headerRows, { key: "", value: "" }])}
              >
                <Plus className="mr-1.5 h-3 w-3" />
                {copy.addHeader}
              </Button>
            </div>
            {headerRows.length === 0 && (
              <p className="text-xs text-muted-foreground italic">{copy.noCustomHeadersConfigured}</p>
            )}
            <div className="space-y-2">
              {headerRows.map((row, index) => (
                <div key={`${row.key}:${row.value}`} className="flex items-center gap-2">
                  <Input
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


          <DialogFooter className="gap-2">
            {editingConnection && (
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
              )}
            <div className="flex-1" />
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {copy.cancel}
            </Button>
            <Button type="submit">{copy.saveConnection}</Button>
          </DialogFooter>
        </form>

        {dialogTestResult && (
          <div className={cn(
            "mt-4 rounded-md p-3 text-sm",
            dialogTestResult.status === "healthy" ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200" :
            "bg-red-50 text-red-900 dark:bg-red-950/30 dark:text-red-200"
          )}>
            <p className="font-medium">
              {dialogTestResult.status === "healthy" ? copy.connectionHealthy : copy.connectionUnhealthy}
            </p>
            <p className="mt-1 text-xs opacity-90">{dialogTestResult.detail}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
