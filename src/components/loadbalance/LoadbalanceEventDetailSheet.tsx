import { useEffect, useState, type ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useTimezone } from "@/hooks/useTimezone";
import { api } from "@/lib/api";
import type { LoadbalanceEventDetail } from "@/lib/types";
import { EventTypeBadge, FailureKindBadge } from "./LoadbalanceBadges";

interface LoadbalanceEventDetailSheetProps {
  eventId: number | null;
  onClose: () => void;
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1 border-b py-3 last:border-b-0 sm:grid-cols-[128px,1fr] sm:gap-4">
      <span className="font-medium text-muted-foreground">{label}</span>
      <div className="text-sm text-foreground [overflow-wrap:anywhere] sm:text-right">
        {value ?? "N/A"}
      </div>
    </div>
  );
}

export function LoadbalanceEventDetailSheet({
  eventId,
  onClose,
}: LoadbalanceEventDetailSheetProps) {
  const { format: formatTime } = useTimezone();
  const [eventCache, setEventCache] = useState<Record<number, LoadbalanceEventDetail>>({});
  const [errorCache, setErrorCache] = useState<Record<number, string>>({});

  const event = eventId === null ? null : eventCache[eventId] ?? null;
  const error = eventId === null ? null : errorCache[eventId] ?? null;
  const loading = eventId !== null && event === null && error === null;

  useEffect(() => {
    if (eventId === null || event !== null || error !== null) {
      return;
    }

    let active = true;

    api.loadbalance
      .getEvent(eventId)
      .then((data) => {
        if (!active) return;
        setEventCache((previous) => ({ ...previous, [eventId]: data }));
      })
      .catch((err) => {
        if (!active) return;
        setErrorCache((previous) => ({
          ...previous,
          [eventId]: err.message || "Failed to load event details",
        }));
      });
    return () => {
      active = false;
    };
  }, [event, error, eventId]);

  const open = eventId !== null;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-xl">
        <SheetHeader className="space-y-1 border-b bg-background/95 px-6 py-5 pr-14 backdrop-blur">
          <SheetTitle>Loadbalance Event Details</SheetTitle>
          <SheetDescription>Event ID: {eventId}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 p-6">
          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {event && !loading && (
            <>
              <section className="space-y-3 rounded-2xl border bg-card p-4">
                <h3 className="text-sm font-semibold">Summary</h3>
                <div className="space-y-1">
                  <DetailRow
                    label="Event"
                    value={
                      <div className="flex flex-col items-start gap-2 sm:items-end">
                        <EventTypeBadge eventType={event.event_type} />
                        <span>{event.summary.event}</span>
                      </div>
                    }
                  />
                  <DetailRow
                    label="Reason"
                    value={
                      <div className="flex flex-col items-start gap-2 sm:items-end">
                        <FailureKindBadge failureKind={event.failure_kind} />
                        <span>{event.summary.reason}</span>
                      </div>
                    }
                  />
                  <DetailRow label="Operation" value={event.summary.operation} />
                  <DetailRow label="Cooldown" value={event.summary.cooldown} />
                  <DetailRow
                    label="Created"
                    value={formatTime(event.created_at, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  />
                </div>
              </section>

              <section className="space-y-3 rounded-2xl border bg-card p-4">
                <h3 className="text-sm font-semibold">Context</h3>
                <div className="space-y-1">
                  <DetailRow label="Event Type" value={<EventTypeBadge eventType={event.event_type} />} />
                  <DetailRow
                    label="Failure Kind"
                    value={<FailureKindBadge failureKind={event.failure_kind} />}
                  />
                  <DetailRow label="Model ID" value={event.model_id} />
                  <DetailRow label="Connection ID" value={event.connection_id} />
                  <DetailRow label="Endpoint ID" value={event.endpoint_id} />
                  <DetailRow label="Vendor ID" value={event.vendor_id} />
                  <DetailRow label="Profile ID" value={event.profile_id} />
                  <DetailRow label="Consecutive Failures" value={event.consecutive_failures} />
                </div>
              </section>

              <section className="space-y-3 rounded-2xl border bg-card p-4">
                <h3 className="text-sm font-semibold">Failover Configuration</h3>
                <div className="space-y-1">
                  <DetailRow label="Failure Threshold" value={event.failure_threshold} />
                  <DetailRow
                    label="Backoff Multiplier"
                    value={
                      event.backoff_multiplier !== null
                        ? event.backoff_multiplier.toFixed(2)
                        : null
                    }
                  />
                  <DetailRow label="Max Cooldown (seconds)" value={event.max_cooldown_seconds} />
                  {event.max_cooldown_strikes !== null ? (
                    <DetailRow
                      label="Max Cooldown Strikes"
                      value={event.max_cooldown_strikes}
                    />
                  ) : null}
                  {event.ban_mode !== null ? (
                    <DetailRow label="Ban Mode" value={event.ban_mode} />
                  ) : null}
                  {event.banned_until_at ? (
                    <DetailRow
                      label="Banned Until"
                      value={formatTime(event.banned_until_at, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    />
                  ) : null}
                </div>
              </section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
