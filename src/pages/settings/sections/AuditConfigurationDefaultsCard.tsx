import type { RefObject } from "react";
import { Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/i18n/useLocale";
import type { Vendor } from "@/lib/types";
import { AuditConfigurationVendorToggles } from "./AuditConfigurationVendorToggles";

interface AuditConfigurationDefaultsCardProps {
  cardRef?: RefObject<HTMLDivElement | null>;
  className?: string;
  vendors: Vendor[];
  toggleAudit: (vendorId: number, checked: boolean) => Promise<void>;
  toggleBodies: (vendorId: number, checked: boolean) => Promise<void>;
}

export function AuditConfigurationDefaultsCard({
  cardRef,
  className,
  vendors,
  toggleAudit,
  toggleBodies,
}: AuditConfigurationDefaultsCardProps) {
  const { locale } = useLocale();

  return (
    <Card ref={cardRef} tabIndex={-1} className={className}>
      <CardHeader className="pb-3">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4" />
            {locale === "zh-CN" ? "审计与隐私" : "Audit & Privacy"}
          </CardTitle>
          <CardDescription className="text-xs">
            {locale === "zh-CN"
              ? "配置供应商级别的审计捕获和隐私默认值。"
              : "Configure vendor-level audit capture and privacy defaults."}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">{locale === "zh-CN" ? "审计：" : "Audit:"}</span>{" "}
            {locale === "zh-CN" ? "记录请求/响应元数据。" : "Record request/response metadata."}
          </p>
          <p>
            <span className="font-medium text-foreground">{locale === "zh-CN" ? "正文：" : "Bodies:"}</span>{" "}
            {locale === "zh-CN" ? "包含请求/响应正文（敏感）。" : "Include request/response bodies (sensitive)."}
          </p>
        </div>

        {vendors.length === 0 ? (
          <div className="rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">
            {locale === "zh-CN" ? "暂无可用供应商。" : "No vendors available."}
          </div>
        ) : (
          <AuditConfigurationVendorToggles
            vendors={vendors}
            toggleAudit={toggleAudit}
            toggleBodies={toggleBodies}
          />
        )}
      </CardContent>
    </Card>
  );
}
