import { Button } from "@/components/ui/button";
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

interface DeleteConfirmDialogProps {
  deleteConfirm: {
    type: "requests" | "audits";
    days: number | null;
    deleteAll: boolean;
  } | null;
  setDeleteConfirm: (confirm: {
    type: "requests" | "audits";
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
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogDescription>
            This deletes data in {selectedProfileLabel} and cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="rounded-md border px-3 py-3">
            <p className="font-medium">Deletion summary</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                Log type: {deleteConfirm?.type === "requests" ? "Request Logs" : "Audit Logs"}
              </li>
              <li>
                Retention:{" "}
                {deleteConfirm?.deleteAll
                  ? "All logs"
                  : `Older than ${deleteConfirm?.days} days`}
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delete-confirm-phrase">Type DELETE to proceed</Label>
            <Input
              id="delete-confirm-phrase"
              value={deleteConfirmPhrase}
              onChange={(event) => setDeleteConfirmPhrase(event.target.value)}
              placeholder="DELETE"
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
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => void handleBatchDelete()}
            disabled={deleting || !isDeletePhraseValid}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
