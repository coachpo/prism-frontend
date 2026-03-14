import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PricingTemplate, PricingTemplateConnectionUsageItem } from "@/lib/types";

interface PricingTemplateUsageDialogProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  pricingTemplateUsageLoading: boolean;
  pricingTemplateUsageRows: PricingTemplateConnectionUsageItem[];
  pricingTemplateUsageTemplate: PricingTemplate | null;
}

export function PricingTemplateUsageDialog({
  onOpenChange,
  open,
  pricingTemplateUsageLoading,
  pricingTemplateUsageRows,
  pricingTemplateUsageTemplate,
}: PricingTemplateUsageDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Template Usage</DialogTitle>
          <DialogDescription>
            Connections currently using the &quot;{pricingTemplateUsageTemplate?.name}&quot; template.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {pricingTemplateUsageLoading ? (
            <div className="space-y-2">
              <div className="h-10 animate-pulse rounded-md bg-muted/50" />
              <div className="h-10 animate-pulse rounded-md bg-muted/50" />
            </div>
          ) : pricingTemplateUsageRows.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">
                This template is not currently used by any connections.
              </p>
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Connection</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricingTemplateUsageRows.map((row) => (
                    <TableRow key={row.connection_id}>
                      <TableCell className="font-medium">{row.model_id}</TableCell>
                      <TableCell>{row.endpoint_name}</TableCell>
                      <TableCell>
                        {row.connection_name || (
                          <span className="text-muted-foreground italic">Unnamed</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
