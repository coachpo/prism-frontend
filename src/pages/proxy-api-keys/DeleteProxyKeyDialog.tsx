import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ProxyApiKey } from "@/lib/types";

type Props = {
  deleteConfirm: ProxyApiKey | null;
  deletingProxyKeyId: number | null;
  onClose: () => void;
  onDelete: () => void;
  onOpenChange: (open: boolean) => void;
};

export function DeleteProxyKeyDialog({
  deleteConfirm,
  deletingProxyKeyId,
  onClose,
  onDelete,
  onOpenChange,
}: Props) {
  return (
    <Dialog open={deleteConfirm !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Proxy API Key</DialogTitle>
          <DialogDescription>
            Delete the key &quot;{deleteConfirm?.name}&quot;? Requests using this secret will
            stop working immediately.
          </DialogDescription>
        </DialogHeader>

        {deleteConfirm ? (
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
              <p className="text-sm text-destructive">This action cannot be undone.</p>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={deletingProxyKeyId !== null}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onDelete} disabled={deletingProxyKeyId !== null}>
            {deletingProxyKeyId !== null ? "Deleting..." : "Delete key"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
