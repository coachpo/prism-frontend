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
import { type DeleteCleanupType } from "../settingsPageHelpers";

interface DeleteConfirmDialogProps {
  deleteConfirm: {
    type: DeleteCleanupType;
    days: number | null;
    deleteAll: boolean;
  } | null;
  setDeleteConfirm: (confirm: {
    type: DeleteCleanupType;
    days: number | null;
    deleteAll: boolean;
  } | null) => void;
  selectedProfileLabel: string;
  deleteConfirmPhrase: string;
  setDeleteConfirmPhrase: (phrase: string) => void;
  handleBatchDelete: () => Promise<void>;
  deleting: boolean;
  isDeletePhraseValid: boolean;
}

export function DeleteConfirmDialog({
  deleteConfirm,
  setDeleteConfirm,
  selectedProfileLabel,
  deleteConfirmPhrase,
  setDeleteConfirmPhrase,
  handleBatchDelete,
  deleting,
  isDeletePhraseValid,
}: DeleteConfirmDialogProps) {
  const { messages } = useLocale();
  const copy = messages.settingsDialogs;
  const cleanupTypeLabel = deleteConfirm
    ? deleteConfirm.type === "requests"
      ? copy.cleanupTypeRequests
      : deleteConfirm.type === "audits"
        ? copy.cleanupTypeAudits
        : copy.cleanupTypeLoadbalanceEvents
    : "-";

  return (
    <Dialog
      open={Boolean(deleteConfirm)}
      onOpenChange={(open) => {
        if (!open) {
          setDeleteConfirm(null);
          setDeleteConfirmPhrase("");
        }
      }}
    >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{copy.deleteConfirmTitle}</DialogTitle>
            <DialogDescription>{copy.deleteConfirmDescription(selectedProfileLabel)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="rounded-md border px-3 py-3">
            <p className="font-medium">{copy.deletionSummary}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                {copy.dataType}: {cleanupTypeLabel}
              </li>
              <li>
                {copy.retention}: {deleteConfirm?.deleteAll ? copy.allData : copy.olderThanDays(deleteConfirm?.days ?? null)}
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delete-confirm-phrase">{copy.typeDeleteToProceed(copy.deleteConfirmKeyword)}</Label>
            <Input
              id="delete-confirm-phrase"
              value={deleteConfirmPhrase}
              onChange={(event) => setDeleteConfirmPhrase(event.target.value)}
              placeholder={copy.deleteConfirmKeyword}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setDeleteConfirm(null);
              setDeleteConfirmPhrase("");
            }}
          >
            {copy.cancel}
          </Button>
          <Button
            variant="destructive"
            onClick={() => void handleBatchDelete()}
            disabled={deleting || !isDeletePhraseValid}
          >
            {deleting ? copy.deleting : copy.delete}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
