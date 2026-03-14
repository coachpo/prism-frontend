import type { RefObject } from "react";
import { Ban, Lock, Pencil, Plus, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { HeaderBlocklistRule, Provider } from "@/lib/types";
import { AuditConfigurationProviderToggles } from "./AuditConfigurationProviderToggles";
import { AuditConfigurationRuleSection } from "./AuditConfigurationRuleSection";

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
              Audit & Privacy
            </CardTitle>
            <CardDescription className="text-xs">
              Configure provider-level audit capture and privacy defaults.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Audit:</span> Record request/response
              metadata.
            </p>
            <p>
              <span className="font-medium text-foreground">Bodies:</span> Include request/response
              bodies (sensitive).
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
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Ban className="h-4 w-4" />
                Header Blocklist
              </CardTitle>
              <CardDescription className="text-xs">
                Strips headers before sending upstream.
              </CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={openAddRuleDialog}>
              <Plus className="mr-2 h-3.5 w-3.5" />
              Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Use header rules to block privacy, tunnel, and tracing metadata from provider requests.
          </p>

          {loadingRules ? (
            <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">
              Loading rules...
            </div>
          ) : (
            <>
              <AuditConfigurationRuleSection
                emptyState="No system rules found."
                icon={<Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                locked
                open={systemRulesOpen}
                rules={systemRules}
                title="System rules (locked)"
                onOpenChange={setSystemRulesOpen}
              />

              <AuditConfigurationRuleSection
                emptyState="No custom rules. Add one to strip private headers before forwarding."
                icon={<Pencil className="h-3.5 w-3.5 text-muted-foreground" />}
                locked={false}
                open={userRulesOpen}
                rules={customRules}
                title="Custom rules"
                onOpenChange={setUserRulesOpen}
                onToggleRule={handleToggleRule}
                onEditRule={openEditRuleDialog}
                onDeleteRule={setDeleteRuleConfirm}
              />
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
