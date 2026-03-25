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
  const { locale } = useLocale();
  return (
    <Dialog open={deleteConfirm !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{locale === "zh-CN" ? "删除代理 API 密钥" : "Delete Proxy API Key"}</DialogTitle>
          <DialogDescription>
            {locale === "zh-CN"
              ? `确定要删除密钥“${deleteConfirm?.name}”吗？使用此密钥的请求会立即失效。继续前请确认前缀 `
              : `Delete the key "${deleteConfirm?.name}"? Requests using this secret will stop working immediately. Confirm the prefix `}
            <span className="font-mono text-foreground">{deleteConfirm?.key_prefix}</span>
            {locale === "zh-CN" ? " 后再继续。" : " before continuing."}
          </DialogDescription>
        </DialogHeader>

        {deleteConfirm ? (
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
              <p className="text-sm text-destructive">{locale === "zh-CN" ? "此操作无法撤销。" : "This action cannot be undone."}</p>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={deletingProxyKeyId !== null}>
            {locale === "zh-CN" ? "取消" : "Cancel"}
          </Button>
          <Button variant="destructive" onClick={onDelete} disabled={deletingProxyKeyId !== null}>
            {deletingProxyKeyId !== null
              ? locale === "zh-CN"
                ? "删除中..."
                : "Deleting..."
              : locale === "zh-CN"
                ? "删除密钥"
                : "Delete key"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
