import { ArrowLeft, ArrowRight, Eye } from "lucide-react";
import { ProviderIcon } from "@/components/ProviderIcon";
import { ValueBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { AuditLogListItem, Provider } from "@/lib/types";
import { ClipboardButton } from "./clipboard";
import { formatRequestPath, methodIntent, statusIntent, UNIVERSAL_TIMESTAMP_FORMAT } from "./formatters";

interface AuditResultsTableProps {
  formatTime: (date: string, options?: Intl.DateTimeFormatOptions) => string;
  logs: AuditLogListItem[];
  offset: number;
  onSelect: (log: AuditLogListItem) => void;
  providersById: Map<number, Provider>;
  selectedAuditId: number | null;
  setOffset: (value: number) => void;
  total: number;
}

const AUDIT_LIMIT = 50;

export function AuditResultsTable({
  formatTime,
  logs,
  offset,
  onSelect,
  providersById,
  selectedAuditId,
  setOffset,
  total,
}: AuditResultsTableProps) {
  const currentPage = Math.floor(offset / AUDIT_LIMIT) + 1;
  const totalPages = Math.max(1, Math.ceil(total / AUDIT_LIMIT));
  const rangeStart = total === 0 ? 0 : offset + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(offset + AUDIT_LIMIT, total);

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur">
            <TableRow>
              <TableHead className="w-[72px]">Status</TableHead>
              <TableHead className="hidden w-[72px] md:table-cell">Method</TableHead>
              <TableHead>Path</TableHead>
              <TableHead className="hidden lg:table-cell">Model</TableHead>
              <TableHead className="hidden md:table-cell">Provider</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Duration</TableHead>
              <TableHead className="text-right">Time</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => {
              const requestPath = formatRequestPath(log.request_url);
              const provider = providersById.get(log.provider_id);
              const providerType = provider?.provider_type;

              return (
                <TableRow
                  key={log.id}
                  tabIndex={0}
                  className={cn(
                    "cursor-pointer text-xs transition-colors duration-150 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                    selectedAuditId === log.id && "bg-muted/60"
                  )}
                  onClick={() => onSelect(log)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(log);
                    }
                  }}
                >
                  <TableCell>
                    <ValueBadge label={String(log.response_status)} intent={statusIntent(log.response_status)} className="text-xs tabular-nums" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <ValueBadge label={log.request_method} intent={methodIntent(log.request_method)} className="text-xs" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="max-w-[210px] truncate text-sm sm:max-w-[320px]">{requestPath}</span>
                      <ClipboardButton
                        text={requestPath}
                        successMessage="Path copied"
                        errorMessage="Failed to copy path"
                        ariaLabel="Copy request path"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="font-mono text-xs text-muted-foreground">{log.model_id}</span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-1.5">
                      {providerType ? <ProviderIcon providerType={providerType} size={12} /> : null}
                      <span className="text-xs text-muted-foreground">{provider?.name ?? ""}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-right lg:table-cell">
                    <span className="text-xs tabular-nums text-muted-foreground">{log.duration_ms}ms</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                      {formatTime(log.created_at, UNIVERSAL_TIMESTAMP_FORMAT)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={(event) => {
                      event.stopPropagation();
                      onSelect(log);
                    }}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between border-t bg-muted/20 px-4 py-3">
        <p className="text-xs text-muted-foreground">
          {rangeStart}-{rangeEnd} of {total}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - AUDIT_LIMIT))}
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Prev
          </Button>
          <span className="text-xs tabular-nums text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={offset + AUDIT_LIMIT >= total}
            onClick={() => setOffset(offset + AUDIT_LIMIT)}
          >
            Next
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
