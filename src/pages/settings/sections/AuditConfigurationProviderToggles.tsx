import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ProviderIcon } from "@/components/ProviderIcon";
import { useLocale } from "@/i18n/useLocale";
import type { Provider } from "@/lib/types";

interface AuditConfigurationProviderTogglesProps {
  providers: Provider[];
  toggleAudit: (providerId: number, checked: boolean) => Promise<void>;
  toggleBodies: (providerId: number, checked: boolean) => Promise<void>;
}

export function AuditConfigurationProviderToggles({
  providers,
  toggleAudit,
  toggleBodies,
}: AuditConfigurationProviderTogglesProps) {
  const { locale } = useLocale();
  return (
    <div className="space-y-3">
      {providers.map((provider) => {
        const auditStatus = provider.audit_enabled ? (locale === "zh-CN" ? "开启" : "On") : locale === "zh-CN" ? "关闭" : "Off";
        const bodiesStatus = provider.audit_capture_bodies ? (locale === "zh-CN" ? "开启" : "On") : locale === "zh-CN" ? "关闭" : "Off";

        return (
          <div key={provider.id} className="rounded-lg border p-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-sm font-medium">
                  <ProviderIcon providerType={provider.provider_type} size={14} />
                  {provider.name}
                </div>
              </div>

              <div className="flex flex-col items-start gap-2 md:items-end">
                <p className="text-xs text-muted-foreground">
                  {locale === "zh-CN" ? "审计" : "Audit"}: {auditStatus} · {locale === "zh-CN" ? "正文" : "Bodies"}: {bodiesStatus}
                </p>
                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`audit-${provider.id}`}
                      checked={provider.audit_enabled}
                      onCheckedChange={(checked) => void toggleAudit(provider.id, checked)}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                    <Label htmlFor={`audit-${provider.id}`} className="text-xs">
                      {locale === "zh-CN" ? "审计" : "Audit"}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`bodies-${provider.id}`}
                      checked={provider.audit_capture_bodies}
                      onCheckedChange={(checked) => void toggleBodies(provider.id, checked)}
                      disabled={!provider.audit_enabled}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                    <Label htmlFor={`bodies-${provider.id}`} className="text-xs">
                      {locale === "zh-CN" ? "正文" : "Bodies"}
                    </Label>
                  </div>
                </div>
              </div>
            </div>
            {provider.audit_enabled && provider.audit_capture_bodies ? (
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
