import { Lock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TypeBadge } from "@/components/StatusBadge";
import type { HeaderBlocklistRule } from "@/lib/types";
import { AuditConfigurationRuleActions } from "./AuditConfigurationRuleActions";

interface AuditConfigurationRuleTableProps {
  locked: boolean;
  rules: HeaderBlocklistRule[];
  onToggleRule?: (rule: HeaderBlocklistRule, checked: boolean) => Promise<void>;
  onEditRule?: (rule: HeaderBlocklistRule) => void;
  onDeleteRule?: (rule: HeaderBlocklistRule) => void;
}

export function AuditConfigurationRuleTable({
  locked,
  rules,
  onToggleRule,
  onEditRule,
  onDeleteRule,
}: AuditConfigurationRuleTableProps) {
  return (
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
          {rules.map((rule) => (
            <TableRow key={rule.id}>
              <TableCell>
                <Switch
                  checked={rule.enabled}
                  disabled={locked}
                  onCheckedChange={
                    locked || !onToggleRule ? undefined : (checked) => void onToggleRule(rule, checked)
                  }
                  className={locked ? undefined : "data-[state=checked]:bg-emerald-500"}
                />
              </TableCell>
              <TableCell className="font-medium">
                <div className="inline-flex items-center gap-2">
                  {rule.name}
                  {locked ? <Lock className="h-3 w-3 text-muted-foreground" /> : null}
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
                <AuditConfigurationRuleActions
                  locked={locked}
                  rule={rule}
                  onEditRule={onEditRule}
                  onDeleteRule={onDeleteRule}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
