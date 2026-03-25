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
import type { HeaderBlocklistRule } from "@/lib/types";

interface DeleteRuleConfirmDialogProps {
  deleteRuleConfirm: HeaderBlocklistRule | null;
  setDeleteRuleConfirm: (rule: HeaderBlocklistRule | null) => void;
  handleDeleteRule: () => Promise<void>;
}

export function DeleteRuleConfirmDialog({
  deleteRuleConfirm,
  setDeleteRuleConfirm,
  handleDeleteRule,
}: DeleteRuleConfirmDialogProps) {
  const { locale } = useLocale();
  return (
    <Dialog
      open={Boolean(deleteRuleConfirm)}
      onOpenChange={(open) => {
        if (!open) {
          setDeleteRuleConfirm(null);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{locale === "zh-CN" ? "删除规则" : "Delete Rule"}</DialogTitle>
          <DialogDescription>
            {locale === "zh-CN"
              ? `确定要删除规则“${deleteRuleConfirm?.name}”吗？此操作无法撤销。`
              : `Are you sure you want to delete the rule "${deleteRuleConfirm?.name}"? This action cannot be undone.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteRuleConfirm(null)}>
            {locale === "zh-CN" ? "取消" : "Cancel"}
          </Button>
          <Button variant="destructive" onClick={() => void handleDeleteRule()}>
            {locale === "zh-CN" ? "删除" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
