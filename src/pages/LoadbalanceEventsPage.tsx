import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BarChart3, Filter, RefreshCw, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProfileContext } from "@/context/ProfileContext";
import { api } from "@/lib/api";
import type { LoadbalanceEvent, LoadbalanceStats } from "@/lib/types";
import { EventTypeBadge, FailureKindBadge } from "@/components/loadbalance/LoadbalanceBadges";
import { LoadbalanceEventDetailSheet } from "@/components/loadbalance/LoadbalanceEventDetailSheet";

const EVENT_TYPE_OPTIONS = [
  { value: "all", label: "All Events" },
  { value: "opened", label: "Opened" },
  { value: "extended", label: "Extended" },
  { value: "probe_eligible", label: "Probe Eligible" },
  { value: "recovered", label: "Recovered" },
  { value: "not_opened", label: "Not Opened" },
];

const FAILURE_KIND_OPTIONS = [
  { value: "all", label: "All Kinds" },
  { value: "transient_http", label: "Transient HTTP" },
  { value: "auth_like", label: "Auth Error" },
  { value: "connect_error", label: "Connection Error" },
  { value: "timeout", label: "Timeout" },
];

export function LoadbalanceEventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { revision } = useProfileContext();

  const [events, setEvents] = useState<LoadbalanceEvent[]>([]);
  const [stats, setStats] = useState<LoadbalanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const [eventType, setEventType] = useState(searchParams.get("event_type") || "all");
  const [failureKind, setFailureKind] = useState(searchParams.get("failure_kind") || "all");
  const [connectionId, setConnectionId] = useState(searchParams.get("connection_id") || "");
  const [modelId, setModelId] = useState(searchParams.get("model_id") || "");
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (eventType !== "all") params.set("event_type", eventType);
    if (failureKind !== "all") params.set("failure_kind", failureKind);
    if (connectionId) params.set("connection_id", connectionId);
    if (modelId) params.set("model_id", modelId);
    setSearchParams(params, { replace: true });
  }, [eventType, failureKind, connectionId, modelId, setSearchParams]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params: Parameters<typeof api.loadbalance.listEvents>[0] = { limit, offset };
      if (eventType !== "all") params.event_type = eventType;
      if (failureKind !== "all") params.failure_kind = failureKind;
      if (connectionId) {
        const parsedConnectionId = Number.parseInt(connectionId, 10);
        if (!Number.isNaN(parsedConnectionId)) {
          params.connection_id = parsedConnectionId;
        }
      }
      if (modelId) params.model_id = modelId;

      const [eventsData, statsData] = await Promise.all([
        api.loadbalance.listEvents(params),
        api.loadbalance.getStats({}),
      ]);

      setEvents(eventsData.items);
      setTotal(eventsData.total);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to load loadbalance events", error);
    } finally {
      setLoading(false);
    }
  }, [connectionId, eventType, failureKind, limit, modelId, offset]);

  useEffect(() => {
    void fetchEvents();
  }, [revision, fetchEvents]);

  const handleClearFilters = () => {
    setEventType("all");
    setFailureKind("all");
    setConnectionId("");
    setModelId("");
    setOffset(0);
  };

  const handlePreviousPage = () => {
    setOffset(Math.max(0, offset - limit));
  };

  const handleNextPage = () => {
    if (offset + limit < total) {
      setOffset(offset + limit);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Loadbalance Events"
        description="Monitor failover transitions and connection recovery"
      />

      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">Total Events</p>
            </div>
            <p className="mt-2 text-2xl font-bold">{stats.total_events}</p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm font-medium text-muted-foreground">Events by Type</p>
            <div className="mt-2 space-y-1">
              {Object.entries(stats.events_by_type).map(([type, count]) => (
                <div key={type} className="flex justify-between text-sm">
                  <span className="capitalize">{type.replace("_", " ")}</span>
                  <span className="font-mono">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm font-medium text-muted-foreground">Most Failed Connections</p>
            <div className="mt-2 space-y-1">
              {stats.most_failed_connections.slice(0, 5).map((conn) => (
                <div key={conn.connection_id} className="flex justify-between text-sm">
                  <span className="font-mono">Conn {conn.connection_id}</span>
                  <span className="font-mono text-red-600">{conn.failure_count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-card p-4">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Filters</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="event-type">Event Type</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger id="event-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="failure-kind">Failure Kind</Label>
            <Select value={failureKind} onValueChange={setFailureKind}>
              <SelectTrigger id="failure-kind">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FAILURE_KIND_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="connection-id">Connection ID</Label>
            <Input
              id="connection-id"
              type="number"
              placeholder="Filter by connection"
              value={connectionId}
              onChange={(e) => setConnectionId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model-id">Model ID</Label>
            <Input
              id="model-id"
              placeholder="Filter by model"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" onClick={handleClearFilters}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
          <Button variant="outline" size="sm" onClick={fetchEvents}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

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
            {loading && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            )}

            {!loading && events.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No events found
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              events.map((event) => (
                <TableRow
                  key={event.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedEventId(event.id)}
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
              ))}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between border-t p-4">
          <p className="text-sm text-muted-foreground">
            {total === 0
              ? "Showing 0 of 0 events"
              : `Showing ${offset + 1} to ${Math.min(offset + limit, total)} of ${total} events`}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={offset === 0}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={offset + limit >= total}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <LoadbalanceEventDetailSheet
        eventId={selectedEventId}
        onClose={() => setSelectedEventId(null)}
      />
    </div>
  );
}
