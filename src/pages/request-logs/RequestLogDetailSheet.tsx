import { AlertTriangle, Clock3, Coins, Copy, ExternalLink, FileText, Gauge, Route, Terminal } from "lucide-react";
import { toast } from "sonner";
import { ProviderIcon } from "@/components/ProviderIcon";
import { TypeBadge, ValueBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatProviderType } from "@/lib/utils";
import type { AuditLogDetail, RequestLogEntry } from "@/lib/types";
import { formatCost, formatTokens } from "./columns";
import type { DetailTab } from "./queryParams";
import { useAuditDetail } from "./useAuditDetail";

interface RequestLogDetailSheetProps {
  request: RequestLogEntry | null;
  open: boolean;
  activeTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
  onClose: () => void;
  onNavigateToConnection: (connectionId: number) => void;
  formatTimestamp: (iso: string) => string;
  resolveModelLabel: (modelId: string) => string;
}

function getStatusIntent(statusCode: number) {
  if (statusCode >= 200 && statusCode < 300) return "success" as const;
  if (statusCode >= 400 && statusCode < 500) return "warning" as const;
  return "danger" as const;
}

function getStatusTone(statusCode: number) {
  if (statusCode >= 200 && statusCode < 300) {
    return { card: "border-l-emerald-500 bg-emerald-500/[0.05]" };
  }

  if (statusCode >= 400 && statusCode < 500) {
    return { card: "border-l-amber-500 bg-amber-500/[0.06]" };
  }

  return { card: "border-l-red-500 bg-red-500/[0.06]" };
}

function copyText(content: string, label: string) {
  navigator.clipboard.writeText(content).then(
    () => toast.success(`Copied ${label}`),
    () => toast.error(`Failed to copy ${label}`)
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[112px_minmax(0,1fr)] items-start gap-4 py-2 text-sm">
      <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <div className="min-w-0 text-sm font-medium text-foreground">{children}</div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/80 p-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <div className="mt-1.5 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="space-y-0 px-4 py-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">{children}</CardContent>
    </Card>
  );
}

function PayloadBlock({ title, content }: { title: string; content: string }) {
  const hasContent = content.length > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
        <Button
          variant="outline"
          size="sm"
          className="h-7 rounded-full px-2.5 text-[11px]"
          disabled={!hasContent}
          onClick={() => hasContent && copyText(content, title.toLowerCase())}
        >
          <Copy className="h-3 w-3" />
          Copy
        </Button>
      </div>
      <ScrollArea className="h-56 rounded-xl border border-zinc-800 bg-zinc-950 shadow-inner">
        <pre className="min-h-full whitespace-pre-wrap break-all p-3 text-[11px] leading-5 text-zinc-50">
          {hasContent ? content : `No ${title.toLowerCase()} captured.`}
        </pre>
      </ScrollArea>
    </div>
  );
}

function ProviderPill({ providerType }: { providerType: string }) {
  return (
    <Badge variant="outline" className="gap-1.5 border-border/70 bg-background/80 text-[10px] font-medium">
      <ProviderIcon providerType={providerType} size={12} />
      {formatProviderType(providerType)}
    </Badge>
  );
}

