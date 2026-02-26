import { useEffect, useMemo, useState } from "react";
import { Activity, Database, Shield, ShieldOff } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import type { Provider, StatsSummaryResponse, TelemetrySnapshot } from "@/lib/types";

export function DashboardPage() {
  const auth = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [summary, setSummary] = useState<StatsSummaryResponse | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetrySnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [nextProviders, nextSummary, nextTelemetry] = await Promise.all([
          api.providers.list(),
          api.stats.summary(),
          api.stats.telemetry(),
        ]);
        if (!mounted) {
          return;
        }
        setProviders(nextProviders);
        setSummary(nextSummary);
        setTelemetry(nextTelemetry);
        setError(null);
      } catch (nextError) {
        if (!mounted) {
          return;
        }
        setError(nextError instanceof Error ? nextError.message : "Failed to load dashboard");
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const totalProfiles = useMemo(
    () => providers.reduce((acc, provider) => acc + provider.profile_count, 0),
    [providers],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Prism V2 Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Profile-centric routing, auth controls, and batched telemetry health.
        </p>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Auth mode</CardDescription>
            <CardTitle className="flex items-center gap-2 text-lg">
              {auth.authEnabled ? <Shield className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
              {auth.authEnabled ? "Enabled" : "Disabled"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {auth.authEnabled
              ? auth.isAuthenticated
                ? "Authenticated session active"
                : "Sign in required for protected APIs"
              : "Open mode for local trusted use"}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Providers</CardDescription>
            <CardTitle className="text-lg">{providers.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Built-in providers with {totalProfiles} configured profiles.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total requests</CardDescription>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-4 w-4" />
              {summary?.total_requests ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {summary?.successful_requests ?? 0} success / {summary?.failed_requests ?? 0} failed
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Telemetry queue depth</CardDescription>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="h-4 w-4" />
              {telemetry?.queue_depth ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Batched write worker status from `/api/v2/stats/telemetry`.
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Providers</CardTitle>
          <CardDescription>Profile counts by provider type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {providers.map((provider) => (
              <div key={provider.id} className="flex items-center justify-between rounded border p-3">
                <div>
                  <p className="font-medium">{provider.name}</p>
                  <p className="text-xs text-muted-foreground">{provider.provider_type}</p>
                </div>
                <span className="text-sm font-semibold">{provider.profile_count} profiles</span>
              </div>
            ))}
            {!providers.length && (
              <p className="text-sm text-muted-foreground">No providers available.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
