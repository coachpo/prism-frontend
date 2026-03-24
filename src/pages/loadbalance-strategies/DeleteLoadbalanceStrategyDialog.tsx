import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LoadbalanceStrategy } from "@/lib/types";

interface DeleteLoadbalanceStrategyDialogProps {
  deleteLoadbalanceStrategyConfirm: LoadbalanceStrategy | null;
  loadbalanceStrategyDeleting: boolean;
  onClose: () => void;
  onDelete: () => Promise<void>;
}

export function DeleteLoadbalanceStrategyDialog({
  deleteLoadbalanceStrategyConfirm,
  loadbalanceStrategyDeleting,
  onClose,
  onDelete,
}: DeleteLoadbalanceStrategyDialogProps) {
  const attachedModelCount = deleteLoadbalanceStrategyConfirm?.attached_model_count ?? 0;
  const isInUse = attachedModelCount > 0;

  return (
    <Dialog
      open={deleteLoadbalanceStrategyConfirm !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Loadbalance Strategy</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the strategy &quot;{deleteLoadbalanceStrategyConfirm?.name}&quot;?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isInUse ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              This strategy is attached to {attachedModelCount} native model{attachedModelCount === 1 ? "" : "s"} and cannot be deleted yet.
            </div>
          ) : (
            <p className="text-sm">This action cannot be undone.</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => void onDelete()}
            disabled={loadbalanceStrategyDeleting || isInUse}
          >
            {loadbalanceStrategyDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
