import { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { RequestLogEntry } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getColumns, ROW_HEIGHT, type ColumnDef } from "./columns";
import { PAGE_SIZE_OPTIONS, type ViewMode } from "./queryParams";

interface RequestLogsTableProps {
  items: RequestLogEntry[];
  total: number;
  loading: boolean;
  view: ViewMode;
  limit: number;
  offset: number;
  onSelectRequest: (id: number) => void;
  onSetLimit: (limit: number) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  formatTimestamp: (iso: string) => string;
}

const OVERSCAN = 10;

export function RequestLogsTable({
  items,
  total,
  loading,
  view,
  limit,
  offset,
  onSelectRequest,
  onSetLimit,
  onNextPage,
  onPreviousPage,
  formatTimestamp,
}: RequestLogsTableProps) {
  const columns = useMemo(() => getColumns(view), [view]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(500);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setScrollTop(el.scrollTop);
    if (Math.abs(el.clientHeight - containerHeight) > 10) {
      setContainerHeight(el.clientHeight);
    }
  }, [containerHeight]);

  const totalHeight = items.length * ROW_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const visibleCount = Math.ceil(containerHeight / ROW_HEIGHT) + OVERSCAN * 2;
  const endIndex = Math.min(items.length, startIndex + visibleCount);

  const pageStart = offset + 1;
  const pageEnd = Math.min(offset + limit, total);
  const hasPrev = offset > 0;
  const hasNext = offset + limit < total;

  return (
    <div className="flex flex-col rounded-lg border bg-card">
      <div
        ref={containerRef}
        className="max-h-[65vh] overflow-auto"
        onScroll={handleScroll}
      >
        <div className="min-w-[800px]">
          <div className="sticky top-0 z-10 flex border-b bg-muted/50 backdrop-blur-sm">
            {columns.map((col) => (
              <div
                key={col.key}
                className={cn(
                  "shrink-0 px-3 py-2 text-xs font-medium text-muted-foreground",
                  col.align === "right" && "text-right",
                  col.align === "center" && "text-center",
                  col.sticky && "sticky z-20 bg-muted/50 backdrop-blur-sm"
                )}
                style={{ width: col.width, ...(col.sticky ? { left: col.sticky.left } : {}) }}
              >
                {col.label}
              </div>
            ))}
          </div>

          {loading && items.length === 0 ? (
            <div className="space-y-0">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex" style={{ height: ROW_HEIGHT }}>
                  {columns.map((col) => (
                    <div key={col.key} className="shrink-0 px-3 py-2" style={{ width: col.width }}>
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              No request logs found
            </div>
          ) : (
            <div style={{ height: totalHeight, position: "relative" }}>
              {items.slice(startIndex, endIndex).map((row, i) => (
                <div
                  key={row.id}
                  className="absolute left-0 right-0 flex cursor-pointer items-center border-b border-border/50 transition-colors hover:bg-muted/40"
                  style={{
                    height: ROW_HEIGHT,
                    top: (startIndex + i) * ROW_HEIGHT,
                  }}
                  onClick={() => onSelectRequest(row.id)}
                >
                  {columns.map((col: ColumnDef) => (
                    <div
                      key={col.key}
                      className={cn(
                        "shrink-0 overflow-hidden px-3",
                        col.align === "right" && "text-right",
                        col.align === "center" && "text-center",
                        col.sticky && "sticky z-[5] bg-card"
                      )}
                      style={{ width: col.width, ...(col.sticky ? { left: col.sticky.left } : {}) }}
                    >
                      {col.render(row, formatTimestamp)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t px-4 py-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            {total > 0 ? `${pageStart}–${pageEnd} of ${total.toLocaleString()}` : "0 results"}
          </span>
          <Select value={String(limit)} onValueChange={(v) => onSetLimit(Number(v))}>
            <SelectTrigger className="h-7 w-[70px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>per page</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!hasPrev} onClick={onPreviousPage}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!hasNext} onClick={onNextPage}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
