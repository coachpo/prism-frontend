import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useLocale } from "@/i18n/useLocale";
import type { Vendor } from "@/lib/types";

interface AuditConfigurationVendorTogglesProps {
  vendors: Vendor[];
  toggleAudit: (vendorId: number, checked: boolean) => Promise<void>;
  toggleBodies: (vendorId: number, checked: boolean) => Promise<void>;
}

export function AuditConfigurationVendorToggles({
  vendors,
  toggleAudit,
  toggleBodies,
}: AuditConfigurationVendorTogglesProps) {
  const { locale } = useLocale();
  return (
    <div className="space-y-3">
      {vendors.map((vendor) => {
        const auditStatus = vendor.audit_enabled ? (locale === "zh-CN" ? "开启" : "On") : locale === "zh-CN" ? "关闭" : "Off";
        const bodiesStatus = vendor.audit_capture_bodies ? (locale === "zh-CN" ? "开启" : "On") : locale === "zh-CN" ? "关闭" : "Off";

        return (
          <div key={vendor.id} className="rounded-lg border p-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-sm font-medium">{vendor.name}</div>
              </div>

              <div className="flex flex-col items-start gap-2 md:items-end">
                <p className="text-xs text-muted-foreground">
                  {locale === "zh-CN" ? "审计" : "Audit"}: {auditStatus} · {locale === "zh-CN" ? "正文" : "Bodies"}: {bodiesStatus}
                </p>
                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`audit-${vendor.id}`}
                      checked={vendor.audit_enabled}
                      onCheckedChange={(checked) => void toggleAudit(vendor.id, checked)}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                    <Label htmlFor={`audit-${vendor.id}`} className="text-xs">
                      {locale === "zh-CN" ? "审计" : "Audit"}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`bodies-${vendor.id}`}
                      checked={vendor.audit_capture_bodies}
                      onCheckedChange={(checked) => void toggleBodies(vendor.id, checked)}
                      disabled={!vendor.audit_enabled}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                    <Label htmlFor={`bodies-${vendor.id}`} className="text-xs">
                      {locale === "zh-CN" ? "正文" : "Bodies"}
                    </Label>
                  </div>
                </div>
              </div>
            </div>
            {vendor.audit_enabled && vendor.audit_capture_bodies ? (
              <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                {locale === "zh-CN" ? "可能会捕获提示词/输出。" : "May capture prompts/outputs."}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
