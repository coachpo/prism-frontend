import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { MonitoringModelConnection } from "@/lib/types";
import { formatLabel } from "@/lib/utils";
import { useLocale } from "@/i18n/useLocale";

interface MonitoringModelHistoryCardProps {
  connections: MonitoringModelConnection[];
}

function formatMetric(value: number | null, suffix: string): string {
  return value === null ? "—" : `${value}${suffix}`;
}

export function MonitoringModelHistoryCard({ connections }: MonitoringModelHistoryCardProps) {
  const { locale, messages } = useLocale();
  const copy = messages.monitoring;
  const historyRows = connections.flatMap((connection) => (
    connection.recent_history.map((point) => ({
      connection_id: connection.connection_id,
      endpoint_name: connection.endpoint_name,
      ...point,
    }))
  ));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{copy.recentHistoryTitle}</CardTitle>
        <CardDescription className="text-xs">{copy.recentHistoryDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {historyRows.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            {copy.noRecentHistory}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{copy.checkedAt}</TableHead>
                  <TableHead>{copy.connection}</TableHead>
                  <TableHead>{copy.endpointPing}</TableHead>
                  <TableHead>{copy.conversationDelay}</TableHead>
                  <TableHead>{copy.failureKind}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyRows.map((point) => (
                  <TableRow
                    key={`${point.connection_id}-${point.checked_at}-${point.endpoint_ping_status}-${point.conversation_status}`}
                  >
                    <TableCell>{new Date(point.checked_at).toLocaleString(locale)}</TableCell>
                    <TableCell>
                      <div className="font-medium">#{point.connection_id}</div>
                      <div className="text-xs text-muted-foreground">{point.endpoint_name}</div>
                    </TableCell>
                    <TableCell>{`${formatLabel(point.endpoint_ping_status)} • ${formatMetric(point.endpoint_ping_ms, "ms")}`}</TableCell>
                    <TableCell>{`${formatLabel(point.conversation_status)} • ${formatMetric(point.conversation_delay_ms, "ms")}`}</TableCell>
                    <TableCell>{point.failure_kind ? formatLabel(point.failure_kind) : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
