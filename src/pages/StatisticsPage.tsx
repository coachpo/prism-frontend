import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import type { RequestLogResponse, StatsSummaryResponse } from "@/lib/types";

export function StatisticsPage() {
  const [summary, setSummary] = useState<StatsSummaryResponse | null>(null);
  const [logs, setLogs] = useState<RequestLogResponse[]>([]);
  const [total, setTotal] = useState(0);

  const [modelFilter, setModelFilter] = useState("");
  const [providerFilter, setProviderFilter] = useState("");
  const [statusCodeFilter, setStatusCodeFilter] = useState("");
  const limit = 100;
  const [offset, setOffset] = useState(0);

  const [deleteOlderThan, setDeleteOlderThan] = useState(7);
  const [isLoading, setIsLoading] = useState(false);

  async function loadStats() {
    setIsLoading(true);
    try {
      const [nextSummary, nextLogs] = await Promise.all([
        api.stats.summary(),
        api.stats.requests({
          model_id: modelFilter || undefined,
          provider_type: providerFilter || undefined,
          status_code: statusCodeFilter ? Number(statusCodeFilter) : undefined,
          limit,
          offset,
        }),
      ]);

      setSummary(nextSummary);
      setLogs(nextLogs.items);
      setTotal(nextLogs.total);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load statistics";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset]);

  async function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOffset(0);
    await loadStats();
  }

  async function deleteRows(deleteAll = false) {
    try {
      await api.stats.delete({
        delete_all: deleteAll,
        older_than_days: deleteAll ? undefined : deleteOlderThan,
      });
      toast.success(deleteAll ? "All request logs deleted" : "Old request logs deleted");
      await loadStats();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete request logs";
      toast.error(message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Statistics</h1>
        <p className="text-sm text-muted-foreground">
          Request-level telemetry snapshots from `/api/v2/stats`.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total requests</CardDescription>
            <CardTitle>{summary?.total_requests ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Successful</CardDescription>
            <CardTitle>{summary?.successful_requests ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Failed</CardDescription>
            <CardTitle>{summary?.failed_requests ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total cost (micros)</CardDescription>
            <CardTitle>{summary?.total_cost_micros ?? 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-4" onSubmit={applyFilters}>
            <div className="space-y-1">
              <Label htmlFor="filter_model">Model ID</Label>
              <Input
                id="filter_model"
                value={modelFilter}
                onChange={(event) => setModelFilter(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="filter_provider">Provider type</Label>
              <Input
                id="filter_provider"
                value={providerFilter}
                onChange={(event) => setProviderFilter(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="filter_status">Status code</Label>
              <Input
                id="filter_status"
                value={statusCodeFilter}
                onChange={(event) => setStatusCodeFilter(event.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={isLoading}>
                Apply filters
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Request logs</CardTitle>
          <CardDescription>
            Showing {logs.length} entries (total {total})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="rounded border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">
                  {log.model_id} • {log.provider_type}
                </p>
                <span className="text-xs text-muted-foreground">
                  status {log.status_code} • {log.response_time_ms}ms
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                profile={log.profile_name_snapshot ?? "n/a"} • tokens={log.total_tokens ?? 0} •
                created={new Date(log.created_at).toLocaleString()}
              </p>
              {log.error_detail && (
                <p className="mt-1 text-xs text-destructive">error: {log.error_detail}</p>
              )}
            </div>
          ))}

          {!logs.length && !isLoading && (
            <p className="text-sm text-muted-foreground">No logs match the current filters.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Retention tools</CardTitle>
          <CardDescription>Delete old logs or purge everything.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="delete_older">Older than days</Label>
            <Input
              id="delete_older"
              type="number"
              value={deleteOlderThan}
              onChange={(event) => setDeleteOlderThan(Number(event.target.value) || 1)}
            />
          </div>
          <Button variant="outline" onClick={() => void deleteRows(false)}>
            Delete old logs
          </Button>
          <Button variant="destructive" onClick={() => void deleteRows(true)}>
            Delete all logs
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
