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
  const { formatNumber, messages } = useLocale();
  const copy = messages.loadbalanceStrategiesTable;
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
          <DialogTitle>{copy.deleteStrategy}</DialogTitle>
          <DialogDescription>{copy.deleteStrategyDescription(deleteLoadbalanceStrategyConfirm?.name ?? "")}</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isInUse ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {copy.deleteStrategyInUse(formatNumber(attachedModelCount))}
            </div>
          ) : (
            <p className="text-sm">{messages.vendorManagement.thisActionCannotBeUndone}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {messages.settingsDialogs.cancel}
          </Button>
          <Button
            variant="destructive"
            onClick={() => void onDelete()}
            disabled={loadbalanceStrategyDeleting || isInUse}
          >
            {loadbalanceStrategyDeleting ? messages.settingsDialogs.deleting : messages.settingsDialogs.delete}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
