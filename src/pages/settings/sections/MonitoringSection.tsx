import type { ReactNode } from "react";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/i18n/useLocale";

interface MonitoringSectionProps {
  handleSaveMonitoringSettings: () => Promise<void>;
  monitoringDirty: boolean;
  monitoringError: string | null;
  monitoringIntervalSeconds: string;
  monitoringLoading: boolean;
  monitoringSaving: boolean;
  monitoringUnavailable: boolean;
  renderSectionSaveState: (section: "monitoring", isDirty: boolean) => ReactNode;
  setMonitoringIntervalSeconds: (value: string) => void;
}

export function MonitoringSection({
  handleSaveMonitoringSettings,
  monitoringDirty,
  monitoringError,
  monitoringIntervalSeconds,
  monitoringLoading,
  monitoringSaving,
  monitoringUnavailable,
  renderSectionSaveState,
  setMonitoringIntervalSeconds,
}: MonitoringSectionProps) {
  const { messages } = useLocale();
  const copy = messages.settingsMonitoring;

  return (
    <section id="monitoring" tabIndex={-1} className="scroll-mt-24">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4" />
                {copy.title}
              </CardTitle>
              <CardDescription className="text-xs">{copy.description}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {renderSectionSaveState("monitoring", monitoringDirty)}
              <Button
                type="button"
                size="sm"
                onClick={() => void handleSaveMonitoringSettings()}
                disabled={monitoringLoading || monitoringSaving || monitoringUnavailable || !monitoringDirty}
              >
                {monitoringSaving ? messages.pricingTemplateDialog.saving : copy.save}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {monitoringUnavailable ? (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
              {copy.unavailable}
            </div>
          ) : monitoringLoading ? (
            <div className="space-y-2">
              <div className="h-9 animate-pulse rounded bg-muted" />
            </div>
          ) : (
            <div className="grid gap-3 sm:max-w-sm">
              <div className="space-y-2">
                <Label htmlFor="monitoring-probe-interval-seconds">{copy.intervalLabel}</Label>
                <Input
                  id="monitoring-probe-interval-seconds"
                  type="number"
                  min={30}
                  max={3600}
                  step={1}
                  value={monitoringIntervalSeconds}
                  onChange={(event) => setMonitoringIntervalSeconds(event.currentTarget.value)}
                />
              </div>
              <p className="text-sm text-muted-foreground">{copy.intervalHint}</p>
              {monitoringError ? <p className="text-sm text-destructive">{monitoringError}</p> : null}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
