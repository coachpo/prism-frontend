import type { Endpoint } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteEndpointDialogProps {
  deleteTarget: Endpoint | null;
  isDeletingEndpoint: boolean;
  onConfirm: (id: number) => void | Promise<void>;
  onOpenChange: (open: boolean) => void;
}

export function DeleteEndpointDialog({
  deleteTarget,
  isDeletingEndpoint,
  onConfirm,
  onOpenChange,
}: DeleteEndpointDialogProps) {
  return (
    <Dialog open={Boolean(deleteTarget)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Endpoint</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" disabled={isDeletingEndpoint} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={isDeletingEndpoint || !deleteTarget}
            onClick={() => {
              if (!deleteTarget) {
                return;
              }
              void onConfirm(deleteTarget.id);
            }}
          >
            {isDeletingEndpoint ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
