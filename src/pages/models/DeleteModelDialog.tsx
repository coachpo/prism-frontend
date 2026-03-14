import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ModelConfigListItem } from "@/lib/types";

type Props = {
  deleteTarget: ModelConfigListItem | null;
  onDelete: () => void;
  setDeleteTarget: (model: ModelConfigListItem | null) => void;
};

export function DeleteModelDialog({ deleteTarget, onDelete, setDeleteTarget }: Props) {
  return (
    <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Model</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{deleteTarget?.display_name || deleteTarget?.model_id}"? This will also delete all associated endpoints.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="destructive" onClick={onDelete}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
