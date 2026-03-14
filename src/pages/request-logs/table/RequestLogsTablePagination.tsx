import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { REQUEST_LIMIT_OPTIONS } from "../queryParams";

interface RequestLogsTablePaginationProps {
  canPaginateForward: boolean;
  currentPage: number;
  limit: number;
  loading: boolean;
  offset: number;
  rangeEnd: number;
  rangeStart: number;
  setLimit: (limit: number) => void;
  setOffset: (offset: number) => void;
  total: number;
  totalPages: number;
}

export function RequestLogsTablePagination({
  canPaginateForward,
  currentPage,
  limit,
  loading,
  offset,
  rangeEnd,
  rangeStart,
  setLimit,
  setOffset,
  total,
  totalPages,
}: RequestLogsTablePaginationProps) {
  return (
    <div className="flex flex-col gap-3 border-t bg-muted/20 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Rows per page</span>
        <Select
          value={String(limit)}
          onValueChange={(next) => {
            setLimit(Number.parseInt(next, 10));
            setOffset(0);
          }}
        >
          <SelectTrigger className="h-7 min-w-[4.5rem] text-xs tabular-nums">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REQUEST_LIMIT_OPTIONS.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <p className="text-xs text-muted-foreground">
          {rangeStart}-{rangeEnd} of {total} (Page {currentPage}/{totalPages})
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={offset === 0 || loading}
            onClick={() => setOffset(Math.max(0, offset - limit))}
          >
            <span className="sr-only">Previous</span>
            <ArrowRight className="h-3 w-3 rotate-180" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={!canPaginateForward || loading}
            onClick={() => setOffset(offset + limit)}
          >
            <span className="sr-only">Next</span>
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
