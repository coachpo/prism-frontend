import { Pencil, RotateCcw, Trash2 } from "lucide-react";
import { IconActionButton, IconActionGroup } from "@/components/IconActionGroup";
import { useLocale } from "@/i18n/useLocale";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProxyApiKey } from "@/lib/types";
import {
  formatDateTime,
  formatLastUsed,
  getRuntimeStatusLabel,
  getRuntimeStatusTone,
} from "./proxyKeyFormatting";

function MetaChip({
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
        "min-w-0 rounded-md border border-border/70 bg-muted/25 px-2.5 py-2",
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

  return (
      <div
        className={cn("rounded-lg border border-border/70 bg-card p-3")}
      >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold" title={item.name}>
                  {item.name}
                </p>
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

            <div className="flex shrink-0 items-center justify-end">
              <IconActionGroup>
                <IconActionButton
                  type="button"
                  size="icon-sm"
                  aria-label={locale === "zh-CN" ? `编辑代理密钥 ${item.name}` : `Edit proxy key ${item.name}`}
                  disabled={rotating || deleting}
                  onClick={onEdit}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </IconActionButton>
                <IconActionButton
                  type="button"
                  size="icon-sm"
                  aria-label={locale === "zh-CN" ? `轮换代理密钥 ${item.name}` : `Rotate proxy key ${item.name}`}
                  disabled={rotating || deleting}
                  onClick={onRotate}
                >
                  <RotateCcw className={cn("h-3.5 w-3.5", rotating ? "animate-spin" : undefined)} />
                </IconActionButton>
                <IconActionButton
                  type="button"
                  size="icon-sm"
                  aria-label={locale === "zh-CN" ? `删除代理密钥 ${item.name}` : `Delete proxy key ${item.name}`}
                  destructive
                  disabled={rotating || deleting}
                  onClick={onDelete}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </IconActionButton>
              </IconActionGroup>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex flex-wrap gap-2 sm:flex-1 sm:justify-end">
          <MetaChip
            label={locale === "zh-CN" ? "预览" : "Preview"}
            value={item.key_preview}
            mono
            className="min-w-[12rem] flex-1"
          />
          <MetaChip
            label={locale === "zh-CN" ? "创建时间" : "Created"}
            value={formatDateTime(item.created_at)}
            className="sm:min-w-[11rem]"
          />
          <MetaChip
            label={locale === "zh-CN" ? "更新时间" : "Updated"}
            value={formatDateTime(item.updated_at)}
            className="sm:min-w-[11rem]"
          />
          <MetaChip
            label={locale === "zh-CN" ? "最后使用" : "Last used"}
            value={formatLastUsed(item.last_used_at)}
            className="sm:min-w-[11rem]"
          />
          {item.last_used_ip ? (
            <MetaChip
              label={locale === "zh-CN" ? "最后 IP" : "Last IP"}
              value={item.last_used_ip}
              mono
              className="sm:min-w-[10rem]"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
