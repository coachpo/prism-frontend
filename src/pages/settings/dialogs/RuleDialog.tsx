import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/i18n/useLocale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SwitchController } from "@/components/SwitchController";
import type { HeaderBlocklistRule, HeaderBlocklistRuleCreate } from "@/lib/types";

interface RuleDialogProps {
  ruleDialogOpen: boolean;
  setRuleDialogOpen: (open: boolean) => void;
  editingRule: HeaderBlocklistRule | null;
  ruleForm: HeaderBlocklistRuleCreate;
  setRuleForm: React.Dispatch<React.SetStateAction<HeaderBlocklistRuleCreate>>;
  handleSaveRule: () => Promise<void>;
}

export function RuleDialog({
  ruleDialogOpen,
  setRuleDialogOpen,
  editingRule,
  ruleForm,
  setRuleForm,
  handleSaveRule,
}: RuleDialogProps) {
  const { locale } = useLocale();
  return (
    <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingRule ? (locale === "zh-CN" ? "编辑规则" : "Edit Rule") : locale === "zh-CN" ? "新增规则" : "Add Rule"}</DialogTitle>
          <DialogDescription>
            {editingRule
              ? locale === "zh-CN"
                ? "修改现有的自定义请求头屏蔽规则。"
                : "Modify an existing custom header blocklist rule."
              : locale === "zh-CN"
                ? "创建自定义规则，在请求发送到上游之前屏蔽指定请求头。"
                : "Create a custom rule to block headers before requests are sent upstream."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" aria-label="Why block headers" className="mt-0.5">
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  Blocklist rules prevent privacy, tunnel, and tracing metadata from reaching
                  upstream providers.
                </TooltipContent>
              </Tooltip>

              <div className="space-y-1">
                <p>
                  Examples: <code className="rounded bg-background px-1">cf-</code> (prefix),{" "}
                  <code className="rounded bg-background px-1">x-forwarded-for</code> (exact).
                </p>
                <p>Use this to strip sensitive headers before forwarding runtime traffic.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rule-name" className="text-right">
                Name
              </Label>
              <Input
                id="rule-name"
                value={ruleForm.name}
                onChange={(event) =>
                  setRuleForm((prev) => ({ ...prev, name: event.target.value }))
                }
                className="col-span-3"
                placeholder="e.g. Remove Tunnel Headers"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rule-type" className="text-right">
                Type
              </Label>
              <Select
                value={ruleForm.match_type}
                onValueChange={(value) =>
                  setRuleForm((prev) => ({
                    ...prev,
                    match_type: value as "exact" | "prefix",
                  }))
                }
              >
                <SelectTrigger className="col-span-3" id="rule-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exact">Exact Match</SelectItem>
                  <SelectItem value="prefix">Prefix Match</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rule-pattern" className="text-right">
                Pattern
              </Label>
              <div className="col-span-3 space-y-1">
                <Input
                  id="rule-pattern"
                  value={ruleForm.pattern}
                  onChange={(event) =>
                    setRuleForm((prev) => ({ ...prev, pattern: event.target.value }))
                  }
                  className="font-mono"
                  placeholder={
                    ruleForm.match_type === "prefix" ? "cf-" : "x-request-id"
                  }
                />
                {ruleForm.match_type === "prefix" && (
                  <p className="text-[0.8rem] text-muted-foreground">
                    Prefix patterns must end with a hyphen (-).
                  </p>
                )}
              </div>
            </div>

            <SwitchController
              label="Enabled"
              description="Activate this rule immediately"
              checked={ruleForm.enabled}
              onCheckedChange={(checked) =>
                setRuleForm((prev) => ({ ...prev, enabled: checked }))
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setRuleDialogOpen(false)}>
            {locale === "zh-CN" ? "取消" : "Cancel"}
          </Button>
          <Button onClick={() => void handleSaveRule()}>{locale === "zh-CN" ? "保存规则" : "Save Rule"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
