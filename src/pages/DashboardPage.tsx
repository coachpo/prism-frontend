import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import type { ModelConfigListItem } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, TypeBadge, ValueBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Server, Zap, Globe, ArrowRight } from "lucide-react";
import { ProviderIcon } from "@/components/ProviderIcon";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";


export function DashboardPage() {
  const [models, setModels] = useState<ModelConfigListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.models.list()
      .then(setModels)
      .catch((err) => console.error("Failed to fetch dashboard data:", err))
      .finally(() => setLoading(false));
  }, []);

  const totalModels = models.length;
  const activeConnections = models.reduce((sum, m) => sum + m.active_connection_count, 0);
  const activeProviders = new Set(models.map((m) => m.provider.provider_type)).size;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[104px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of your LLM proxy configuration" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="Total Models"
          value={totalModels}
          detail="Configured models"
          icon={<Server className="h-4 w-4" />}
        />
        <MetricCard
          label="Active Endpoints"
          value={activeConnections}
          detail="Across all models"
          icon={<Zap className="h-4 w-4" />}
          className="[&_[data-slot=icon]]:bg-chart-2/15 [&_[data-slot=icon]]:text-chart-2"
        />
        <MetricCard
          label="Providers"
          value={activeProviders}
          detail="Unique providers"
          icon={<Globe className="h-4 w-4" />}
          className="[&_[data-slot=icon]]:bg-chart-3/15 [&_[data-slot=icon]]:text-chart-3"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {models.length === 0 ? (
            <EmptyState
              icon={<Server className="h-6 w-6" />}
              title="No models configured"
              description="Add your first model to get started with the proxy gateway."
            />
          ) : (
            <div className="divide-y">
              {models.map((model) => {
                const successRate = model.health_success_rate ?? 0;

                return (
                  <div
                    key={model.id}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/models/${model.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && navigate(`/models/${model.id}`)}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <ProviderIcon providerType={model.provider.provider_type} size={16} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {model.display_name || model.model_id}
                        </span>
                        {model.model_type === "proxy" ? (
                          <TypeBadge label="Proxy" intent="accent" />
                        ) : (
                          <TypeBadge label="Native" intent="info" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {model.model_type === "proxy" && model.redirect_to
                          ? `${model.model_id} → ${model.redirect_to}`
                          : model.model_id}
                      </p>
                    </div>

                    <div className="hidden sm:flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Endpoints</p>
                        <p className="text-sm font-medium">
                          {model.active_connection_count}/{model.connection_count}
                        </p>
                      </div>

                      {model.connection_count > 0 && (
                        <ValueBadge
                          label={`${successRate.toFixed(0)}%`}
                          intent={successRate >= 90 ? "success" : successRate >= 50 ? "warning" : "danger"}
                          className="text-xs tabular-nums"
                        />
                      )}
                    </div>

                    <StatusBadge
                      label={model.is_enabled ? "On" : "Off"}
                      intent={model.is_enabled ? "success" : "muted"}
                    />

                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

