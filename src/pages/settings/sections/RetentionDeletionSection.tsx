import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/i18n/useLocale";
import { Label } from "@/components/ui/label";
import {
  type CleanupType,
  type RetentionPreset,
} from "../settingsPageHelpers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RetentionDeletionSectionProps {
  selectedProfileLabel: string;
  cleanupType: CleanupType;
  setCleanupType: (type: CleanupType) => void;
  retentionPreset: RetentionPreset;
  setRetentionPreset: (preset: RetentionPreset) => void;
  deleting: boolean;
  handleOpenDeleteConfirm: () => void;
}

export function RetentionDeletionSection({
  selectedProfileLabel,
  cleanupType,
  setCleanupType,
  retentionPreset,
  setRetentionPreset,
  deleting,
  handleOpenDeleteConfirm,
}: RetentionDeletionSectionProps) {
  const { locale } = useLocale();
  return (
    <section id="retention-deletion" tabIndex={-1} className="scroll-mt-24">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Trash2 className="h-4 w-4" />
            {locale === "zh-CN" ? "保留与删除" : "Retention & Deletion"}
          </CardTitle>
          <CardDescription className="text-xs">
            {locale === "zh-CN"
              ? `使用明确的保留期和确认控件删除 ${selectedProfileLabel} 中的历史数据。`
              : `Delete historical data in ${selectedProfileLabel} with explicit retention and confirmation controls.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>{locale === "zh-CN" ? "数据类型" : "Data type"}</Label>
              <Select
                value={cleanupType}
                onValueChange={(value) =>
                  setCleanupType(value as CleanupType)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={locale === "zh-CN" ? "选择数据类型" : "Select data type"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="requests">{locale === "zh-CN" ? "请求日志" : "Request Logs"}</SelectItem>
                  <SelectItem value="audits">{locale === "zh-CN" ? "审计日志" : "Audit Logs"}</SelectItem>
                  <SelectItem value="loadbalance_events">{locale === "zh-CN" ? "负载均衡事件" : "Loadbalance Events"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{locale === "zh-CN" ? "删除早于以下时间的数据" : "Delete data older than"}</Label>
              <Select
                value={retentionPreset}
                onValueChange={(value) =>
                  setRetentionPreset(value as RetentionPreset)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={locale === "zh-CN" ? "选择保留期" : "Select retention"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">{locale === "zh-CN" ? "7 天" : "7 days"}</SelectItem>
                  <SelectItem value="30">{locale === "zh-CN" ? "30 天" : "30 days"}</SelectItem>
                  <SelectItem value="90">{locale === "zh-CN" ? "90 天" : "90 days"}</SelectItem>
                  <SelectItem value="all" className="text-destructive">
                    {locale === "zh-CN" ? "全部数据" : "All data"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                disabled={deleting || !cleanupType || !retentionPreset}
                onClick={handleOpenDeleteConfirm}
              >
                {locale === "zh-CN" ? "删除数据" : "Delete data"}
              </Button>
            </div>
          </div>

          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {locale === "zh-CN"
              ? `这会删除 ${selectedProfileLabel} 中的数据且无法撤销。`
              : `This deletes data in ${selectedProfileLabel} and cannot be undone.`}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
