import { Pencil, RotateCcw, Trash2 } from "lucide-react";
import { IconActionButton, IconActionGroup } from "@/components/IconActionGroup";
import { useLocale } from "@/i18n/useLocale";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ProxyApiKey } from "@/lib/types";
import {
  formatDateTime,
  formatLastUsed,
  getRuntimeStatusLabel,
  getRuntimeStatusTone,
} from "./proxyKeyFormatting";

function MobileField({
  label,
  value,
  mono = false,
  className,
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 space-y-1 rounded-md border border-border/70 bg-muted/25 px-2.5 py-2",
        className
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-xs text-foreground",
          mono ? "break-all font-mono" : undefined
        )}
      >
        {value}
      </p>
    </div>
  );
}

type Props = {
  authEnabled: boolean;
  deleting: boolean;
  item: ProxyApiKey;
  onDelete: () => void;
  onEdit: () => void;
  onRotate: () => void;
  rotating: boolean;
};

type ProxyKeyActionsProps = Pick<Props, "deleting" | "onDelete" | "onEdit" | "onRotate" | "rotating"> & {
  itemName: string;
};

function ProxyKeyActions({ deleting, itemName, onDelete, onEdit, onRotate, rotating }: ProxyKeyActionsProps) {
  const { locale } = useLocale();

  return (
    <IconActionGroup>
      <IconActionButton
        type="button"
        size="icon-sm"
        aria-label={locale === "zh-CN" ? `编辑代理密钥 ${itemName}` : `Edit proxy key ${itemName}`}
        disabled={rotating || deleting}
        onClick={onEdit}
      >
        <Pencil className="h-3.5 w-3.5" />
      </IconActionButton>
      <IconActionButton
        type="button"
        size="icon-sm"
        aria-label={locale === "zh-CN" ? `轮换代理密钥 ${itemName}` : `Rotate proxy key ${itemName}`}
        disabled={rotating || deleting}
        onClick={onRotate}
      >
        <RotateCcw className={cn("h-3.5 w-3.5", rotating ? "animate-spin" : undefined)} />
      </IconActionButton>
      <IconActionButton
        type="button"
        size="icon-sm"
        aria-label={locale === "zh-CN" ? `删除代理密钥 ${itemName}` : `Delete proxy key ${itemName}`}
        destructive
        disabled={rotating || deleting}
        onClick={onDelete}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </IconActionButton>
    </IconActionGroup>
  );
}

function MobileOnlyLabel({ children }: { children: string }) {
  return <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground md:hidden">{children}</span>;
}

export function ProxyKeyCard({
  item,
  authEnabled,
  rotating,
  deleting,
  onEdit,
  onRotate,
  onDelete,
}: Props) {
  const { locale } = useLocale();
  const showStatusBadge = !item.is_active || authEnabled;
  const statusLabel = getRuntimeStatusLabel(item);
  const statusTone = getRuntimeStatusTone(item, authEnabled);
  const note = item.notes?.trim() || (locale === "zh-CN" ? "没有内部备注。" : "No internal note.");
  const lastIp = item.last_used_ip || "—";

  return (
    <TableRow className="grid gap-3 px-3 py-3 md:table-row md:px-0 md:py-0">
      <TableCell className="block whitespace-normal px-0 py-0 align-top md:table-cell md:px-[var(--density-table-cell-px)] md:py-[var(--density-table-cell-py)]">
        <div className="min-w-0 space-y-1">
          <MobileOnlyLabel>{locale === "zh-CN" ? "名称 / 备注" : "Name / note"}</MobileOnlyLabel>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="truncate font-medium" title={item.name}>
              {item.name}
            </span>
            {showStatusBadge ? (
              <Badge variant="outline" className={statusTone}>
                {statusLabel}
              </Badge>
            ) : null}
          </div>
          <p className="truncate text-xs text-muted-foreground" title={note}>
            {note}
          </p>
        </div>
      </TableCell>

      <TableCell className="block whitespace-normal px-0 py-0 align-top md:table-cell md:max-w-[14rem] md:px-[var(--density-table-cell-px)] md:py-[var(--density-table-cell-py)]">
        <div className="space-y-1">
          <MobileOnlyLabel>{locale === "zh-CN" ? "预览" : "Preview"}</MobileOnlyLabel>
          <p className="break-all font-mono text-xs text-muted-foreground">{item.key_preview}</p>
        </div>
      </TableCell>

      <TableCell className="block whitespace-normal px-0 py-0 align-top md:table-cell md:px-[var(--density-table-cell-px)] md:py-[var(--density-table-cell-py)]">
        <MobileField
          label={locale === "zh-CN" ? "创建时间" : "Created"}
          value={formatDateTime(item.created_at)}
          className="border-0 bg-transparent px-0 py-0 md:space-y-0 md:border-none md:bg-transparent md:px-0 md:py-0"
        />
      </TableCell>

      <TableCell className="block whitespace-normal px-0 py-0 align-top md:table-cell md:px-[var(--density-table-cell-px)] md:py-[var(--density-table-cell-py)]">
        <MobileField
          label={locale === "zh-CN" ? "更新时间" : "Updated"}
          value={formatDateTime(item.updated_at)}
          className="border-0 bg-transparent px-0 py-0 md:space-y-0 md:border-none md:bg-transparent md:px-0 md:py-0"
        />
      </TableCell>

      <TableCell className="block whitespace-normal px-0 py-0 align-top md:table-cell md:px-[var(--density-table-cell-px)] md:py-[var(--density-table-cell-py)]">
        <MobileField
          label={locale === "zh-CN" ? "最后使用" : "Last used"}
          value={formatLastUsed(item.last_used_at)}
          className="border-0 bg-transparent px-0 py-0 md:space-y-0 md:border-none md:bg-transparent md:px-0 md:py-0"
        />
      </TableCell>

      <TableCell className="block whitespace-normal px-0 py-0 align-top md:table-cell md:max-w-[12rem] md:px-[var(--density-table-cell-px)] md:py-[var(--density-table-cell-py)]">
        <MobileField
          label={locale === "zh-CN" ? "最后 IP" : "Last IP"}
          value={lastIp}
          mono
          className="border-0 bg-transparent px-0 py-0 md:space-y-0 md:border-none md:bg-transparent md:px-0 md:py-0"
        />
      </TableCell>

      <TableCell className="block whitespace-normal px-0 py-0 align-top md:table-cell md:px-[var(--density-table-cell-px)] md:py-[var(--density-table-cell-py)] md:text-right">
        <div className="flex items-center justify-between gap-3 md:justify-end">
          <MobileOnlyLabel>{locale === "zh-CN" ? "操作" : "Operation"}</MobileOnlyLabel>
          <ProxyKeyActions
            itemName={item.name}
            rotating={rotating}
            deleting={deleting}
            onEdit={onEdit}
            onRotate={onRotate}
            onDelete={onDelete}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}
