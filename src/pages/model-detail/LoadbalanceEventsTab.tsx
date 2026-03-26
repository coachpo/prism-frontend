import { useState } from "react";
import { Activity, RefreshCw } from "lucide-react";
import { LoadbalanceEventDetailSheet } from "@/components/loadbalance/LoadbalanceEventDetailSheet";
import { LoadbalanceEventsTable } from "@/components/loadbalance/LoadbalanceEventsTable";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { useProfileContext } from "@/context/ProfileContext";
import { useModelLoadbalanceEvents } from "./useModelLoadbalanceEvents";

interface LoadbalanceEventsTabProps {
  modelId: string;
}

export function LoadbalanceEventsTab({ modelId }: LoadbalanceEventsTabProps) {
  const { revision } = useProfileContext();
  return <LoadbalanceEventsTabContent key={`${modelId}:${revision}`} modelId={modelId} revision={revision} />;
}

interface LoadbalanceEventsTabContentProps {
  modelId: string;
  revision: number;
}

function LoadbalanceEventsTabContent({ modelId, revision }: LoadbalanceEventsTabContentProps) {
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const {
    events,
    loading,
    total,
    offset,
    limit,
    refresh,
    goToPreviousPage,
    goToNextPage,
  } = useModelLoadbalanceEvents(modelId, revision);

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">
              Loadbalance Events
              <span className="ml-2 text-xs font-normal text-muted-foreground">({total})</span>
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Recent failover, recovery, and ban activity for this model.
            </p>
          </div>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void refresh()}
            disabled={loading}
            aria-label="Refresh loadbalance events"
            title="Refresh loadbalance events"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {!loading && total === 0 ? (
          <div className="rounded-xl border bg-card px-4">
            <EmptyState
              icon={<Activity className="h-6 w-6" />}
              title="No loadbalance events yet"
              description="This model has not recorded any failover or recovery activity."
            />
          </div>
        ) : (
          <LoadbalanceEventsTable
            events={events}
            loading={loading}
            total={total}
            offset={offset}
            limit={limit}
            onSelectEvent={setSelectedEventId}
            onPreviousPage={goToPreviousPage}
            onNextPage={goToNextPage}
          />
        )}
      </div>

      <LoadbalanceEventDetailSheet
        eventId={selectedEventId}
        onClose={() => setSelectedEventId(null)}
      />
    </>
  );
}
