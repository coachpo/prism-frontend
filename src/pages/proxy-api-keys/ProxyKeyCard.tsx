import { RotateCcw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProxyApiKey } from "@/lib/types";
import {
  formatDateTime,
  formatLastUsed,
  formatRotation,
  getRuntimeStatusLabel,
  getRuntimeStatusTone,
} from "./proxyKeyFormatting";

function InfoTile({
  label,
  value,
  helper,
  mono = false,
  className,
}: {
  label: string;
  value: string;
  helper?: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200/80 bg-slate-50/70 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/60",
        className
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-3 text-sm text-slate-950 dark:text-slate-50",
          mono ? "break-all font-mono" : undefined
        )}
      >
        {value}
      </p>
      {helper ? <p className="mt-2 text-sm text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

type Props = {
  authEnabled: boolean;
  deleting: boolean;
  item: ProxyApiKey;
  onDelete: () => void;
  onRotate: () => void;
  rotating: boolean;
};

export function ProxyKeyCard({ item, authEnabled, rotating, deleting, onRotate, onDelete }: Props) {
  const statusLabel = getRuntimeStatusLabel(item, authEnabled);
  const statusTone = getRuntimeStatusTone(item, authEnabled);

  return (
    <div className="rounded-lg border p-4">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold">{item.name}</p>
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

            <p className="text-sm text-muted-foreground">
              {item.notes?.trim() ? item.notes : "No operator note recorded for this integration."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onRotate}
              disabled={rotating || deleting}
            >
              <RotateCcw className={cn("h-3.5 w-3.5", rotating ? "animate-spin" : undefined)} />
              {rotating ? "Rotate..." : "Rotate"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={onDelete}
              disabled={rotating || deleting}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <InfoTile
            label="Stored preview"
            value={item.key_preview}
            mono
            className="lg:col-span-2"
          />
          <InfoTile label="Created" value={formatDateTime(item.created_at)} />
          <InfoTile label="Last used" value={formatLastUsed(item.last_used_at)} />
          <InfoTile
            label="Last IP"
            value={item.last_used_ip ?? "No request yet"}
            mono={Boolean(item.last_used_ip)}
          />
          <InfoTile label="Last rotation" value={formatRotation(item.created_at, item.updated_at)} />
        </div>
      </div>
    </div>
  );
}
