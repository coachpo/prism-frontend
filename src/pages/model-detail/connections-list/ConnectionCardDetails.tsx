import { Loader2 } from "lucide-react";
import { useLocale } from "@/i18n/useLocale";
import { StatusBadge } from "@/components/StatusBadge";
import type { Connection, LoadbalanceCurrentStateItem } from "@/lib/types";
import { formatLabel } from "@/lib/utils";
import type { FormatTime } from "./connectionCardTypes";

export function ConnectionCardDetails({
  connection,
  formatTime,
  isChecking,
  loadbalanceCurrentState,
}: {
  connection: Connection;
  formatTime: FormatTime;
  isChecking: boolean;
  loadbalanceCurrentState: LoadbalanceCurrentStateItem | undefined;
}) {
  const { formatNumber, messages } = useLocale();
  const copy = messages.modelDetail;
  const endpoint = connection.endpoint;
  const maskedKey = endpoint?.masked_api_key || "......";
  const endpointPing = loadbalanceCurrentState?.endpoint_ping_ewma_ms;
  const conversationDelay = loadbalanceCurrentState?.conversation_delay_ewma_ms;
  const liveP95 = loadbalanceCurrentState?.live_p95_latency_ms;

  return (
    <>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="truncate font-medium">{endpoint?.name ?? copy.unknownEndpoint}</span>
        <span className="text-muted-foreground/70">.</span>
        <span className="font-mono break-all">{endpoint?.base_url}</span>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{copy.keyLabel}: {maskedKey}</span>
        {isChecking ? (
          <span className="inline-flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            {copy.checkingNow}
          </span>
        ) : connection.last_health_check ? (
          <span>
            {copy.checkedAt(
              formatTime(connection.last_health_check, {
                hour: "numeric",
                minute: "numeric",
                second: "numeric",
              }),
            )}
          </span>
        ) : (
          <span>{copy.notCheckedYet}</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {loadbalanceCurrentState?.circuit_state ? (
          <StatusBadge
            label={formatLabel(loadbalanceCurrentState.circuit_state)}
            intent={getMonitoringIntent(loadbalanceCurrentState.circuit_state)}
          />
        ) : null}
      </div>

      {loadbalanceCurrentState ? (
        <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 xl:grid-cols-3">
          <MonitoringEvidence label={copy.endpointMonitoringValue(formatMetric(endpointPing, formatNumber))} />
          <MonitoringEvidence label={copy.conversationMonitoringValue(formatMetric(conversationDelay, formatNumber))} />
          <MonitoringEvidence label={copy.p95MonitoringValue(formatMetric(liveP95, formatNumber))} />
          {loadbalanceCurrentState.last_live_success_at ? (
            <MonitoringEvidence
              label={copy.lastLiveSuccessAt(formatTime(loadbalanceCurrentState.last_live_success_at))}
            />
          ) : null}
          {loadbalanceCurrentState.last_live_failure_kind ? (
            <MonitoringEvidence
              label={copy.lastLiveFailureKind(formatLabel(loadbalanceCurrentState.last_live_failure_kind))}
            />
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function MonitoringEvidence({ label }: { label: string }) {
  return <span className="rounded-md border bg-muted/20 px-2.5 py-1.5">{label}</span>;
}

function formatMetric(
  value: number | null | undefined,
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string,
) {
  return typeof value === "number" ? `${formatNumber(value)} ms` : "—";
}

function getMonitoringIntent(status: string | null | undefined) {
  if (status === "healthy" || status === "closed") {
    return "success" as const;
  }

  if (status === "degraded" || status === "half_open" || status === "probe_eligible") {
    return "warning" as const;
  }

  if (status === "failed" || status === "open" || status === "banned") {
    return "danger" as const;
  }

  return "muted" as const;
}
