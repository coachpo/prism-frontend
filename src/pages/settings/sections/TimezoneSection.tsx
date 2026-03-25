import type { ReactNode } from "react";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/i18n/useLocale";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CostingSettingsUpdate } from "@/lib/types";

interface TimezoneSectionProps {
  timezoneDirty: boolean;
  renderSectionSaveState: (section: "billing" | "timezone", isDirty: boolean) => ReactNode;
  handleSaveCostingSettings: (section: "billing" | "timezone") => Promise<void>;
  costingUnavailable: boolean;
  costingLoading: boolean;
  costingSaving: boolean;
  costingForm: CostingSettingsUpdate;
  setCostingForm: React.Dispatch<React.SetStateAction<CostingSettingsUpdate>>;
  timezonePreviewText: string;
  timezonePreviewZone: string;
}

export function TimezoneSection({
  timezoneDirty,
  renderSectionSaveState,
  handleSaveCostingSettings,
  costingUnavailable,
  costingLoading,
  costingSaving,
  costingForm,
  setCostingForm,
  timezonePreviewText,
  timezonePreviewZone,
}: TimezoneSectionProps) {
  const { locale } = useLocale();
  return (
    <section id="timezone" tabIndex={-1} className="scroll-mt-24">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4" />
                {locale === "zh-CN" ? "时区" : "Timezone"}
              </CardTitle>
              <CardDescription className="text-xs">
                {locale === "zh-CN"
                  ? "时区偏好会影响整个仪表盘中的时间戳显示。"
                  : "Timezone preference affects timestamp rendering across the dashboard."}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {renderSectionSaveState("timezone", timezoneDirty)}
              <Button
                type="button"
                size="sm"
                onClick={() => void handleSaveCostingSettings("timezone")}
                disabled={
                  costingUnavailable ||
                  costingLoading ||
                  costingSaving ||
                  !timezoneDirty
                }
              >
                {costingSaving
                  ? locale === "zh-CN"
                    ? "保存中..."
                    : "Saving..."
                  : locale === "zh-CN"
                    ? "保存时区"
                    : "Save timezone"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {costingUnavailable ? (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
              {locale === "zh-CN" ? "设置 API 当前不可用。" : "Settings API is currently unavailable."}
            </div>
          ) : costingLoading ? (
            <div className="space-y-2">
              <div className="h-9 animate-pulse rounded bg-muted" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{locale === "zh-CN" ? "时区偏好" : "Timezone preference"}</Label>
                  <Select
                    value={costingForm.timezone_preference || "auto"}
                    onValueChange={(value) =>
                      setCostingForm((prev) => ({
                        ...prev,
                        timezone_preference: value === "auto" ? null : value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={locale === "zh-CN" ? "选择时区" : "Select timezone"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">
                        {locale === "zh-CN"
                          ? `自动（浏览器：${Intl.DateTimeFormat().resolvedOptions().timeZone})`
                          : `Auto (Browser: ${Intl.DateTimeFormat().resolvedOptions().timeZone})`}
                      </SelectItem>
                      {Intl.supportedValuesOf("timeZone").map((timezone) => (
                        <SelectItem key={timezone} value={timezone}>
                          {timezone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                {locale === "zh-CN"
                  ? `示例时间戳：${timezonePreviewText}（${timezonePreviewZone}）`
                  : `Example timestamp: ${timezonePreviewText} (${timezonePreviewZone})`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
