import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import type { AuditLogResponse } from "@/lib/types";

export function AuditPage() {
  const [rows, setRows] = useState<AuditLogResponse[]>([]);
  const [selected, setSelected] = useState<AuditLogResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [limit, setLimit] = useState(50);
  const [deleteOlderThan, setDeleteOlderThan] = useState(7);
  const [isLoading, setIsLoading] = useState(false);

  async function loadAuditLogs() {
    setIsLoading(true);
    try {
      const response = await api.audit.list({
        response_status: statusFilter ? Number(statusFilter) : undefined,
        model_id: modelFilter || undefined,
        limit,
        offset: 0,
      });
      setRows(response.items);
      setSelected(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load audit logs";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadAuditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  async function openAuditDetail(auditId: number) {
    try {
      const detail = await api.audit.get(auditId);
      setSelected(detail);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load audit detail";
      toast.error(message);
    }
  }

  async function deleteAuditRows(deleteAll = false) {
    try {
      await api.audit.delete({
        delete_all: deleteAll,
        older_than_days: deleteAll ? undefined : deleteOlderThan,
      });
      toast.success(deleteAll ? "All audit logs deleted" : "Old audit logs deleted");
      await loadAuditLogs();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete audit logs";
      toast.error(message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">
          Request/response captures with security redaction from `/api/v2/audit`.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="audit_status">Response status</Label>
            <Input
              id="audit_status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="audit_model">Model ID</Label>
            <Input
              id="audit_model"
              value={modelFilter}
              onChange={(event) => setModelFilter(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="audit_limit">Limit</Label>
            <Input
              id="audit_limit"
              type="number"
              value={limit}
              onChange={(event) => setLimit(Number(event.target.value) || 50)}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={() => void loadAuditLogs()} disabled={isLoading}>
              Apply filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log entries</CardTitle>
          <CardDescription>Click “View detail” to inspect full headers/bodies.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded border p-3">
              <div>
                <p className="font-medium">
                  #{row.id} • {row.request_method} {row.request_url}
                </p>
                <p className="text-xs text-muted-foreground">
                  model={row.model_id} • status={row.response_status} • duration={row.duration_ms}ms
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => void openAuditDetail(row.id)}>
                View detail
              </Button>
            </div>
          ))}

          {!rows.length && !isLoading && (
            <p className="text-sm text-muted-foreground">No audit logs found.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detail</CardTitle>
        </CardHeader>
        <CardContent>
          {selected ? (
            <pre className="max-h-96 overflow-auto rounded border bg-muted p-3 text-xs">
              {JSON.stringify(selected, null, 2)}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">Select an entry to inspect full details.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Retention tools</CardTitle>
          <CardDescription>Delete old audit logs or purge all rows.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="audit_delete_older">Older than days</Label>
            <Input
              id="audit_delete_older"
              type="number"
              value={deleteOlderThan}
              onChange={(event) => setDeleteOlderThan(Number(event.target.value) || 1)}
            />
          </div>
          <Button variant="outline" onClick={() => void deleteAuditRows(false)}>
            Delete old audit logs
          </Button>
          <Button variant="destructive" onClick={() => void deleteAuditRows(true)}>
            Delete all audit logs
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
