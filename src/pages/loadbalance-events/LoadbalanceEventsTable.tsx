import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EventTypeBadge, FailureKindBadge } from "@/components/loadbalance/LoadbalanceBadges";
import { getLoadbalanceRangeLabel } from "./loadbalanceEventUtils";
import type { LoadbalanceEventRow } from "./types";

interface LoadbalanceEventsTableProps {
  events: LoadbalanceEventRow[];
  loading: boolean;
  total: number;
  offset: number;
  limit: number;
  onSelectEvent: (eventId: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
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
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Event Type</TableHead>
            <TableHead>Failure Kind</TableHead>
            <TableHead>Connection</TableHead>
            <TableHead>Consecutive Failures</TableHead>
            <TableHead>Cooldown (s)</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                Loading...
              </TableCell>
            </TableRow>
          ) : null}

          {!loading && events.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                No events found
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
                  <TableCell className="font-mono text-sm">{event.id}</TableCell>
                  <TableCell>
                    <EventTypeBadge eventType={event.event_type} />
                  </TableCell>
                  <TableCell>
                    <FailureKindBadge failureKind={event.failure_kind} />
                  </TableCell>
                  <TableCell className="font-mono text-sm">{event.connection_id}</TableCell>
                  <TableCell className="font-mono text-sm">{event.consecutive_failures}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {event.cooldown_seconds.toFixed(2)}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{event.model_id || "N/A"}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(event.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            : null}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between border-t p-4">
        <p className="text-sm text-muted-foreground">
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
