import { AlertCircle, Clock, Coins, ExternalLink, FileText, Filter, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ProviderIcon } from "@/components/ProviderIcon";
import { TypeBadge, ValueBadge } from "@/components/StatusBadge";
import { formatMoneyMicros, formatTokenCount } from "@/lib/costing";
import type { RequestLogEntry } from "@/lib/types";
import {
  UNIVERSAL_TIMESTAMP_FORMAT,
  formatLatency,
  getDisplayCurrency,
} from "./formatters";

interface RequestLogDetailSheetProps {
  selectedLog: RequestLogEntry | null;
  setSelectedLog: (log: RequestLogEntry | null) => void;
  setModelId: (id: string) => void;
  setProviderType: (type: string) => void;
  setConnectionId: (id: string) => void;
  setOffset: (offset: number) => void;
  navigateToConnection: (id: number) => Promise<void>;
  formatTime: (date: string, options?: Intl.DateTimeFormatOptions) => string;
}

export function RequestLogDetailSheet({
  selectedLog,
  setSelectedLog,
  setModelId,
  setProviderType,
  setConnectionId,
  setOffset,
  navigateToConnection,
  formatTime,
}: RequestLogDetailSheetProps) {
  return (
    <Sheet open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
      <SheetContent className="sm:max-w-xl overflow-y-auto p-0 gap-0">
        {selectedLog ? (
          <>
            <SheetHeader className="p-6 border-b bg-muted/10 space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">
                  #{selectedLog.id}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatTime(selectedLog.created_at, UNIVERSAL_TIMESTAMP_FORMAT)}
                </span>
              </div>

              <div className="space-y-1">
                <SheetTitle className="text-lg font-mono">{selectedLog.model_id}</SheetTitle>
                <SheetDescription className="flex items-center gap-2">
                  <ProviderIcon providerType={selectedLog.provider_type} size={14} />
                  <span className="capitalize">{selectedLog.provider_type}</span>
                  <span>•</span>
                  <span>{selectedLog.endpoint_description || "Unknown endpoint"}</span>
                </SheetDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <ValueBadge
                  label={String(selectedLog.status_code)}
                  intent={
                    selectedLog.status_code < 300
                      ? "success"
                      : selectedLog.status_code < 500
                        ? "warning"
                        : "danger"
                  }
                />
                <Badge variant="secondary" className="gap-1 font-mono">
                  <Clock className="h-3.5 w-3.5" />
                  {formatLatency(selectedLog.response_time_ms)}
                </Badge>
                <Badge variant="secondary" className="gap-1 font-mono">
                  <Coins className="h-3.5 w-3.5" />
                  {formatMoneyMicros(
                    selectedLog.total_cost_user_currency_micros,
                    getDisplayCurrency(selectedLog).symbol,
                    getDisplayCurrency(selectedLog).code,
                    2,
                    6
                  )}
                </Badge>
                {selectedLog.is_stream ? <TypeBadge label="Stream" /> : null}
              </div>
            </SheetHeader>

            <div className="space-y-[var(--density-card-gap)] p-6">
              {selectedLog.status_code >= 400 ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4">
                  <h4 className="mb-2 text-sm font-medium text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Status & Error Payload
                  </h4>
                  <pre className="whitespace-pre-wrap text-xs font-mono text-destructive/90">
                    {selectedLog.error_detail || "No error payload provided"}
                  </pre>
                </div>
              ) : null}

              <div>
                <h4 className="mb-3 text-sm font-medium">Timeline</h4>
                <div className="rounded-md border bg-muted/20 p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Request received</span>
                    <span className="font-mono">{formatTime(selectedLog.created_at, UNIVERSAL_TIMESTAMP_FORMAT)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Response completed</span>
                    <span className="font-mono">+ {selectedLog.response_time_ms.toFixed(0)}ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Outcome</span>
                    <span className="font-mono">HTTP {selectedLog.status_code}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-medium">Token Breakdown</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-md border p-3">
                    <p className="text-muted-foreground">Input Tokens</p>
                    <p className="mt-1 font-mono">{formatTokenCount(selectedLog.input_tokens)}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-muted-foreground">Output Tokens</p>
                    <p className="mt-1 font-mono">{formatTokenCount(selectedLog.output_tokens)}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-muted-foreground">Cached Tokens</p>
                    <p className="mt-1 font-mono">{formatTokenCount(selectedLog.cache_read_input_tokens)}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-muted-foreground">Cache Create Tokens</p>
                    <p className="mt-1 font-mono">{formatTokenCount(selectedLog.cache_creation_input_tokens)}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-muted-foreground">Reasoning Tokens</p>
                    <p className="mt-1 font-mono">{formatTokenCount(selectedLog.reasoning_tokens)}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-muted-foreground">Total Tokens</p>
                    <p className="mt-1 font-mono font-semibold">{formatTokenCount(selectedLog.total_tokens)}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-medium">Cost Breakdown</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-md border p-3">
                    <p className="text-muted-foreground">Input Cost</p>
                    <p className="mt-1 font-mono">
                      {formatMoneyMicros(selectedLog.input_cost_micros, getDisplayCurrency(selectedLog).symbol)}
                    </p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-muted-foreground">Output Cost</p>
                    <p className="mt-1 font-mono">
                      {formatMoneyMicros(selectedLog.output_cost_micros, getDisplayCurrency(selectedLog).symbol)}
                    </p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-muted-foreground">Cached Cost</p>
                    <p className="mt-1 font-mono">
                      {formatMoneyMicros(
                        selectedLog.cache_read_input_cost_micros,
                        getDisplayCurrency(selectedLog).symbol
                      )}
                    </p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-muted-foreground">Cache Create Cost</p>
                    <p className="mt-1 font-mono">
                      {formatMoneyMicros(
                        selectedLog.cache_creation_input_cost_micros,
                        getDisplayCurrency(selectedLog).symbol
                      )}
                    </p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-muted-foreground">Reasoning Cost</p>
                    <p className="mt-1 font-mono">
                      {formatMoneyMicros(selectedLog.reasoning_cost_micros, getDisplayCurrency(selectedLog).symbol)}
                    </p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-muted-foreground">Total Cost</p>
                    <p className="mt-1 font-mono font-semibold">
                      {formatMoneyMicros(
                        selectedLog.total_cost_user_currency_micros,
                        getDisplayCurrency(selectedLog).symbol,
                        getDisplayCurrency(selectedLog).code,
                        2,
                        6
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-medium">Metadata</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-md border p-3">
                    <p className="text-muted-foreground">Connection ID</p>
                    <p className="mt-1 font-mono">{selectedLog.connection_id ?? "-"}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-muted-foreground">Endpoint ID</p>
                    <p className="mt-1 font-mono">{selectedLog.endpoint_id ?? "-"}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-muted-foreground">Request Path</p>
                    <p className="mt-1 font-mono truncate" title={selectedLog.request_path}>
                      {selectedLog.request_path}
                    </p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-muted-foreground">Pricing Config</p>
                    <p className="mt-1 font-mono">
                      {selectedLog.pricing_config_version_used == null
                        ? "-"
                        : `v${selectedLog.pricing_config_version_used}`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-1 space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setModelId(selectedLog.model_id);
                    setProviderType(selectedLog.provider_type);
                    if (selectedLog.connection_id) {
                      setConnectionId(String(selectedLog.connection_id));
                    }
                    setOffset(0);
                    setSelectedLog(null);
                  }}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Find similar (same model/endpoint)
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    if (selectedLog.connection_id) {
                      setConnectionId(String(selectedLog.connection_id));
                      setOffset(0);
                      setSelectedLog(null);
                    }
                  }}
                  disabled={!selectedLog.connection_id}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Show only this connection
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    if (selectedLog.connection_id) {
                      navigateToConnection(selectedLog.connection_id);
                    }
                  }}
                  disabled={!selectedLog.connection_id}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open connection details
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(selectedLog, null, 2)], {
                      type: "application/json",
                    });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `request-log-${selectedLog.id}.json`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Export JSON
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
