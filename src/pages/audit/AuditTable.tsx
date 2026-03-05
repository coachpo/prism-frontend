import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ValueBadge } from "@/components/StatusBadge";
import { ProviderIcon } from "@/components/ProviderIcon";
import { ArrowLeft, ArrowRight, Copy, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { copyTextToClipboard } from "./clipboard";
import { toast } from "sonner";
import type { AuditLogListItem, Provider } from "@/lib/types";
import { useTimezone } from "@/hooks/useTimezone";
import { statusIntent, methodIntent, formatRequestPath, UNIVERSAL_TIMESTAMP_FORMAT } from "./utils";
interface AuditTableProps {
  logs: AuditLogListItem[];
  providersById: Map<number, Provider>;
  isSheetOpen: boolean;
  selectedLogId: number | null;
  openDetail: (id: number) => void;
  offset: number;
  limit: number;
  total: number;
  setOffset: (val: number) => void;
}

export function AuditTable({
  logs,
  providersById,
  isSheetOpen,
  selectedLogId,
  openDetail,
  offset,
  limit,
  total,
  setOffset,
}: AuditTableProps) {
  const { format: formatTime } = useTimezone();
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const rangeStart = total === 0 ? 0 : offset + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(offset + limit, total);

  return (
    <>
      <Table>
        <TableHeader>
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
                className={cn(
                  "group cursor-pointer hover:bg-muted/50",
                  isSheetOpen && selectedLogId === log.id && "bg-muted/60"
                )}
                onClick={() => openDetail(log.id)}
              >
                <TableCell>
                  <ValueBadge
                    label={String(log.response_status)}
                    intent={statusIntent(log.response_status)}
                    className="text-xs tabular-nums"
                  />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <ValueBadge label={log.request_method} intent={methodIntent(log.request_method)} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="block max-w-[210px] truncate text-sm sm:max-w-[320px]">
                            {requestPath}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-md">
                          <p className="break-all font-mono text-xs">{requestPath}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={async (event) => {
                        event.stopPropagation();
                        try {
                          const success = await copyTextToClipboard(requestPath);
                          if (!success) {
                            toast.error("Failed to copy path");
                            return;
                          }
                          toast.success("Path copied");
                        } catch {
                          toast.error("Failed to copy path");
                        }
                      }}
                      aria-label="Copy path"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <span className="font-mono text-xs text-muted-foreground">{log.model_id}</span>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex items-center gap-1.5">
                    {providerType ? <ProviderIcon providerType={providerType} size={12} /> : null}
                    <span className="text-xs text-muted-foreground">
                      {provider?.name ?? ""}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden text-right lg:table-cell">
                  <span className="text-xs tabular-nums text-muted-foreground">{log.duration_ms}ms</span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatTime(log.created_at, UNIVERSAL_TIMESTAMP_FORMAT)}
                  </span>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(event) => {
                      event.stopPropagation();
                      openDetail(log.id);
                    }}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between border-t px-4 py-3">
        <p className="text-xs text-muted-foreground">
          {rangeStart}-{rangeEnd} of {total}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - limit))}
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Prev
          </Button>
          <span className="text-xs tabular-nums text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={offset + limit >= total}
            onClick={() => setOffset(offset + limit)}
          >
            Next
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </>
  );
}
