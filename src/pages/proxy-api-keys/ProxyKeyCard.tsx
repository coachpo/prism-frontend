import type { ButtonHTMLAttributes } from "react";
import { Pencil, RotateCcw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

function ProxyKeyActionButton({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn(
        "h-8 w-8 shrink-0 rounded-full border border-transparent bg-background/70 text-muted-foreground transition-colors hover:border-border hover:bg-background hover:text-foreground",
        className
      )}
      {...props}
    />
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
  const statusLabel = getRuntimeStatusLabel(item, authEnabled);
  const statusTone = getRuntimeStatusTone(item, authEnabled);
  const note = item.notes?.trim() || "No internal note.";

  return (
    <div className="rounded-lg border border-border/70 bg-card p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold" title={item.name}>
                  {item.name}
                </p>
                <Badge variant="outline" className={statusTone}>
                  {statusLabel}
                </Badge>
                {!item.last_used_at ? (
                  <Badge
                    variant="outline"
                    className="border-slate-300/70 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                  >
                    Never used
                  </Badge>
                ) : null}
              </div>

              <p className="truncate text-xs text-muted-foreground" title={note}>
                {note}
              </p>
            </div>

            <div className="flex shrink-0 items-center justify-end">
              <div className="flex shrink-0 items-center gap-0.5 rounded-full border border-border/70 bg-muted/35 p-0.5">
                <ProxyKeyActionButton
                  aria-label={`Edit proxy key ${item.name}`}
                  disabled={rotating || deleting}
                  onClick={onEdit}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </ProxyKeyActionButton>
                <ProxyKeyActionButton
                  aria-label={`Rotate proxy key ${item.name}`}
                  disabled={rotating || deleting}
                  onClick={onRotate}
                >
                  <RotateCcw className={cn("h-3.5 w-3.5", rotating ? "animate-spin" : undefined)} />
                </ProxyKeyActionButton>
                <ProxyKeyActionButton
                  aria-label={`Delete proxy key ${item.name}`}
                  className="text-destructive hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                  disabled={rotating || deleting}
                  onClick={onDelete}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </ProxyKeyActionButton>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <MetaChip
            label="Preview"
            value={item.key_preview}
            mono
            className="min-w-[12rem] flex-1"
          />
          <MetaChip
            label="Created"
            value={formatDateTime(item.created_at)}
            className="sm:min-w-[11rem]"
          />
          <MetaChip
            label="Updated"
            value={formatDateTime(item.updated_at)}
            className="sm:min-w-[11rem]"
          />
          <MetaChip
            label="Last used"
            value={formatLastUsed(item.last_used_at)}
            className="sm:min-w-[11rem]"
          />
          {item.last_used_ip ? (
            <MetaChip
              label="Last IP"
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
