import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge, ValueBadge } from "@/components/StatusBadge";
import type { MonitoringVendorModel } from "@/lib/types";
import { formatLabel } from "@/lib/utils";
import { useLocale } from "@/i18n/useLocale";

interface MonitoringVendorModelsTableProps {
  models: MonitoringVendorModel[];
}

export function MonitoringVendorModelsTable({ models }: MonitoringVendorModelsTableProps) {
  const { formatNumber, messages } = useLocale();
  const copy = messages.monitoring;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{copy.vendorModelsTitle}</CardTitle>
        <CardDescription className="text-xs">{copy.vendorModelsDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {models.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            {copy.noVendorModels}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{messages.nav.models}</TableHead>
                  <TableHead>{copy.fusedStatus}</TableHead>
                  <TableHead>{copy.connections}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map((model) => (
                  <TableRow key={model.model_config_id}>
                    <TableCell>
                      <Link className="font-medium hover:underline" to={`/monitoring/models/${model.model_config_id}`}>
                        {model.display_name || model.model_id}
                      </Link>
                      {model.display_name ? (
                        <div className="text-xs text-muted-foreground">{model.model_id}</div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <StatusBadge label={formatLabel(model.fused_status)} intent="info" />
                    </TableCell>
                    <TableCell>
                      <ValueBadge label={formatNumber(model.connection_count)} intent="accent" />
                    </TableCell>
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
