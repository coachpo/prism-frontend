import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge, ValueBadge } from "@/components/StatusBadge";
import type { MonitoringModelConnection } from "@/lib/types";
import { formatLabel } from "@/lib/utils";
import { useLocale } from "@/i18n/useLocale";

interface MonitoringModelConnectionsTableProps {
  connections: MonitoringModelConnection[];
  onManualProbe: (connectionId: number) => void;
  probingConnectionIds: Set<number>;
}

function formatMetric(value: number | null, suffix: string): string {
  return value === null ? "—" : `${value}${suffix}`;
}

export function MonitoringModelConnectionsTable({
  connections,
  onManualProbe,
  probingConnectionIds,
}: MonitoringModelConnectionsTableProps) {
  const { messages } = useLocale();
  const copy = messages.monitoring;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{copy.modelConnectionsTitle}</CardTitle>
        <CardDescription className="text-xs">{copy.modelConnectionsDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {connections.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            {copy.noModelConnections}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{copy.connection}</TableHead>
                  <TableHead>{copy.endpointPing}</TableHead>
                  <TableHead>{copy.conversationDelay}</TableHead>
                  <TableHead>{copy.fusedStatus}</TableHead>
                  <TableHead className="text-right">{copy.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {connections.map((connection) => {
                  const probing = probingConnectionIds.has(connection.connection_id);

                  return (
                    <TableRow key={connection.connection_id}>
                      <TableCell>
                        <div className="font-medium">#{connection.connection_id}</div>
                        <div className="text-xs text-muted-foreground">{connection.endpoint_name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <StatusBadge label={formatLabel(connection.endpoint_ping_status)} intent="info" />
                          <ValueBadge label={formatMetric(connection.endpoint_ping_ms, "ms")} intent="muted" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <StatusBadge label={formatLabel(connection.conversation_status)} intent="accent" />
                          <ValueBadge label={formatMetric(connection.conversation_delay_ms, "ms")} intent="muted" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge label={formatLabel(connection.fused_status)} intent="success" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={probing}
                          onClick={() => onManualProbe(connection.connection_id)}
                        >
                          {probing ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                          {probing ? copy.probing : copy.runProbe}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
