import { AlertCircle, ExternalLink, FileJson, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoneyMicros, formatTokenCount } from "@/lib/costing";
import type { RequestLogEntry } from "@/lib/types";
import {
  UNIVERSAL_TIMESTAMP_FORMAT,
  getDisplayCurrency,
} from "./formatters";
import { DetailMetric, DetailSection } from "./RequestLogDetailShared";

interface RequestLogOverviewTabProps {
  selectedLog: RequestLogEntry;
  formatTime: (date: string, options?: Intl.DateTimeFormatOptions) => string;
  refineRequestContext: () => void;
  focusConnectionOnly: () => void;
  openConnectionDetails: () => void;
  exportSelectedLog: () => void;
}

export function RequestLogOverviewTab({
  selectedLog,
  formatTime,
  refineRequestContext,
  focusConnectionOnly,
  openConnectionDetails,
  exportSelectedLog,
}: RequestLogOverviewTabProps) {
  const displayCurrency = getDisplayCurrency(selectedLog);

  const timelineEvents = [
    {
      label: "Request received",
      value: formatTime(selectedLog.created_at, UNIVERSAL_TIMESTAMP_FORMAT),
      tone: "bg-primary/80",
    },
    {
      label: "Connection selected",
      value: selectedLog.connection_id
        ? `${selectedLog.endpoint_description || "Connection"} (#${selectedLog.connection_id})`
        : selectedLog.endpoint_description || "No connection metadata",
      tone: "bg-sky-500/80",
    },
    {
      label: "Provider execution",
      value: `${selectedLog.provider_type} completed in ${selectedLog.response_time_ms.toFixed(0)}ms`,
      tone: "bg-amber-500/80",
    },
    {
      label: "Response returned",
      value: `HTTP ${selectedLog.status_code} sent back to the client`,
      tone: selectedLog.status_code < 400 ? "bg-emerald-500/80" : "bg-rose-500/80",
    },
  ];

  return (
    <div className="space-y-4">
      {selectedLog.status_code >= 400 ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4" role="alert">
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-destructive">
            <AlertCircle className="h-4 w-4" />
            Status & Error Payload
          </h4>
          <pre className="whitespace-pre-wrap text-xs font-mono text-destructive/90">
            {selectedLog.error_detail || "No error payload provided"}
          </pre>
        </div>
      ) : null}

      <DetailSection
        title="Request timeline"
        description="A concise narrative of how Prism routed and completed this request."
      >
        <div className="space-y-3">
          {timelineEvents.map((event, index) => (
            <div key={event.label} className="flex gap-3">
              <div className="flex w-6 flex-col items-center">
                <span className={`mt-1 h-2.5 w-2.5 rounded-full ${event.tone}`} />
                {index < timelineEvents.length - 1 ? <span className="mt-1 h-full w-px bg-border" /> : null}
              </div>
              <div className="pb-3">
                <p className="text-sm font-medium text-foreground">{event.label}</p>
                <p className="text-sm text-muted-foreground">{event.value}</p>
              </div>
            </div>
          ))}
        </div>
      </DetailSection>

      <DetailSection
        title="Token breakdown"
        description="Usage, cache activity, and reasoning volume for this request."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <DetailMetric label="Input tokens" value={formatTokenCount(selectedLog.input_tokens)} />
          <DetailMetric label="Output tokens" value={formatTokenCount(selectedLog.output_tokens)} />
          <DetailMetric label="Cached tokens" value={formatTokenCount(selectedLog.cache_read_input_tokens)} />
          <DetailMetric
            label="Cache create tokens"
            value={formatTokenCount(selectedLog.cache_creation_input_tokens)}
          />
          <DetailMetric label="Reasoning tokens" value={formatTokenCount(selectedLog.reasoning_tokens)} />
          <DetailMetric label="Total tokens" value={formatTokenCount(selectedLog.total_tokens)} />
        </div>
      </DetailSection>

      <DetailSection
        title="Cost breakdown"
        description="Snapshot pricing values captured for the selected profile currency."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <DetailMetric
            label="Input cost"
            value={formatMoneyMicros(selectedLog.input_cost_micros, displayCurrency.symbol)}
          />
          <DetailMetric
            label="Output cost"
            value={formatMoneyMicros(selectedLog.output_cost_micros, displayCurrency.symbol)}
          />
          <DetailMetric
            label="Cached cost"
            value={formatMoneyMicros(selectedLog.cache_read_input_cost_micros, displayCurrency.symbol)}
          />
          <DetailMetric
            label="Cache create cost"
            value={formatMoneyMicros(
              selectedLog.cache_creation_input_cost_micros,
              displayCurrency.symbol
            )}
          />
          <DetailMetric
            label="Reasoning cost"
            value={formatMoneyMicros(selectedLog.reasoning_cost_micros, displayCurrency.symbol)}
          />
          <DetailMetric
            label="Total cost"
            value={formatMoneyMicros(
              selectedLog.total_cost_user_currency_micros,
              displayCurrency.symbol,
              displayCurrency.code,
              2,
              6
            )}
          />
        </div>
      </DetailSection>

      <DetailSection
        title="Routing metadata"
        description="The request path and pricing snapshot that powered this result."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <DetailMetric
            label="Endpoint ID"
            value={selectedLog.endpoint_id ? `#${selectedLog.endpoint_id}` : "-"}
          />
          <DetailMetric
            label="Pricing config"
            value={
              selectedLog.pricing_config_version_used == null
                ? "-"
                : `v${selectedLog.pricing_config_version_used}`
            }
          />
          <DetailMetric label="Request path" value={selectedLog.request_path} />
          <DetailMetric
            label="Connection ID"
            value={selectedLog.connection_id ? `#${selectedLog.connection_id}` : "-"}
          />
        </div>
      </DetailSection>

      <DetailSection
        title="Actions"
        description="Keep investigating without leaving the request timeline."
      >
        <div className="grid gap-2 md:grid-cols-2">
          <Button variant="outline" className="justify-start" onClick={refineRequestContext}>
            <Search className="mr-2 h-4 w-4" />
            Find similar traffic
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            onClick={focusConnectionOnly}
            disabled={!selectedLog.connection_id}
          >
            <Filter className="mr-2 h-4 w-4" />
            Show only this connection
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            onClick={openConnectionDetails}
            disabled={!selectedLog.connection_id}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open connection details
          </Button>
          <Button variant="outline" className="justify-start" onClick={exportSelectedLog}>
            <FileJson className="mr-2 h-4 w-4" />
            Export request JSON
          </Button>
        </div>
      </DetailSection>
    </div>
  );
}
