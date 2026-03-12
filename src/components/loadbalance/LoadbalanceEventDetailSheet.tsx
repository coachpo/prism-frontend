import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="flex justify-between border-b py-2 text-sm">
      <span className="font-medium text-muted-foreground">{label}</span>
      <span className="font-mono text-foreground">{value ?? "N/A"}</span>
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
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <SheetTitle>Loadbalance Event Details</SheetTitle>
              <SheetDescription>
                Event ID: {eventId}
              </SheetDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
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
