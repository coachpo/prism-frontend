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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingConnection ? "Edit Connection" : "Add Connection"}</DialogTitle>
          <DialogDescription>
            Configure endpoint source and optional pricing template for this connection. Routing priority is managed from the connection list by dragging cards.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleConnectionSubmit} className="space-y-5">
          <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Label className="text-sm font-medium">Endpoint Source</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  {editingConnection
                    ? "Switch this connection to another endpoint or create a new one."
                    : "Choose an existing endpoint or create one inline for this connection."}
                </p>
              </div>
              {editingConnection && (
                <StatusBadge label="Editable" intent="info" />
              )}
            </div>

            <Tabs
              value={createMode}
              onValueChange={(value) => setCreateMode(value as "select" | "new")}
              className="gap-3"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="select">Select Existing</TabsTrigger>
                <TabsTrigger value="new">Create New</TabsTrigger>
              </TabsList>

              <TabsContent value="select" className="space-y-2">
                <Label>Select Endpoint</Label>
                <Select value={selectedEndpointId} onValueChange={setSelectedEndpointId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an endpoint..." />
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
                    Selected: <span className="font-medium text-foreground">{selectedEndpoint.name}</span>
                  </p>
                )}
                {globalEndpoints.length === 0 && (
                <p className="text-xs text-muted-foreground">No profile endpoints found.</p>
                )}
              </TabsContent>

              <TabsContent value="new" className="space-y-3">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    placeholder="e.g. OpenAI Primary"
                    value={newEndpointForm.name}
                    onChange={(e) => setNewEndpointForm({ ...newEndpointForm, name: e.target.value })}
                    required={createMode === "new"}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Base URL</Label>
                  <Input
                    placeholder="https://api.openai.com/v1"
                    value={newEndpointForm.base_url}
                    onChange={(e) => setNewEndpointForm({ ...newEndpointForm, base_url: e.target.value })}
                    required={createMode === "new"}
                  />
                </div>
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    placeholder="sk-..."
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
              <Label htmlFor="conn-name">Name (Optional)</Label>
              <Input
                id="conn-name"
                placeholder="Connection display name"
                value={connectionForm.name || ""}
                onChange={(e) => setConnectionForm({ ...connectionForm, name: e.target.value })}
              />
              <p className="text-[11px] text-muted-foreground">
                Leave blank to use endpoint name{endpointSourceDefaultName ? `: ${endpointSourceDefaultName}` : ""}.
              </p>
            </div>
            <div className="rounded-xl border border-dashed bg-muted/20 p-3 text-[11px] text-muted-foreground">
              New connections are appended as fallbacks. Drag and drop cards in the Model Detail list to adjust routing priority.
            </div>
          </div>

          <SwitchController
            label="Active"
            description="Include in load balancing"
            checked={connectionForm.is_active ?? true}
            onCheckedChange={(checked) => setConnectionForm({ ...connectionForm, is_active: checked })}
          />

          <div className="space-y-2">
            <Label>Pricing Template</Label>
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
                <SelectValue placeholder="Select a pricing template..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unpriced">Unpriced (No cost tracking)</SelectItem>
                {pricingTemplates.map((template) => (
                  <SelectItem key={template.id} value={String(template.id)}>
                    {template.name} v{template.version}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Assign a pricing template to track costs for this connection.
            </p>
          </div>

          {/* Custom Headers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Custom Headers</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setHeaderRows([...headerRows, { key: "", value: "" }])}
              >
                <Plus className="mr-1.5 h-3 w-3" />
                Add Header
              </Button>
            </div>
            {headerRows.length === 0 && (
              <p className="text-xs text-muted-foreground italic">No custom headers configured.</p>
            )}
            <div className="space-y-2">
              {headerRows.map((row, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder="Header Key"
                    value={row.key}
                    onChange={(e) => {
                      const newRows = [...headerRows];
                      newRows[index].key = e.target.value;
                      setHeaderRows(newRows);
                    }}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Value"
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
                    Testing...
                  </>
                ) : (
                  "Test Connection"
                )}
              </Button>
            )}
            <div className="flex-1" />
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Connection</Button>
          </DialogFooter>
        </form>

        {dialogTestResult && (
          <div className={cn(
            "mt-4 rounded-md p-3 text-sm",
            dialogTestResult.status === "healthy" ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200" :
            "bg-red-50 text-red-900 dark:bg-red-950/30 dark:text-red-200"
          )}>
            <p className="font-medium">
              {dialogTestResult.status === "healthy" ? "Connection Healthy" : "Connection Unhealthy"}
            </p>
            <p className="mt-1 text-xs opacity-90">{dialogTestResult.detail}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
