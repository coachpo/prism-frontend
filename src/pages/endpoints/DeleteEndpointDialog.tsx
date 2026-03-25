import type { Endpoint } from "@/lib/types";
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
  const { locale } = useLocale();
  return (
    <Dialog open={Boolean(deleteTarget)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{locale === "zh-CN" ? "删除端点" : "Delete Endpoint"}</DialogTitle>
          <DialogDescription>
            {locale === "zh-CN"
              ? `确定要删除“${deleteTarget?.name}”吗？此操作无法撤销。`
              : `Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" disabled={isDeletingEndpoint} onClick={() => onOpenChange(false)}>
            {locale === "zh-CN" ? "取消" : "Cancel"}
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
            {isDeletingEndpoint
              ? locale === "zh-CN"
                ? "删除中..."
                : "Deleting..."
              : locale === "zh-CN"
                ? "删除"
                : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
