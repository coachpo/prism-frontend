import type { RefObject } from "react";
import { Ban, ChevronRight, Lock, Pencil, Plus, Shield, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProviderIcon } from "@/components/ProviderIcon";
import { TypeBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";
import type { HeaderBlocklistRule, Provider } from "@/lib/types";

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
            <div className="space-y-3">
              {providers.map((provider) => {
                const auditStatus = provider.audit_enabled ? "On" : "Off";
                const bodiesStatus = provider.audit_capture_bodies ? "On" : "Off";

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
                          Audit: {auditStatus} · Bodies: {bodiesStatus}
                        </p>
                        <div className="flex items-center gap-5">
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`audit-${provider.id}`}
                              checked={provider.audit_enabled}
                              onCheckedChange={(checked) =>
                                void toggleAudit(provider.id, checked)
                              }
                              className="data-[state=checked]:bg-emerald-500"
                            />
                            <Label htmlFor={`audit-${provider.id}`} className="text-xs">
                              Audit
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`bodies-${provider.id}`}
                              checked={provider.audit_capture_bodies}
                              onCheckedChange={(checked) =>
                                void toggleBodies(provider.id, checked)
                              }
                              disabled={!provider.audit_enabled}
                              className="data-[state=checked]:bg-emerald-500"
                            />
                            <Label htmlFor={`bodies-${provider.id}`} className="text-xs">
                              Bodies
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                    {provider.audit_enabled && provider.audit_capture_bodies && (
                      <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                        May capture prompts/outputs.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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
              <Collapsible open={systemRulesOpen} onOpenChange={setSystemRulesOpen}>
                <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-muted/50 transition-colors">
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 transition-transform",
                      systemRulesOpen && "rotate-90"
                    )}
                  />
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  System rules (locked)
                  <span className="text-xs text-muted-foreground">({systemRules.length})</span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {systemRules.length === 0 ? (
                    <div className="mt-1.5 rounded-md border px-3 py-3 text-sm text-muted-foreground">
                      No system rules found.
                    </div>
                  ) : (
                    <div className="mt-1.5 rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[90px]">Enabled</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Pattern</TableHead>
                            <TableHead className="w-[120px] text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {systemRules.map((rule) => (
                            <TableRow key={rule.id}>
                              <TableCell>
                                <Switch checked={rule.enabled} disabled />
                              </TableCell>
                              <TableCell className="font-medium">
                                <div className="inline-flex items-center gap-2">
                                  {rule.name}
                                  <Lock className="h-3 w-3 text-muted-foreground" />
                                </div>
                              </TableCell>
                              <TableCell>
                                <TypeBadge
                                  label={rule.match_type}
                                  intent={rule.match_type === "exact" ? "info" : "accent"}
                                />
                              </TableCell>
                              <TableCell>
                                <code className="rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                                  {rule.pattern}
                                </code>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    disabled
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>

              <Collapsible open={userRulesOpen} onOpenChange={setUserRulesOpen}>
                <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-muted/50 transition-colors">
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 transition-transform",
                      userRulesOpen && "rotate-90"
                    )}
                  />
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  Custom rules
                  <span className="text-xs text-muted-foreground">({customRules.length})</span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {customRules.length === 0 ? (
                    <div className="mt-1.5 rounded-md border px-3 py-3 text-sm text-muted-foreground">
                      No custom rules. Add one to strip private headers before forwarding.
                    </div>
                  ) : (
                    <div className="mt-1.5 rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[90px]">Enabled</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Pattern</TableHead>
                            <TableHead className="w-[120px] text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customRules.map((rule) => (
                            <TableRow key={rule.id}>
                              <TableCell>
                                <Switch
                                  checked={rule.enabled}
                                  onCheckedChange={(checked) =>
                                    void handleToggleRule(rule, checked)
                                  }
                                  className="data-[state=checked]:bg-emerald-500"
                                />
                              </TableCell>
                              <TableCell className="font-medium">{rule.name}</TableCell>
                              <TableCell>
                                <TypeBadge
                                  label={rule.match_type}
                                  intent={rule.match_type === "exact" ? "info" : "accent"}
                                />
                              </TableCell>
                              <TableCell>
                                <code className="rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                                  {rule.pattern}
                                </code>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => openEditRuleDialog(rule)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => setDeleteRuleConfirm(rule)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
