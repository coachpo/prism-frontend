import { PageHeader } from "@/components/PageHeader";
import { useProfileContext } from "@/context/ProfileContext";
import { useLocale } from "@/i18n/useLocale";
import { MonitoringOverviewGroups } from "./monitoring/MonitoringOverviewGroups";
import { useMonitoringOverviewData } from "./monitoring/useMonitoringOverviewData";

export function MonitoringPage() {
  const { revision, selectedProfileId } = useProfileContext();
  const { formatRelativeTimeFromNow, messages } = useLocale();
  const data = useMonitoringOverviewData({ revision, selectedProfileId });
  const copy = messages.monitoring;

  return (
    <div className="space-y-6">
      <PageHeader title={copy.monitoringTitle} description={copy.monitoringDescription} />

      {data.data ? (
        <p className="text-sm text-muted-foreground">
          {copy.generatedAt(formatRelativeTimeFromNow(data.data.generated_at))}
        </p>
      ) : null}

      {data.error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {data.error}
        </div>
      ) : null}

      <MonitoringOverviewGroups vendors={data.data?.vendors ?? []} />
    </div>
  );
}
