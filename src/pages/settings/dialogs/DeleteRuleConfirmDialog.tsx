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
  const { messages } = useLocale();
  const copy = messages.settingsDialogs;
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
          <DialogTitle>{copy.deleteRuleTitle}</DialogTitle>
          <DialogDescription>
            {copy.deleteRuleDescription(deleteRuleConfirm?.name ?? "")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteRuleConfirm(null)}>
            {copy.cancel}
          </Button>
          <Button variant="destructive" onClick={() => void handleDeleteRule()}>
            {copy.delete}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
