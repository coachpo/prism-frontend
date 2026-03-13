import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { LoadbalanceEventDetail } from "@/lib/types";
import { EventTypeBadge, FailureKindBadge } from "./LoadbalanceBadges";

interface LoadbalanceEventDetailSheetProps {
  eventId: number | null;
  onClose: () => void;
}

function DetailRow({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b py-2 text-sm last:border-b-0">
      <span className="font-medium text-muted-foreground">{label}</span>
      <span className="text-right font-mono text-foreground [overflow-wrap:anywhere]">
        {value ?? "N/A"}
      </span>
    </div>
  );
}

export function LoadbalanceEventDetailSheet({
  eventId,
  onClose,
}: LoadbalanceEventDetailSheetProps) {
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
                <h3 className="text-sm font-semibold">Event Information</h3>
                <div className="space-y-1">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-muted-foreground">Event Type</span>
                    <EventTypeBadge eventType={event.event_type} />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-muted-foreground">Failure Kind</span>
                    <FailureKindBadge failureKind={event.failure_kind} />
                  </div>
                  <DetailRow label="Connection ID" value={event.connection_id} />
                  <DetailRow label="Consecutive Failures" value={event.consecutive_failures} />
                  <DetailRow label="Cooldown (seconds)" value={event.cooldown_seconds.toFixed(2)} />
                  <DetailRow
                    label="Blocked Until (mono)"
                    value={
                      event.blocked_until_mono !== null
                        ? event.blocked_until_mono.toFixed(2)
                        : null
                    }
                  />
                  <DetailRow
                    label="Created At"
                    value={new Date(event.created_at).toLocaleString()}
                  />
                </div>
              </section>

              <section className="space-y-3 rounded-2xl border bg-card p-4">
                <h3 className="text-sm font-semibold">Context</h3>
                <div className="space-y-1">
                  <DetailRow label="Model ID" value={event.model_id} />
                  <DetailRow label="Endpoint ID" value={event.endpoint_id} />
                  <DetailRow label="Provider ID" value={event.provider_id} />
                  <DetailRow label="Profile ID" value={event.profile_id} />
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
                </div>
              </section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
