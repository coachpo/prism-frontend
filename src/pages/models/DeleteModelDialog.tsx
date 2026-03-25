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
import type { ModelConfigListItem } from "@/lib/types";

type Props = {
  deleteTarget: ModelConfigListItem | null;
  onDelete: () => void;
  setDeleteTarget: (model: ModelConfigListItem | null) => void;
};

export function DeleteModelDialog({ deleteTarget, onDelete, setDeleteTarget }: Props) {
  const { locale } = useLocale();
  return (
    <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{locale === "zh-CN" ? "删除模型" : "Delete Model"}</DialogTitle>
          <DialogDescription>
            {locale === "zh-CN"
              ? `确定要删除“${deleteTarget?.display_name || deleteTarget?.model_id}”吗？这也会删除所有关联的端点。`
              : `Are you sure you want to delete "${deleteTarget?.display_name || deleteTarget?.model_id}"? This will also delete all associated endpoints.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>{locale === "zh-CN" ? "取消" : "Cancel"}</Button>
          <Button variant="destructive" onClick={onDelete}>{locale === "zh-CN" ? "删除" : "Delete"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
