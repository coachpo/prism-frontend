import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Activity, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/EmptyState";
import type { RequestLogEntry } from "@/lib/types";
import { VIEW_COLUMNS, getRequestLogsHeaderClassName, renderTableHeader } from "./columns";
import type { ViewType } from "./queryParams";
import { RequestLogsTablePagination } from "./table/RequestLogsTablePagination";
import { RequestLogsTableRow } from "./table/RequestLogsTableRow";

const VIRTUALIZED_ROW_HEIGHT = 45;
const VIRTUALIZED_ROW_OVERSCAN = 10;
interface RequestLogsTableProps {
  rows: RequestLogEntry[];
  pageRowCount: number;
  loading: boolean;
  total: number;
  limit: number;
  offset: number;
  setLimit: (limit: number) => void;
  setOffset: (offset: number) => void;
  view: ViewType;
  allColumnsMode: boolean;
  openLogDetail: (log: RequestLogEntry) => void;
  clearAllFilters: () => void;
  formatTime: (date: string, options?: Intl.DateTimeFormatOptions) => string;
  navigateToConnection: (id: number) => Promise<void>;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  emptyStateAction?: ReactNode;
}
export function RequestLogsTable({
  rows,
  pageRowCount,
  loading,
  total,
  limit,
  offset,
  setLimit,
  setOffset,
  view,
  allColumnsMode,
  openLogDetail,
  clearAllFilters,
  formatTime,
  navigateToConnection,
  emptyStateTitle,
  emptyStateDescription,
  emptyStateAction,
}: RequestLogsTableProps) {
  const visibleColumns = useMemo(() => VIEW_COLUMNS[view], [view]);
  const parentRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    const element = parentRef.current;
    if (!element) {
      return;
    }

    let animationFrame = 0;
    const syncViewport = () => {
      setViewportHeight((current) => (current === element.clientHeight ? current : element.clientHeight));
      setScrollTop((current) => (current === element.scrollTop ? current : element.scrollTop));
    };
    const handleScroll = () => {
      if (animationFrame !== 0) {
        return;
      }
      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = 0;
        setScrollTop((current) => (current === element.scrollTop ? current : element.scrollTop));
      });
    };

    syncViewport();
    element.addEventListener("scroll", handleScroll, { passive: true });

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            syncViewport();
          });
    resizeObserver?.observe(element);

    return () => {
      if (animationFrame !== 0) {
        window.cancelAnimationFrame(animationFrame);
      }
      element.removeEventListener("scroll", handleScroll);
      resizeObserver?.disconnect();
    };
  }, []);

  const virtualWindow = useMemo(() => {
    if (rows.length === 0 || viewportHeight <= 0) {
      return {
        endIndex: rows.length,
        startIndex: 0,
      };
    }

    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / VIRTUALIZED_ROW_HEIGHT) - VIRTUALIZED_ROW_OVERSCAN
    );
    const endIndex = Math.min(
      rows.length,
      Math.ceil((scrollTop + viewportHeight) / VIRTUALIZED_ROW_HEIGHT) + VIRTUALIZED_ROW_OVERSCAN
    );

    return {
      endIndex,
      startIndex,
    };
  }, [rows.length, scrollTop, viewportHeight]);

  const visibleRows = useMemo(
    () => rows.slice(virtualWindow.startIndex, virtualWindow.endIndex),
    [rows, virtualWindow.endIndex, virtualWindow.startIndex]
  );
  const topSpacerHeight = virtualWindow.startIndex * VIRTUALIZED_ROW_HEIGHT;
  const bottomSpacerHeight = Math.max(
    0,
    (rows.length - virtualWindow.endIndex) * VIRTUALIZED_ROW_HEIGHT
  );

  const canPaginateForward = offset + limit < total;
  const currentPage = total > 0 ? Math.floor(offset / limit) + 1 : 1;
  const totalPages = total > 0 ? Math.ceil(total / limit) : 1;
  const rangeStart = total > 0 ? offset + 1 : 0;
  const rangeEnd = total > 0 ? Math.min(offset + pageRowCount, total) : 0;

  return (
    <div className="rounded-md border bg-card overflow-hidden relative flex-1 min-h-[420px] flex flex-col">
      <div
        ref={parentRef}
        className="flex-1 overflow-auto [scrollbar-gutter:stable] [&_[data-slot=table-container]]:overflow-x-visible"
      >
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <Activity className="h-8 w-8 animate-pulse text-primary/50" />
              Loading request logs...
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              icon={<Search className="h-8 w-8" />}
              title={emptyStateTitle ?? "No logs match your filters"}
              description={emptyStateDescription ?? "Try adjusting search or filters to widen this view."}
              action={
                emptyStateAction ?? (
                  <Button variant="outline" onClick={clearAllFilters}>
                    Reset Filters
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <Table className={allColumnsMode ? "min-w-[2100px]" : "w-full"}>
            <TableHeader className="sticky top-0 z-10 border-b bg-card">
              <TableRow>
                {visibleColumns.map((column) => (
                  <TableHead
                    key={column}
                    className={getRequestLogsHeaderClassName(column, allColumnsMode)}
                  >
                    {renderTableHeader(column)}
                  </TableHead>
                ))}
                <TableHead className="w-[46px]" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {topSpacerHeight > 0 ? (
                <TableRow aria-hidden="true" className="border-0 hover:bg-transparent">
                  <TableCell
                    colSpan={visibleColumns.length + 1}
                    className="h-0 border-0 p-0"
                    style={{ height: `${topSpacerHeight}px` }}
                  />
                </TableRow>
              ) : null}

              {visibleRows.map((log) => (
                <RequestLogsTableRow
                  key={log.id}
                  allColumnsMode={allColumnsMode}
                  columns={visibleColumns}
                  formatTime={formatTime}
                  log={log}
                  navigateToConnection={navigateToConnection}
                  openLogDetail={openLogDetail}
                />
              ))}

              {bottomSpacerHeight > 0 ? (
                <TableRow aria-hidden="true" className="border-0 hover:bg-transparent">
                  <TableCell
                    colSpan={visibleColumns.length + 1}
                    className="h-0 border-0 p-0"
                    style={{ height: `${bottomSpacerHeight}px` }}
                  />
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        )}
      </div>

      {!loading && total > 0 ? (
        <RequestLogsTablePagination
          canPaginateForward={canPaginateForward}
          currentPage={currentPage}
          limit={limit}
          loading={loading}
          offset={offset}
          rangeEnd={rangeEnd}
          rangeStart={rangeStart}
          setLimit={setLimit}
          setOffset={setOffset}
          total={total}
          totalPages={totalPages}
        />
      ) : null}
    </div>
  );
}
