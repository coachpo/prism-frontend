import { useTimezone } from "@/hooks/useTimezone";
import type { LoadbalanceEvent } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EventTypeBadge, FailureKindBadge } from "./LoadbalanceBadges";

interface LoadbalanceEventsTableProps {
  events: LoadbalanceEvent[];
  loading: boolean;
  total: number;
  offset: number;
  limit: number;
  onSelectEvent: (eventId: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

function getLoadbalanceRangeLabel(total: number, offset: number, limit: number) {
  if (total === 0) {
    return "Showing 0 of 0 events";
  }

  return `Showing ${offset + 1} to ${Math.min(offset + limit, total)} of ${total} events`;
}

export function LoadbalanceEventsTable({
  events,
  loading,
  total,
  offset,
  limit,
  onSelectEvent,
  onPreviousPage,
  onNextPage,
}: LoadbalanceEventsTableProps) {
  const { format: formatTime } = useTimezone();

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Failure</TableHead>
            <TableHead>Connection</TableHead>
            <TableHead>Failures</TableHead>
            <TableHead>Cooldown</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                Loading loadbalance events...
              </TableCell>
            </TableRow>
          ) : null}

          {!loading && events.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                No loadbalance events recorded for this model yet.
              </TableCell>
            </TableRow>
          ) : null}

          {!loading
            ? events.map((event) => (
                <TableRow
                  key={event.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onSelectEvent(event.id)}
                >
                  <TableCell className="font-mono text-xs">{event.id}</TableCell>
                  <TableCell>
                    <EventTypeBadge eventType={event.event_type} />
                  </TableCell>
                  <TableCell>
                    <FailureKindBadge failureKind={event.failure_kind} />
                  </TableCell>
                  <TableCell className="font-mono text-xs">#{event.connection_id}</TableCell>
                  <TableCell className="font-mono text-xs">{event.consecutive_failures}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {event.cooldown_seconds.toFixed(1)}s
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatTime(event.created_at, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </TableCell>
                </TableRow>
              ))
            : null}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between border-t px-4 py-3">
        <p className="text-xs text-muted-foreground">
          {getLoadbalanceRangeLabel(total, offset, limit)}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onPreviousPage} disabled={offset === 0}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={onNextPage} disabled={offset + limit >= total}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
