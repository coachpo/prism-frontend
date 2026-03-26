import { useState, type ReactNode } from "react";
import {
  AlertCircle,
  ExternalLink,
  Search,
} from "lucide-react";
import { useLocale } from "@/i18n/useLocale";
import { AnimatedListItem } from "@/components/AnimatedListItem";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoneyMicros } from "@/lib/costing";
import { formatApiFamily } from "@/lib/utils";
import type { StatisticsRequestLogEntry } from "@/lib/types";
import type { InvestigateTab } from "../queryParams";
import { OperationsChartCard } from "./chartPresentation";
import { OperationsSectionTitle } from "./OperationsSectionTitle";
import { OPERATIONS_CHART_TOOLTIP_STYLE } from "./chartTooltipStyle";
import type {
  ErrorCodeBreakdownItem,
  LatencyBandDatum,
  TopErrorItem,
} from "./operationsTypes";

interface OperationsDebugSectionProps {
  errorCodeBreakdown: ErrorCodeBreakdownItem[];
  latencyBandData: LatencyBandDatum[];
  topErrors: TopErrorItem[];
  slowRequests: StatisticsRequestLogEntry[];
  costlyRequests: StatisticsRequestLogEntry[];
  newLogIds: Set<number>;
  clearNewLogHighlight: (logId: number) => void;
  reportSymbol: string;
  reportCode: string;
  onViewInRequestLogs?: (requestId: number) => void;
}

function InvestigateRequestRow({
  item,
  metric,
  newLogIds,
  clearNewLogHighlight,
  onViewInRequestLogs,
}: {
  item: StatisticsRequestLogEntry;
  metric: ReactNode;
  newLogIds: Set<number>;
  clearNewLogHighlight: (logId: number) => void;
  onViewInRequestLogs?: (requestId: number) => void;
}) {
  const { messages } = useLocale();
  return (
    <AnimatedListItem
      key={item.id}
      isNew={newLogIds.has(item.id)}
      className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
      onAnimationEnd={() => clearNewLogHighlight(item.id)}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{item.model_id}</p>
        <p className="text-xs text-muted-foreground">
          {formatApiFamily(item.api_family ?? "")} · {item.status_code}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-xs font-medium">{metric}</span>
        {onViewInRequestLogs && (
          <Tooltip>
             <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onViewInRequestLogs(item.id)}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{messages.statistics.viewInRequestLogs}</TooltipContent>
          </Tooltip>
        )}
      </div>
    </AnimatedListItem>
  );
}

export function OperationsDebugSection({
  errorCodeBreakdown,
  latencyBandData,
  topErrors,
  slowRequests,
  costlyRequests,
  newLogIds,
  clearNewLogHighlight,
  reportSymbol,
  reportCode,
  onViewInRequestLogs,
}: OperationsDebugSectionProps) {
  const { formatNumber, locale, messages } = useLocale();
  const [investigateTab, setInvestigateTab] = useState<InvestigateTab>("errors");

  return (
    <div className="space-y-3">
      <OperationsSectionTitle
        title={messages.statistics.debug}
        icon={Search}
        iconClassName="h-4 w-4 text-slate-600"
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <OperationsChartCard title={messages.statistics.latencyDistribution} heightClassName="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={latencyBandData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="band" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" allowDecimals={false} />
              <RechartsTooltip contentStyle={OPERATIONS_CHART_TOOLTIP_STYLE} />
              <Bar dataKey="count" fill="var(--chart-4)" radius={[4, 4, 0, 0]} maxBarSize={44} />
            </BarChart>
          </ResponsiveContainer>
        </OperationsChartCard>

        <OperationsChartCard title={messages.statistics.topHttpErrors} heightClassName="space-y-3">
          {errorCodeBreakdown.length === 0 ? (
            <p className="text-xs text-muted-foreground">{messages.statistics.noHttpErrorsInSlice}</p>
          ) : (
            errorCodeBreakdown.map((item) => (
              <div key={item.status} className="flex items-center justify-between rounded-md border px-3 py-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium">{item.status}</span>
                </div>
                <span className="text-xs text-muted-foreground">{formatNumber(item.count)} events</span>
              </div>
            ))
          )}
        </OperationsChartCard>
      </div>

      <OperationsChartCard title={messages.statistics.investigate} heightClassName="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={investigateTab === "errors" ? "default" : "outline"}
            onClick={() => setInvestigateTab("errors")}
          >
            {messages.statistics.errors}
          </Button>
          <Button
            size="sm"
            variant={investigateTab === "slow" ? "default" : "outline"}
            onClick={() => setInvestigateTab("slow")}
          >
            {messages.statistics.slow}
          </Button>
          <Button
            size="sm"
            variant={investigateTab === "costly" ? "default" : "outline"}
            onClick={() => setInvestigateTab("costly")}
          >
            {messages.statistics.costly}
          </Button>
        </div>

        {investigateTab === "errors" ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{messages.statistics.mostFrequentErrorSignatures}</p>

            {topErrors.length === 0 ? (
              <p className="text-xs text-muted-foreground">{messages.statistics.noErrorSignaturesFound}</p>
            ) : (
              topErrors.map((item) => (
                <div
                  key={`${item.statusCode}-${item.rawDetail}`}
                  className="flex items-start justify-between gap-3 rounded-md border px-3 py-2"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-xs font-medium text-destructive">HTTP {item.statusCode}</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="cursor-help truncate text-sm text-muted-foreground">{item.detail}</p>
                      </TooltipTrigger>
                      <TooltipContent side="top" align="start" className="max-w-md">
                        <pre className="whitespace-pre-wrap break-words text-xs">{item.rawDetail}</pre>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{item.count}x</span>
                </div>
              ))
            )}
          </div>
        ) : null}

        {investigateTab === "slow" ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{messages.statistics.slowestRequests}</p>

            {slowRequests.length === 0 ? (
              <p className="text-xs text-muted-foreground">{messages.statistics.noRequestsFound}</p>
            ) : (
              slowRequests.map((item) => (
                <InvestigateRequestRow
                  key={item.id}
                  item={item}
                  metric={`${formatNumber(item.response_time_ms)}ms`}
                  newLogIds={newLogIds}
                  clearNewLogHighlight={clearNewLogHighlight}
                  onViewInRequestLogs={onViewInRequestLogs}
                />
              ))
            )}
          </div>
        ) : null}

        {investigateTab === "costly" ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{messages.statistics.highestSpend}</p>

            {costlyRequests.length === 0 ? (
              <p className="text-xs text-muted-foreground">{messages.statistics.noCostRecordsFound}</p>
            ) : (
              costlyRequests.map((item) => (
                <InvestigateRequestRow
                  key={item.id}
                  item={item}
                  metric={formatMoneyMicros(item.total_cost_user_currency_micros ?? 0, reportSymbol, reportCode, 2, 6, locale)}
                  newLogIds={newLogIds}
                  clearNewLogHighlight={clearNewLogHighlight}
                  onViewInRequestLogs={onViewInRequestLogs}
                />
              ))
            )}
          </div>
        ) : null}
      </OperationsChartCard>
    </div>
  );
}
