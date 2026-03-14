import { Clock } from "lucide-react";
import { ProviderIcon } from "@/components/ProviderIcon";
import { TypeBadge, ValueBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import {
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatMoneyMicros, formatTokenCount } from "@/lib/costing";
import type { RequestLogEntry } from "@/lib/types";
import {
  UNIVERSAL_TIMESTAMP_FORMAT,
  formatLatency,
  getDisplayCurrency,
} from "./formatters";
import { DetailMetric } from "./RequestLogDetailShared";

interface RequestLogDetailHeaderProps {
  selectedLog: RequestLogEntry;
  formatTime: (date: string, options?: Intl.DateTimeFormatOptions) => string;
}

export function RequestLogDetailHeader({
  selectedLog,
  formatTime,
}: RequestLogDetailHeaderProps) {
  const displayCurrency = getDisplayCurrency(selectedLog);

  return (
    <SheetHeader className="sticky top-0 z-20 space-y-4 border-b bg-background/95 p-6 backdrop-blur">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            #{selectedLog.id}
          </Badge>
          <Badge variant="secondary" className="gap-1 font-mono">
            <Clock className="h-3.5 w-3.5" />
            {formatLatency(selectedLog.response_time_ms)}
          </Badge>
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
          {selectedLog.is_stream ? <TypeBadge label="Stream" /> : null}
        </div>
      </div>

      <div className="space-y-2">
        <SheetTitle className="flex flex-wrap items-center gap-2 text-left text-xl font-mono text-foreground">
          {selectedLog.model_id}
        </SheetTitle>
        <SheetDescription className="flex flex-wrap items-center gap-2 text-sm">
          <ProviderIcon providerType={selectedLog.provider_type} size={14} />
          <span className="capitalize">{selectedLog.provider_type}</span>
          <span className="text-muted-foreground">•</span>
          <span>{selectedLog.endpoint_description || "Unknown endpoint"}</span>
          <span className="text-muted-foreground">•</span>
          <span className="font-mono">
            {formatTime(selectedLog.created_at, UNIVERSAL_TIMESTAMP_FORMAT)}
          </span>
        </SheetDescription>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <DetailMetric label="Latency" value={formatLatency(selectedLog.response_time_ms)} />
        <DetailMetric
          label="Total Cost"
          value={formatMoneyMicros(
            selectedLog.total_cost_user_currency_micros,
            displayCurrency.symbol,
            displayCurrency.code,
            2,
            6
          )}
        />
        <DetailMetric label="Total Tokens" value={formatTokenCount(selectedLog.total_tokens)} />
        <DetailMetric
          label="Connection"
          value={selectedLog.connection_id ? `#${selectedLog.connection_id}` : "-"}
        />
      </div>
    </SheetHeader>
  );
}
