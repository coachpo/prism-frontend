import { useParams } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { useProfileContext } from "@/context/ProfileContext";
import { useLocale } from "@/i18n/useLocale";
import { MonitoringVendorModelsTable } from "./monitoring/MonitoringVendorModelsTable";
import { useMonitoringVendorData } from "./monitoring/useMonitoringVendorData";

export function MonitoringVendorPage() {
  const params = useParams<{ vendorId: string }>();
  const { revision, selectedProfileId } = useProfileContext();
  const { formatRelativeTimeFromNow, messages } = useLocale();
  const vendorId = params.vendorId ? Number.parseInt(params.vendorId, 10) : null;
  const data = useMonitoringVendorData({ revision, selectedProfileId, vendorId });
  const copy = messages.monitoring;

  return (
    <div className="space-y-6">
      <PageHeader
        title={data.data?.vendor_name ?? copy.vendorMonitoringTitle}
        description={copy.vendorMonitoringDescription}
      >
        <Button type="button" variant="outline" onClick={() => void data.refresh()} disabled={data.loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${data.loading ? "animate-spin" : ""}`} />
          {copy.refresh}
        </Button>
      </PageHeader>

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

      <MonitoringVendorModelsTable models={data.data?.models ?? []} />
    </div>
  );
}
