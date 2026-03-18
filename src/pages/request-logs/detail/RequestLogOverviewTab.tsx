import { AlertTriangle, Coins, Copy, ExternalLink, FileText, Gauge, Route } from "lucide-react";
import { ProviderIcon } from "@/components/ProviderIcon";
import { TypeBadge, ValueBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatProviderType } from "@/lib/utils";
import type { RequestLogEntry } from "@/lib/types";
import { formatCost, formatTokens } from "../columns";
import {
  DetailRow,
  ProviderPill,
  SectionCard,
  SummaryStat,
} from "./requestLogDetailShared";
import { copyRequestLogText, getStatusIntent, getStatusTone } from "./requestLogDetailUtils";

interface RequestLogOverviewTabProps {
  request: RequestLogEntry;
  onNavigateToConnection: (id: number) => void;
  formatTimestamp: (iso: string) => string;
  resolveModelLabel: (modelId: string) => string;
}

function formatErrorDetail(errorDetail: string) {
  try {
    const parsed = JSON.parse(errorDetail) as unknown;
    if (typeof parsed === "object" && parsed !== null) {
      return JSON.stringify(parsed, null, 2);
    }
  } catch {
    return errorDetail;
  }

  return errorDetail;
}

export function RequestLogOverviewTab({
  request,
  onNavigateToConnection,
  formatTimestamp,
  resolveModelLabel,
}: RequestLogOverviewTabProps) {
  const tone = getStatusTone(request.status_code);
  const connectionId = request.connection_id;
  const modelLabel = resolveModelLabel(request.model_id);
  const formattedErrorDetail = request.error_detail ? formatErrorDetail(request.error_detail) : null;
  const hasFormattedErrorDetail = formattedErrorDetail !== null && formattedErrorDetail !== request.error_detail;

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
                <p className="mt-1 font-mono text-[11px] text-muted-foreground whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                  {request.model_id}
                </p>
              )}
              <p className="mt-1 font-mono text-xs text-muted-foreground whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                {request.request_path}
              </p>
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

      {formattedErrorDetail && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-red-700 dark:text-red-300">Error detail</p>
                  <p className="text-xs text-red-700/85 dark:text-red-300/85">
                    {hasFormattedErrorDetail
                      ? "Captured upstream failure detail, formatted for readability."
                      : "Captured upstream failure detail."}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 rounded-full border-red-500/20 px-2.5 text-[11px] text-red-700 hover:border-red-500/40 hover:bg-red-500/10 dark:text-red-200"
                  onClick={() => {
                    void copyRequestLogText(formattedErrorDetail, "error detail");
                  }}
                >
                  <Copy className="h-3 w-3" />
                  Copy
                </Button>
              </div>

              <ScrollArea className="max-h-64 rounded-lg border border-red-500/15 bg-background/85 shadow-inner">
                <pre className="max-w-full whitespace-pre-wrap break-words p-3 font-mono text-[11px] leading-5 text-foreground [overflow-wrap:anywhere]">
                  {formattedErrorDetail}
                </pre>
              </ScrollArea>
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
               {modelLabel !== request.model_id && (
                 <p className="font-mono text-[11px] text-muted-foreground whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                   {request.model_id}
                 </p>
               )}
             </div>
           </DetailRow>
          <DetailRow label="Provider">
            <span className="flex items-center gap-2">
              <ProviderIcon providerType={request.provider_type} size={16} />
              {formatProviderType(request.provider_type)}
            </span>
          </DetailRow>
          <DetailRow label="Path">
            <span className="font-mono text-[12px] whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
              {request.request_path}
            </span>
          </DetailRow>
          <DetailRow label="Stream">{request.is_stream ? <TypeBadge label="Streaming" intent="blue" /> : "No"}</DetailRow>
        </SectionCard>

        <SectionCard icon={Route} title="Routing context">
          {request.endpoint_id !== null && (
            <DetailRow label="Endpoint">
              <span className="font-mono text-[12px] whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
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
            <DetailRow label="Base URL">
              <span className="font-mono text-[12px] whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                {request.endpoint_base_url}
              </span>
            </DetailRow>
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
