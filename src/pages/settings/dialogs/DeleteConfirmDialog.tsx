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
import { getCleanupTypeLabel, type DeleteCleanupType } from "../settingsPageHelpers";

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
  const { locale } = useLocale();
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
          <DialogTitle>{locale === "zh-CN" ? "确认删除" : "Confirm Deletion"}</DialogTitle>
          <DialogDescription>
            {locale === "zh-CN"
              ? `${selectedProfileLabel} 中的数据将被删除且无法撤销。`
              : `This deletes data in ${selectedProfileLabel} and cannot be undone.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="rounded-md border px-3 py-3">
            <p className="font-medium">Deletion summary</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                Data type: {deleteConfirm ? getCleanupTypeLabel(deleteConfirm.type) : "-"}
              </li>
              <li>
                Retention:{" "}
                {deleteConfirm?.deleteAll
                  ? "All data"
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
            {locale === "zh-CN" ? "取消" : "Cancel"}
          </Button>
          <Button
            variant="destructive"
            onClick={() => void handleBatchDelete()}
            disabled={deleting || !isDeletePhraseValid}
          >
            {deleting ? (locale === "zh-CN" ? "删除中..." : "Deleting...") : locale === "zh-CN" ? "删除" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
