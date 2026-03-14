import { Filter, RefreshCw, Trash2 } from "lucide-react";
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
import { EVENT_TYPE_OPTIONS, FAILURE_KIND_OPTIONS } from "./constants";
import type { LoadbalanceEventTypeFilter, LoadbalanceFailureKindFilter } from "./types";

interface LoadbalanceEventsFiltersCardProps {
  eventType: LoadbalanceEventTypeFilter;
  setEventType: (value: LoadbalanceEventTypeFilter) => void;
  failureKind: LoadbalanceFailureKindFilter;
  setFailureKind: (value: LoadbalanceFailureKindFilter) => void;
  connectionId: string;
  setConnectionId: (value: string) => void;
  modelId: string;
  setModelId: (value: string) => void;
  clearFilters: () => void;
  refresh: () => void;
}

export function LoadbalanceEventsFiltersCard({
  eventType,
  setEventType,
  failureKind,
  setFailureKind,
  connectionId,
  setConnectionId,
  modelId,
  setModelId,
  clearFilters,
  refresh,
}: LoadbalanceEventsFiltersCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-4 flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Filters</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="event-type">Event Type</Label>
          <Select value={eventType} onValueChange={(value) => setEventType(value as LoadbalanceEventTypeFilter)}>
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
          <Select
            value={failureKind}
            onValueChange={(value) => setFailureKind(value as LoadbalanceFailureKindFilter)}
          >
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
            onChange={(event) => setConnectionId(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="model-id">Model ID</Label>
          <Input
            id="model-id"
            placeholder="Filter by model"
            value={modelId}
            onChange={(event) => setModelId(event.target.value)}
          />
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="outline" size="sm" onClick={clearFilters}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear Filters
        </Button>
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
    </div>
  );
}
