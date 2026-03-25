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
  const { locale } = useLocale();
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
          <DialogTitle>{locale === "zh-CN" ? "删除负载均衡策略" : "Delete Loadbalance Strategy"}</DialogTitle>
          <DialogDescription>
            {locale === "zh-CN"
              ? `确定要删除策略“${deleteLoadbalanceStrategyConfirm?.name}”吗？`
              : `Are you sure you want to delete the strategy "${deleteLoadbalanceStrategyConfirm?.name}"?`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isInUse ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {locale === "zh-CN"
                ? `此策略已绑定到 ${attachedModelCount} 个原生模型，当前无法删除。`
                : `This strategy is attached to ${attachedModelCount} native model${attachedModelCount === 1 ? "" : "s"} and cannot be deleted yet.`}
            </div>
          ) : (
            <p className="text-sm">{locale === "zh-CN" ? "此操作无法撤销。" : "This action cannot be undone."}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {locale === "zh-CN" ? "取消" : "Cancel"}
          </Button>
          <Button
            variant="destructive"
            onClick={() => void onDelete()}
            disabled={loadbalanceStrategyDeleting || isInUse}
          >
            {loadbalanceStrategyDeleting
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
