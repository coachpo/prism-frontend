import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { WebSocketStatusIndicator } from "@/components/WebSocketStatusIndicator";
import { useProfileContext } from "@/context/ProfileContext";
import { LoadbalanceEventDetailSheet } from "@/components/loadbalance/LoadbalanceEventDetailSheet";
import { LoadbalanceEventsFiltersCard } from "./loadbalance-events/LoadbalanceEventsFiltersCard";
import { LoadbalanceEventsStats } from "./loadbalance-events/LoadbalanceEventsStats";
import { LoadbalanceEventsTable } from "./loadbalance-events/LoadbalanceEventsTable";
import { useLoadbalanceEventFilters } from "./loadbalance-events/useLoadbalanceEventFilters";
import { useLoadbalanceEventsData } from "./loadbalance-events/useLoadbalanceEventsData";

export function LoadbalanceEventsPage() {
  const { revision, selectedProfile } = useProfileContext();
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  const {
    eventType,
    setEventType,
    failureKind,
    setFailureKind,
    connectionId,
    setConnectionId,
    modelId,
    setModelId,
    limit,
    offset,
    clearFilters,
    goToPreviousPage,
    goToNextPage,
    filters,
  } = useLoadbalanceEventFilters();

  const {
    events,
    stats,
    loading,
    total,
    newEventIds,
    clearNewEvent,
    refresh,
    connectionState,
    isSyncing,
  } = useLoadbalanceEventsData({
    filters,
    revision,
    profileId: selectedProfile?.id ?? null,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Loadbalance Events"
        description="Monitor failover transitions and connection recovery"
      >
        <WebSocketStatusIndicator
          connectionState={connectionState}
          isSyncing={isSyncing}
        />
      </PageHeader>

      <LoadbalanceEventsStats stats={stats} />

      <LoadbalanceEventsFiltersCard
        eventType={eventType}
        setEventType={setEventType}
        failureKind={failureKind}
        setFailureKind={setFailureKind}
        connectionId={connectionId}
        setConnectionId={setConnectionId}
        modelId={modelId}
        setModelId={setModelId}
        clearFilters={clearFilters}
        refresh={() => void refresh()}
      />

      <LoadbalanceEventsTable
        events={events}
        loading={loading}
        total={total}
        offset={offset}
        limit={limit}
        newEventIds={newEventIds}
        clearNewEvent={clearNewEvent}
        onSelectEvent={setSelectedEventId}
        onPreviousPage={goToPreviousPage}
        onNextPage={() => goToNextPage(total)}
      />

      <LoadbalanceEventDetailSheet
        eventId={selectedEventId}
        onClose={() => setSelectedEventId(null)}
      />
    </div>
  );
}
