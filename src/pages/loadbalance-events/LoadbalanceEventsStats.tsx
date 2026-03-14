import { BarChart3 } from "lucide-react";
import type { LoadbalanceStats } from "@/lib/types";

interface LoadbalanceEventsStatsProps {
  stats: LoadbalanceStats | null;
}

export function LoadbalanceEventsStats({ stats }: LoadbalanceEventsStatsProps) {
  if (!stats) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-lg border bg-card p-4 transition-colors duration-300">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">Total Events</p>
        </div>
        <p className="mt-2 text-2xl font-bold">{stats.total_events}</p>
      </div>

      <div className="rounded-lg border bg-card p-4 transition-colors duration-300">
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

      <div className="rounded-lg border bg-card p-4 transition-colors duration-300">
        <p className="text-sm font-medium text-muted-foreground">Most Failed Connections</p>
        <div className="mt-2 space-y-1">
          {stats.most_failed_connections.slice(0, 5).map((connection) => (
            <div key={connection.connection_id} className="flex justify-between text-sm">
              <span className="font-mono">Conn {connection.connection_id}</span>
              <span className="font-mono text-red-600">{connection.failure_count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
