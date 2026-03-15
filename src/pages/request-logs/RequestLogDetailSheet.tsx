import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ExternalLink, Copy, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { RequestLogEntry, AuditLogDetail } from "@/lib/types";
import type { DetailTab } from "./queryParams";
import { formatCost, formatTokens } from "./columns";
import { useAuditDetail } from "./useAuditDetail";

interface RequestLogDetailSheetProps {
  request: RequestLogEntry | null;
  open: boolean;
  activeTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
  onClose: () => void;
  onNavigateToConnection: (connectionId: number) => void;
  formatTimestamp: (iso: string) => string;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-xs font-medium">{children}</span>
    </div>
  );
}

function OverviewTab({
  request,
  onNavigateToConnection,
  formatTimestamp,
}: {
  request: RequestLogEntry;
  onNavigateToConnection: (id: number) => void;
  formatTimestamp: (iso: string) => string;
}) {
  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(request, null, 2)).then(
      () => toast.success("Copied to clipboard"),
      () => toast.error("Failed to copy")
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Request
        </h4>
        <div className="rounded-md border p-3">
          <DetailRow label="ID">{request.id}</DetailRow>
          <DetailRow label="Time">{formatTimestamp(request.created_at)}</DetailRow>
          <DetailRow label="Model">{request.model_id}</DetailRow>
          <DetailRow label="Provider">
            <span className="capitalize">{request.provider_type}</span>
          </DetailRow>
          <DetailRow label="Path">
            <span className="font-mono text-[11px]">{request.request_path}</span>
          </DetailRow>
          <DetailRow label="Status">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-1.5 py-0",
                request.status_code >= 200 && request.status_code < 300
                  ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                  : request.status_code >= 400 && request.status_code < 500
                    ? "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300"
                    : "border-red-500/30 bg-red-500/15 text-red-700 dark:text-red-300"
              )}
            >
              {request.status_code}
            </Badge>
          </DetailRow>
          <DetailRow label="Latency">{request.response_time_ms.toLocaleString()}ms</DetailRow>
          <DetailRow label="Stream">{request.is_stream ? "Yes" : "No"}</DetailRow>
          {request.error_detail && (
            <DetailRow label="Error">
              <span className="text-red-600 dark:text-red-400">{request.error_detail}</span>
            </DetailRow>
          )}
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Tokens
        </h4>
        <div className="rounded-md border p-3">
          <DetailRow label="Input">{formatTokens(request.input_tokens)}</DetailRow>
          <DetailRow label="Output">{formatTokens(request.output_tokens)}</DetailRow>
          <DetailRow label="Total">{formatTokens(request.total_tokens)}</DetailRow>
          {(request.cache_read_input_tokens ?? 0) > 0 && (
            <DetailRow label="Cache read">{formatTokens(request.cache_read_input_tokens)}</DetailRow>
          )}
          {(request.cache_creation_input_tokens ?? 0) > 0 && (
            <DetailRow label="Cache creation">{formatTokens(request.cache_creation_input_tokens)}</DetailRow>
          )}
          {(request.reasoning_tokens ?? 0) > 0 && (
            <DetailRow label="Reasoning">{formatTokens(request.reasoning_tokens)}</DetailRow>
          )}
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Cost
        </h4>
        <div className="rounded-md border p-3">
          <DetailRow label="Input">
            {formatCost(request.input_cost_micros, request.report_currency_symbol)}
          </DetailRow>
          <DetailRow label="Output">
            {formatCost(request.output_cost_micros, request.report_currency_symbol)}
          </DetailRow>
          <DetailRow label="Total">
            {formatCost(request.total_cost_user_currency_micros, request.report_currency_symbol)}
          </DetailRow>
          <DetailRow label="Priced">{request.priced_flag ? "Yes" : "No"}</DetailRow>
          <DetailRow label="Billable">{request.billable_flag ? "Yes" : "No"}</DetailRow>
          {request.unpriced_reason && (
            <DetailRow label="Unpriced reason">{request.unpriced_reason}</DetailRow>
          )}
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Routing
        </h4>
        <div className="rounded-md border p-3">
          {request.endpoint_id && (
            <DetailRow label="Endpoint">
              #{request.endpoint_id}
              {request.endpoint_description && ` — ${request.endpoint_description}`}
            </DetailRow>
          )}
          {request.connection_id && (
            <DetailRow label="Connection">
              <Button
                variant="link"
                size="sm"
                className="h-auto gap-1 p-0 text-xs"
                onClick={() => onNavigateToConnection(request.connection_id!)}
              >
                #{request.connection_id}
                <ExternalLink className="h-3 w-3" />
              </Button>
            </DetailRow>
          )}
          {request.endpoint_base_url && (
            <DetailRow label="Base URL">
              <span className="font-mono text-[11px]">{request.endpoint_base_url}</span>
            </DetailRow>
          )}
        </div>
      </div>

      <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={handleCopyJson}>
        <Copy className="h-3 w-3" />
        Export as JSON
      </Button>
    </div>
  );
}

function AuditTab({
  audits,
  loading,
  error,
  formatTimestamp,
}: {
  audits: AuditLogDetail[];
  loading: boolean;
  error: string | null;
  formatTimestamp: (iso: string) => string;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (audits.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No audit records found for this request.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {audits.map((audit, idx) => (
        <div key={audit.id} className="rounded-md border">
          <div className="border-b bg-muted/30 px-3 py-2">
            <span className="text-xs font-medium">
              {audits.length > 1 ? `Attempt ${idx + 1}` : "Audit capture"} — {formatTimestamp(audit.created_at)}
            </span>
          </div>
          <div className="space-y-3 p-3">
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Request
              </p>
              <div className="text-xs">
                <span className="font-mono">
                  {audit.request_method} {audit.request_url}
                </span>
              </div>
              {audit.request_body && (
                <pre className="mt-1.5 max-h-48 overflow-auto rounded bg-muted/50 p-2 text-[11px] leading-relaxed">
                  {tryFormatJson(audit.request_body)}
                </pre>
              )}
            </div>
            <Separator />
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Response ({audit.response_status})
              </p>
              {audit.response_body ? (
                <pre className="max-h-64 overflow-auto rounded bg-muted/50 p-2 text-[11px] leading-relaxed">
                  {tryFormatJson(audit.response_body)}
                </pre>
              ) : (
                <p className="text-xs text-muted-foreground">No response body captured</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function tryFormatJson(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

export function RequestLogDetailSheet({
  request,
  open,
  activeTab,
  onTabChange,
  onClose,
  onNavigateToConnection,
  formatTimestamp,
}: RequestLogDetailSheetProps) {
  const { audits, loading: auditLoading, error: auditError } = useAuditDetail({
    requestLogId: request?.id ?? null,
    enabled: open && activeTab === "audit",
  });

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-base">
            Request #{request?.id ?? ""}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Request log detail view
          </SheetDescription>
        </SheetHeader>

        {request && (
          <Tabs
            value={activeTab}
            onValueChange={(v) => onTabChange(v as DetailTab)}
            className="mt-4"
          >
            <TabsList className="w-fit">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="audit">Audit</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <OverviewTab
                request={request}
                onNavigateToConnection={onNavigateToConnection}
                formatTimestamp={formatTimestamp}
              />
            </TabsContent>

            <TabsContent value="audit" className="mt-4">
              <AuditTab
                audits={audits}
                loading={auditLoading}
                error={auditError}
                formatTimestamp={formatTimestamp}
              />
            </TabsContent>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}
