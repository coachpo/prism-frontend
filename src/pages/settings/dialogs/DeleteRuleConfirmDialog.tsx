import { Button } from "@/components/ui/button";
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
          <DialogTitle>Delete Rule</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the rule "{deleteRuleConfirm?.name}"? This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteRuleConfirm(null)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => void handleDeleteRule()}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