function OverviewTab({
  request,
  onNavigateToConnection,
  formatTimestamp,
  resolveModelLabel,
}: {
  request: RequestLogEntry;
  onNavigateToConnection: (id: number) => void;
  formatTimestamp: (iso: string) => string;
  resolveModelLabel: (modelId: string) => string;
}) {
  const tone = getStatusTone(request.status_code);
  const connectionId = request.connection_id;
  const modelLabel = resolveModelLabel(request.model_id);

  return (
    <div className="space-y-4">
      <Card className={cn("overflow-hidden border-l-4 shadow-sm", tone.card)}>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <ValueBadge label={String(request.status_code)} intent={getStatusIntent(request.status_code)} className="px-1.5 py-0 font-mono" />
              {request.is_stream && <TypeBadge label="Streaming" intent="blue" className="px-2 py-0.5" />}
              <ProviderPill providerType={request.provider_type} />
            </div>

            <div>
              <h3 className="text-lg font-semibold tracking-tight">{modelLabel}</h3>
              {modelLabel !== request.model_id && (
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">{request.model_id}</p>
              )}
              <p className="mt-1 font-mono text-xs text-muted-foreground">{request.request_path}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryStat label="Latency" value={<span className="font-mono">{request.response_time_ms.toLocaleString()}ms</span>} />
            <SummaryStat label="Total tokens" value={<span className="font-mono">{formatTokens(request.total_tokens)}</span>} />
            <SummaryStat label="Total cost" value={<span className="font-mono">{formatCost(request.total_cost_user_currency_micros, request.report_currency_symbol)}</span>} />
            <SummaryStat label="Timestamp" value={<span className="font-mono text-xs">{formatTimestamp(request.created_at)}</span>} />
          </div>
        </CardContent>
      </Card>

      {request.error_detail && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-red-700 dark:text-red-300">Error detail</p>
              <p className="text-sm text-red-700 dark:text-red-200 break-words">{request.error_detail}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <SectionCard icon={FileText} title="Request details">
          <DetailRow label="Request ID"><span className="font-mono">#{request.id}</span></DetailRow>
          <DetailRow label="Time"><span className="font-mono text-xs">{formatTimestamp(request.created_at)}</span></DetailRow>
          <DetailRow label="Model">
            <div className="space-y-1">
              <p>{modelLabel}</p>
              {modelLabel !== request.model_id && <p className="font-mono text-[11px] text-muted-foreground">{request.model_id}</p>}
            </div>
          </DetailRow>
          <DetailRow label="Provider">
            <span className="flex items-center gap-2">
              <ProviderIcon providerType={request.provider_type} size={16} />
              {formatProviderType(request.provider_type)}
            </span>
          </DetailRow>
          <DetailRow label="Path"><span className="break-all font-mono text-[12px]">{request.request_path}</span></DetailRow>
          <DetailRow label="Stream">{request.is_stream ? <TypeBadge label="Streaming" intent="blue" /> : "No"}</DetailRow>
        </SectionCard>

        <SectionCard icon={Route} title="Routing context">
          {request.endpoint_id !== null && (
            <DetailRow label="Endpoint">
              <span className="break-words font-mono text-[12px]">
                #{request.endpoint_id}
                {request.endpoint_description ? ` - ${request.endpoint_description}` : ""}
              </span>
            </DetailRow>
          )}
          {connectionId !== null && (
            <DetailRow label="Connection">
              <Button
                variant="link"
                size="sm"
                className="h-auto gap-1.5 p-0 text-sm"
                onClick={() => onNavigateToConnection(connectionId)}
              >
                <span className="font-mono">#{connectionId}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </DetailRow>
          )}
          {request.endpoint_base_url && (
            <DetailRow label="Base URL"><span className="break-all font-mono text-[12px]">{request.endpoint_base_url}</span></DetailRow>
          )}
        </SectionCard>

        <SectionCard icon={Gauge} title="Token usage">
          <DetailRow label="Input"><span className="font-mono">{formatTokens(request.input_tokens)}</span></DetailRow>
          <DetailRow label="Output"><span className="font-mono">{formatTokens(request.output_tokens)}</span></DetailRow>
          <DetailRow label="Total"><span className="font-mono">{formatTokens(request.total_tokens)}</span></DetailRow>
          {(request.cache_read_input_tokens ?? 0) > 0 && (
            <DetailRow label="Cache read"><span className="font-mono">{formatTokens(request.cache_read_input_tokens)}</span></DetailRow>
          )}
          {(request.cache_creation_input_tokens ?? 0) > 0 && (
            <DetailRow label="Cache create"><span className="font-mono">{formatTokens(request.cache_creation_input_tokens)}</span></DetailRow>
          )}
          {(request.reasoning_tokens ?? 0) > 0 && (
            <DetailRow label="Reasoning"><span className="font-mono">{formatTokens(request.reasoning_tokens)}</span></DetailRow>
          )}
        </SectionCard>

        <SectionCard icon={Coins} title="Cost breakdown">
          <DetailRow label="Input"><span className="font-mono">{formatCost(request.input_cost_micros, request.report_currency_symbol)}</span></DetailRow>
          <DetailRow label="Output"><span className="font-mono">{formatCost(request.output_cost_micros, request.report_currency_symbol)}</span></DetailRow>
          <DetailRow label="Total"><span className="font-mono">{formatCost(request.total_cost_user_currency_micros, request.report_currency_symbol)}</span></DetailRow>
          <DetailRow label="Priced">{request.priced_flag ? "Yes" : "No"}</DetailRow>
          <DetailRow label="Billable">{request.billable_flag ? "Yes" : "No"}</DetailRow>
          {request.unpriced_reason && <DetailRow label="Why unpriced">{request.unpriced_reason}</DetailRow>}
        </SectionCard>
      </div>
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
      <div className="space-y-4">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-10 text-center">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        <div className="space-y-1">
          <p className="text-sm font-medium">Audit capture unavailable</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (audits.length === 0) {
    return (
      <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
        No audit records found for this request.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {audits.map((audit) => (
        <Card key={audit.id} className="overflow-hidden border-border/70 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border/70 bg-muted/20 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <ValueBadge label={String(audit.response_status)} intent={getStatusIntent(audit.response_status)} className="px-1.5 py-0 font-mono" />
                <Badge variant="outline" className="border-border/70 bg-background/80 text-[10px] font-medium">
                  Audit capture
                </Badge>
              </div>
              <p className="break-all text-sm font-semibold tracking-tight">{audit.request_method} {audit.request_url}</p>
              <p className="text-xs text-muted-foreground">{formatTimestamp(audit.created_at)}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="gap-1 border-border/70 bg-background/80 px-2.5 py-1 text-[11px] font-medium">
                <Clock3 className="h-3 w-3" />
                {audit.duration_ms.toLocaleString()}ms
              </Badge>
              <Badge variant="outline" className="border-border/70 bg-background/80 font-mono text-[11px]">
                #{audit.id}
              </Badge>
            </div>
          </div>

          <CardContent className="space-y-4 p-4">
            <PayloadBlock title="Request headers" content={audit.request_headers || ""} />
            <Separator />
            <PayloadBlock title="Request" content={audit.request_body ?? ""} />
            <Separator />
            <PayloadBlock title={`Response (${audit.response_status})`} content={audit.response_body ?? ""} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function RequestLogDetailSheet({
  request,
  open,
  activeTab,
  onTabChange,
  onClose,
  onNavigateToConnection,
  formatTimestamp,
  resolveModelLabel,
}: RequestLogDetailSheetProps) {
  const { audits, loading: auditLoading, error: auditError } = useAuditDetail({
    requestLogId: request?.id ?? null,
    enabled: open && activeTab === "audit",
  });

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <SheetContent className="w-full overflow-y-auto border-l border-border/70 bg-background/98 px-0 sm:max-w-xl xl:max-w-2xl">
        <div className="space-y-6 px-6 pb-6 pt-5">
          <SheetHeader className="space-y-2 pr-8 text-left">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Terminal className="h-3.5 w-3.5" />
              <span>Technical inspection</span>
            </div>
            <SheetTitle className="text-xl font-semibold tracking-tight">Request #{request?.id ?? ""}</SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              Review request metadata, routing, tokens, costs, and captured upstream payloads.
            </SheetDescription>
          </SheetHeader>

          {request && (
            <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as DetailTab)} className="space-y-4">
              <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl bg-muted/70 p-1">
                <TabsTrigger value="overview" className="gap-2 rounded-lg text-sm font-medium">
                  <FileText className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="audit" className="gap-2 rounded-lg text-sm font-medium">
                  <Terminal className="h-4 w-4" />
                  Audit
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-0">
                <OverviewTab
                  request={request}
                  onNavigateToConnection={onNavigateToConnection}
                  formatTimestamp={formatTimestamp}
                  resolveModelLabel={resolveModelLabel}
                />
              </TabsContent>

              <TabsContent value="audit" className="mt-0">
                <AuditTab audits={audits} loading={auditLoading} error={auditError} formatTimestamp={formatTimestamp} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
