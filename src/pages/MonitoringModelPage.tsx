import { useParams } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { useProfileContext } from "@/context/ProfileContext";
import { useLocale } from "@/i18n/useLocale";
import { MonitoringModelConnectionsTable } from "./monitoring/MonitoringModelConnectionsTable";
import { MonitoringModelHistoryCard } from "./monitoring/MonitoringModelHistoryCard";
import { useMonitoringModelData } from "./monitoring/useMonitoringModelData";

export function MonitoringModelPage() {
  const params = useParams<{ modelConfigId: string }>();
  const { revision, selectedProfileId } = useProfileContext();
  const { formatRelativeTimeFromNow, messages } = useLocale();
  const modelConfigId = params.modelConfigId ? Number.parseInt(params.modelConfigId, 10) : null;
  const data = useMonitoringModelData({ modelConfigId, revision, selectedProfileId });
  const copy = messages.monitoring;

  return (
    <div className="space-y-6">
      <PageHeader
        title={data.data?.display_name ?? data.data?.model_id ?? copy.modelMonitoringTitle}
        description={copy.modelMonitoringDescription}
      >
        <Button type="button" variant="outline" onClick={() => void data.refresh()} disabled={data.loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${data.loading ? "animate-spin" : ""}`} />
          {copy.refresh}
        </Button>
      </PageHeader>

      {data.data ? (
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>{copy.generatedAt(formatRelativeTimeFromNow(data.data.generated_at))}</p>
          <p>{copy.vendorLabel(data.data.vendor_name)}</p>
        </div>
      ) : null}

      {data.manualProbeResult ? (
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
          {copy.lastProbeSummary(
            String(data.manualProbeResult.connection_id),
            formatRelativeTimeFromNow(data.manualProbeResult.checked_at),
            data.manualProbeResult.detail,
          )}
        </div>
      ) : null}

      {data.error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {data.error}
        </div>
      ) : null}

      <MonitoringModelConnectionsTable
        connections={data.data?.connections ?? []}
        onManualProbe={(connectionId) => {
          void data.handleManualProbe(connectionId);
        }}
        probingConnectionIds={data.probingConnectionIds}
      />
      <MonitoringModelHistoryCard connections={data.data?.connections ?? []} />
    </div>
  );
}
