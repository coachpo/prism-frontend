import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LOADBALANCE_PAGE_LIMIT } from "./constants";
import {
  buildLoadbalanceSearchParams,
  parseEventTypeFilter,
  parseFailureKindFilter,
} from "./loadbalanceEventUtils";

export function useLoadbalanceEventFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [eventType, setEventType] = useState(() =>
    parseEventTypeFilter(searchParams.get("event_type"))
  );
  const [failureKind, setFailureKind] = useState(() =>
    parseFailureKindFilter(searchParams.get("failure_kind"))
  );
  const [connectionId, setConnectionId] = useState(searchParams.get("connection_id") || "");
  const [modelId, setModelId] = useState(searchParams.get("model_id") || "");
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const params = buildLoadbalanceSearchParams({
      eventType,
      failureKind,
      connectionId,
      modelId,
    });
    setSearchParams(params, { replace: true });
  }, [connectionId, eventType, failureKind, modelId, setSearchParams]);

  const clearFilters = () => {
    setEventType("all");
    setFailureKind("all");
    setConnectionId("");
    setModelId("");
    setOffset(0);
  };

  const goToPreviousPage = () => {
    setOffset((currentOffset) => Math.max(0, currentOffset - LOADBALANCE_PAGE_LIMIT));
  };

  const goToNextPage = (total: number) => {
    setOffset((currentOffset) =>
      currentOffset + LOADBALANCE_PAGE_LIMIT < total
        ? currentOffset + LOADBALANCE_PAGE_LIMIT
        : currentOffset
    );
  };

  const filters = useMemo(
    () => ({
      eventType,
      failureKind,
      connectionId,
      modelId,
      limit: LOADBALANCE_PAGE_LIMIT,
      offset,
    }),
    [connectionId, eventType, failureKind, modelId, offset]
  );

  return {
    eventType,
    setEventType,
    failureKind,
    setFailureKind,
    connectionId,
    setConnectionId,
    modelId,
    setModelId,
    limit: LOADBALANCE_PAGE_LIMIT,
    offset,
    setOffset,
    clearFilters,
    goToPreviousPage,
    goToNextPage,
    filters,
  };
}
