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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PricingTemplate, PricingTemplateConnectionUsageItem } from "@/lib/types";

interface DeletePricingTemplateDialogProps {
  deletePricingTemplateConfirm: PricingTemplate | null;
  deletePricingTemplateConflict: PricingTemplateConnectionUsageItem[] | null;
  onClose: () => void;
  onDelete: () => Promise<void>;
  pricingTemplateDeleting: boolean;
  pricingTemplateUsageLoading: boolean;
  pricingTemplateUsageRows: PricingTemplateConnectionUsageItem[];
}

export function DeletePricingTemplateDialog({
  deletePricingTemplateConfirm,
  deletePricingTemplateConflict,
  onClose,
  onDelete,
  pricingTemplateDeleting,
  pricingTemplateUsageLoading,
  pricingTemplateUsageRows,
}: DeletePricingTemplateDialogProps) {
  const { locale } = useLocale();
  return (
    <Dialog
      open={deletePricingTemplateConfirm !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{locale === "zh-CN" ? "删除价格模板" : "Delete Pricing Template"}</DialogTitle>
          <DialogDescription>
            {locale === "zh-CN"
              ? `确定要删除模板“${deletePricingTemplateConfirm?.name}”吗？`
              : `Are you sure you want to delete the template "${deletePricingTemplateConfirm?.name}"?`}
          </DialogDescription>
        </DialogHeader>

        {pricingTemplateUsageLoading ? (
          <div className="py-4">
            <div className="h-10 animate-pulse rounded-md bg-muted/50" />
          </div>
        ) : deletePricingTemplateConflict ? (
          <div className="space-y-4 py-4">
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {locale === "zh-CN"
                ? `无法删除此模板，因为它当前正被 ${deletePricingTemplateConflict.length} 个连接使用。`
                : `Cannot delete this template because it is currently used by ${deletePricingTemplateConflict.length} connection(s).`}
            </div>
            <div className="max-h-[200px] overflow-y-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{locale === "zh-CN" ? "模型" : "Model"}</TableHead>
                    <TableHead>{locale === "zh-CN" ? "端点" : "Endpoint"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deletePricingTemplateConflict.map((row) => (
                    <TableRow key={row.connection_id}>
                      <TableCell className="font-medium">{row.model_id}</TableCell>
                      <TableCell>{row.endpoint_name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : pricingTemplateUsageRows.length > 0 ? (
          <div className="space-y-4 py-4">
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {locale === "zh-CN"
                ? `无法删除此模板，因为它当前正被 ${pricingTemplateUsageRows.length} 个连接使用。`
                : `Cannot delete this template because it is currently used by ${pricingTemplateUsageRows.length} connection(s).`}
            </div>
          </div>
        ) : (
          <div className="py-4">
            <p className="text-sm">{locale === "zh-CN" ? "此操作无法撤销。" : "This action cannot be undone."}</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {locale === "zh-CN" ? "取消" : "Cancel"}
          </Button>
          <Button
            variant="destructive"
            onClick={() => void onDelete()}
            disabled={
              pricingTemplateDeleting ||
              pricingTemplateUsageLoading ||
              (deletePricingTemplateConflict !== null && deletePricingTemplateConflict.length > 0) ||
              pricingTemplateUsageRows.length > 0
            }
          >
            {pricingTemplateDeleting
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
