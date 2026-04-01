import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { useProfileContext } from "@/context/ProfileContext";
import { useLocale } from "@/i18n/useLocale";
import { MonitoringOverviewGroups } from "./monitoring/MonitoringOverviewGroups";
import { useMonitoringOverviewData } from "./monitoring/useMonitoringOverviewData";

export function MonitoringPage() {
  const { revision, selectedProfileId } = useProfileContext();
  const { messages } = useLocale();
  const data = useMonitoringOverviewData({ revision, selectedProfileId });
  const copy = messages.monitoring;

  return (
    <div className="space-y-6">
      <PageHeader title={copy.monitoringTitle} description={copy.monitoringDescription}>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={() => void data.refresh()}
          disabled={data.loading}
          aria-label={copy.refresh}
          title={copy.refresh}
        >
          <RefreshCw className={`h-4 w-4 ${data.loading ? "animate-spin" : ""}`} />
        </Button>
      </PageHeader>

      {data.error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {data.error}
        </div>
      ) : null}

      <MonitoringOverviewGroups vendors={data.data?.vendors ?? []} />
    </div>
  );
}
