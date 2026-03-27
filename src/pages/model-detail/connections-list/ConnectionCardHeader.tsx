import { StatusBadge, ValueBadge } from "@/components/StatusBadge";
import { useLocale } from "@/i18n/useLocale";
import type { Connection } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getHealthBadgeProps, getPriorityBadgeClasses } from "./ConnectionCardSectionsShared";

export function ConnectionCardHeader({
  connection,
  connectionName,
  isChecking,
}: {
  connection: Connection;
  connectionName: string;
  isChecking: boolean;
}) {
  const { messages } = useLocale();
  const copy = messages.modelDetail;
  const { healthLabel, healthIntent } = getHealthBadgeProps(connection.health_status, isChecking, {
    checking: copy.healthChecking,
    healthy: copy.healthHealthy,
    unhealthy: copy.healthUnhealthy,
    unknown: copy.healthUnknown,
  });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={cn(
          "inline-flex h-2.5 w-2.5 shrink-0 rounded-full",
          isChecking
            ? "animate-pulse bg-primary/70"
            : connection.health_status === "healthy"
              ? "bg-emerald-500"
              : connection.health_status === "unhealthy"
                ? "bg-destructive"
                : "bg-muted-foreground/50",
        )}
      />
      <span className="truncate text-sm font-medium">{connectionName}</span>
      <StatusBadge label={healthLabel} intent={healthIntent} />
      <ValueBadge
        label={`P${connection.priority}`}
        intent="default"
        className={cn("tabular-nums", getPriorityBadgeClasses(connection.priority))}
      />
      <StatusBadge
        label={connection.pricing_template ? copy.pricingOn : copy.pricingOff}
        intent={connection.pricing_template ? "success" : "muted"}
      />
      {connection.pricing_template ? (
        <div className="flex items-center gap-1">
          <ValueBadge
            label={`${connection.pricing_template.name} v${connection.pricing_template.version}`}
            intent="info"
          />
          <ValueBadge label={connection.pricing_template.pricing_currency_code} intent="accent" />
        </div>
      ) : null}
      {!connection.is_active ? <StatusBadge label={copy.inactive} intent="muted" /> : null}
    </div>
  );
}
