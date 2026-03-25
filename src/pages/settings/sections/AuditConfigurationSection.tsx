import type { RefObject } from "react";
import { Ban, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/i18n/useLocale";
import { cn } from "@/lib/utils";
import type { HeaderBlocklistRule, Provider } from "@/lib/types";
import { AuditConfigurationProviderToggles } from "./AuditConfigurationProviderToggles";
import { AuditConfigurationRulesPanel } from "./AuditConfigurationRulesPanel";

interface AuditConfigurationSectionProps {
  auditConfigurationRef: RefObject<HTMLDivElement | null>;
  isAuditConfigurationFocused: boolean;
  providers: Provider[];
  toggleAudit: (providerId: number, checked: boolean) => Promise<void>;
  toggleBodies: (providerId: number, checked: boolean) => Promise<void>;
  loadingRules: boolean;
  systemRulesOpen: boolean;
  setSystemRulesOpen: (open: boolean) => void;
  systemRules: HeaderBlocklistRule[];
  userRulesOpen: boolean;
  setUserRulesOpen: (open: boolean) => void;
  customRules: HeaderBlocklistRule[];
  handleToggleRule: (rule: HeaderBlocklistRule, checked: boolean) => Promise<void>;
  openAddRuleDialog: () => void;
  openEditRuleDialog: (rule: HeaderBlocklistRule) => void;
  setDeleteRuleConfirm: (rule: HeaderBlocklistRule | null) => void;
}

export function AuditConfigurationSection({
  auditConfigurationRef,
  isAuditConfigurationFocused,
  providers,
  toggleAudit,
  toggleBodies,
  loadingRules,
  systemRulesOpen,
  setSystemRulesOpen,
  systemRules,
  userRulesOpen,
  setUserRulesOpen,
  customRules,
  handleToggleRule,
  openAddRuleDialog,
  openEditRuleDialog,
  setDeleteRuleConfirm,
}: AuditConfigurationSectionProps) {
  const { locale } = useLocale();
  return (
    <section id="audit-configuration" tabIndex={-1} className="scroll-mt-24 space-y-4">
      <Card
        ref={auditConfigurationRef}
        tabIndex={-1}
        className={cn(
          "transition-all duration-300",
          isAuditConfigurationFocused && "ring-2 ring-primary/50 bg-primary/5"
        )}
      >
        <CardHeader className="pb-3">
          <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4" />
                {locale === "zh-CN" ? "审计与隐私" : "Audit & Privacy"}
              </CardTitle>
              <CardDescription className="text-xs">
                {locale === "zh-CN"
                  ? "配置提供商级别的审计捕获和隐私默认值。"
                  : "Configure provider-level audit capture and privacy defaults."}
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

          {providers.length === 0 ? (
            <div className="rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">
              No providers available.
            </div>
          ) : (
            <AuditConfigurationProviderToggles
              providers={providers}
              toggleAudit={toggleAudit}
              toggleBodies={toggleBodies}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Ban className="h-4 w-4" />
              {locale === "zh-CN" ? "请求头屏蔽列表" : "Header Blocklist"}
            </CardTitle>
            <CardDescription className="text-xs">
              {locale === "zh-CN" ? "在发送到上游之前移除指定请求头。" : "Strips headers before sending upstream."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <AuditConfigurationRulesPanel
            customRules={customRules}
            loadingRules={loadingRules}
            onDeleteRule={setDeleteRuleConfirm}
            onEditRule={openEditRuleDialog}
            onOpenAddRuleDialog={openAddRuleDialog}
            onOpenChangeSystemRules={setSystemRulesOpen}
            onOpenChangeUserRules={setUserRulesOpen}
            onToggleRule={handleToggleRule}
            systemRules={systemRules}
            systemRulesOpen={systemRulesOpen}
            userRulesOpen={userRulesOpen}
          />
        </CardContent>
      </Card>
    </section>
  );
}
