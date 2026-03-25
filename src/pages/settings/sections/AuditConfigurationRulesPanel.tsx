import { Lock, Pencil, Plus } from "lucide-react";
import { useLocale } from "@/i18n/useLocale";
import { Button } from "@/components/ui/button";
import type { HeaderBlocklistRule } from "@/lib/types";
import { AuditConfigurationRuleSection } from "./AuditConfigurationRuleSection";

interface AuditConfigurationRulesPanelProps {
  customRules: HeaderBlocklistRule[];
  loadingRules: boolean;
  onDeleteRule: (rule: HeaderBlocklistRule | null) => void;
  onEditRule: (rule: HeaderBlocklistRule) => void;
  onOpenAddRuleDialog: () => void;
  onOpenChangeSystemRules: (open: boolean) => void;
  onOpenChangeUserRules: (open: boolean) => void;
  onToggleRule: (rule: HeaderBlocklistRule, checked: boolean) => Promise<void>;
  systemRules: HeaderBlocklistRule[];
  systemRulesOpen: boolean;
  userRulesOpen: boolean;
}

export function AuditConfigurationRulesPanel({
  customRules,
  loadingRules,
  onDeleteRule,
  onEditRule,
  onOpenAddRuleDialog,
  onOpenChangeSystemRules,
  onOpenChangeUserRules,
  onToggleRule,
  systemRules,
  systemRulesOpen,
  userRulesOpen,
}: AuditConfigurationRulesPanelProps) {
  const { locale } = useLocale();
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {locale === "zh-CN"
            ? "使用请求头规则屏蔽隐私、隧道和追踪元数据，避免其发送到提供商。"
            : "Use header rules to block privacy, tunnel, and tracing metadata from provider requests."}
        </p>
        <Button size="sm" variant="outline" onClick={onOpenAddRuleDialog}>
          <Plus className="mr-2 h-3.5 w-3.5" />
          {locale === "zh-CN" ? "新增规则" : "Add Rule"}
        </Button>
      </div>

      {loadingRules ? (
        <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
          {locale === "zh-CN" ? "正在加载规则..." : "Loading rules..."}
        </div>
      ) : (
        <>
          <AuditConfigurationRuleSection
            emptyState={locale === "zh-CN" ? "未找到系统规则。" : "No system rules found."}
            icon={<Lock className="h-3.5 w-3.5 text-muted-foreground" />}
            locked
            open={systemRulesOpen}
            rules={systemRules}
            title={locale === "zh-CN" ? "系统规则（锁定）" : "System rules (locked)"}
            onOpenChange={onOpenChangeSystemRules}
          />

          <AuditConfigurationRuleSection
            emptyState={
              locale === "zh-CN"
                ? "当前没有自定义规则。新增一条规则即可在转发前移除隐私请求头。"
                : "No custom rules. Add one to strip private headers before forwarding."
            }
            icon={<Pencil className="h-3.5 w-3.5 text-muted-foreground" />}
            locked={false}
            open={userRulesOpen}
            rules={customRules}
            title={locale === "zh-CN" ? "自定义规则" : "Custom rules"}
            onOpenChange={onOpenChangeUserRules}
            onToggleRule={onToggleRule}
            onEditRule={onEditRule}
            onDeleteRule={onDeleteRule}
          />
        </>
      )}
    </>
  );
}
