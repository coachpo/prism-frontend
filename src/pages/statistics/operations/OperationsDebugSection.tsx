import { useState, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowRight,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import type { RequestLogEntry } from "@/lib/types";
import type { InvestigateTab } from "../queryParams";
import { OperationsChartCard } from "./chartPresentation";
import { OperationsSectionTitle } from "./OperationsSectionTitle";
import { OPERATIONS_CHART_TOOLTIP_STYLE } from "./chartTooltipStyle";
import type {
  ErrorCodeBreakdownItem,
  LatencyBandDatum,
  RequestLogsPathBuilder,
  TopErrorItem,
} from "./operationsTypes";

interface OperationsDebugSectionProps {
  errorCodeBreakdown: ErrorCodeBreakdownItem[];
  latencyBandData: LatencyBandDatum[];
  topErrors: TopErrorItem[];
  slowRequests: RequestLogEntry[];
  costlyRequests: RequestLogEntry[];
  newLogIds: Set<number>;
  clearNewLogHighlight: (logId: number) => void;
  reportSymbol: string;
  reportCode: string;
  requestLogsPath: RequestLogsPathBuilder;
}

function InvestigateRequestRow({
  item,
  metric,
  newLogIds,
  clearNewLogHighlight,
}: {
  item: RequestLogEntry;
  metric: ReactNode;
  newLogIds: Set<number>;
  clearNewLogHighlight: (logId: number) => void;
}) {
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
          {item.provider_type} · {item.status_code}
        </p>
      </div>
      <span className="shrink-0 text-xs font-medium">{metric}</span>
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
  requestLogsPath,
}: OperationsDebugSectionProps) {
  const navigate = useNavigate();
  const [investigateTab, setInvestigateTab] = useState<InvestigateTab>("errors");

  return (
    <div className="space-y-3">
      <OperationsSectionTitle
        title="Debug"
        icon={Search}
        iconClassName="h-4 w-4 text-slate-600"
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <OperationsChartCard title="Latency Distribution" heightClassName="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={latencyBandData} onClick={() => navigate(requestLogsPath())}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="band" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" allowDecimals={false} />
              <RechartsTooltip contentStyle={OPERATIONS_CHART_TOOLTIP_STYLE} />
              <Bar dataKey="count" fill="var(--chart-4)" radius={[4, 4, 0, 0]} maxBarSize={44} />
            </BarChart>
          </ResponsiveContainer>
        </OperationsChartCard>

        <OperationsChartCard title="Top HTTP Errors" heightClassName="space-y-3">
          {errorCodeBreakdown.length === 0 ? (
            <p className="text-xs text-muted-foreground">No HTTP errors in this slice.</p>
          ) : (
            errorCodeBreakdown.map((item) => (
              <div key={item.status} className="flex items-center justify-between rounded-md border px-3 py-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium">{item.status}</span>
                </div>
                <span className="text-xs text-muted-foreground">{item.count.toLocaleString()} events</span>
              </div>
            ))
          )}
        </OperationsChartCard>
      </div>

      <OperationsChartCard title="Investigate" heightClassName="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={investigateTab === "errors" ? "default" : "outline"}
            onClick={() => setInvestigateTab("errors")}
          >
            Errors
          </Button>
          <Button
            size="sm"
            variant={investigateTab === "slow" ? "default" : "outline"}
            onClick={() => setInvestigateTab("slow")}
          >
            Slow
          </Button>
          <Button
            size="sm"
            variant={investigateTab === "costly" ? "default" : "outline"}
            onClick={() => setInvestigateTab("costly")}
          >
            Costly
          </Button>
        </div>

        {investigateTab === "errors" ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">Most frequent error signatures for this filter set.</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(requestLogsPath({ outcome_filter: "error" }))}
              >
                Open Request Logs
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>

            {topErrors.length === 0 ? (
              <p className="text-xs text-muted-foreground">No error signatures found.</p>
            ) : (
              topErrors.map((item, index) => (
                <div
                  key={`${item.statusCode}-${index}`}
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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">Slowest requests by latency in current filtered slice.</p>
              <Button size="sm" variant="outline" onClick={() => navigate(requestLogsPath())}>
                Open Request Logs
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>

            {slowRequests.length === 0 ? (
              <p className="text-xs text-muted-foreground">No requests found.</p>
            ) : (
              slowRequests.map((item) => (
                <InvestigateRequestRow
                  key={item.id}
                  item={item}
                  metric={`${item.response_time_ms.toLocaleString()}ms`}
                  newLogIds={newLogIds}
                  clearNewLogHighlight={clearNewLogHighlight}
                />
              ))
            )}
          </div>
        ) : null}

        {investigateTab === "costly" ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">Highest-cost requests in current filtered slice.</p>
              <Button size="sm" variant="outline" onClick={() => navigate(requestLogsPath())}>
                Open Request Logs
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>

            {costlyRequests.length === 0 ? (
              <p className="text-xs text-muted-foreground">No cost records found.</p>
            ) : (
              costlyRequests.map((item) => (
                <InvestigateRequestRow
                  key={item.id}
                  item={item}
                  metric={formatMoneyMicros(item.total_cost_user_currency_micros ?? 0, reportSymbol, reportCode)}
                  newLogIds={newLogIds}
                  clearNewLogHighlight={clearNewLogHighlight}
                />
              ))
            )}
          </div>
        ) : null}
      </OperationsChartCard>
    </div>
  );
}
