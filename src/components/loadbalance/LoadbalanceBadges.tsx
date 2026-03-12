import { Badge } from "@/components/ui/badge";
import type {
  LoadbalanceEventType,
  LoadbalanceFailureKind,
} from "@/lib/types/loadbalance";
import { cn } from "@/lib/utils";

const EVENT_TYPE_CONFIG = {
  opened: {
    label: "Opened",
    intent: "danger" as const,
  },
  extended: {
    label: "Extended",
    intent: "warning" as const,
  },
  probe_eligible: {
    label: "Probe Eligible",
    intent: "info" as const,
  },
  recovered: {
    label: "Recovered",
    intent: "success" as const,
  },
  not_opened: {
    label: "Not Opened",
    intent: "muted" as const,
  },
} as const;

const FAILURE_KIND_CONFIG = {
  transient_http: {
    label: "Transient HTTP",
    intent: "warning" as const,
  },
  auth_like: {
    label: "Auth Error",
    intent: "danger" as const,
  },
  connect_error: {
    label: "Connection Error",
    intent: "danger" as const,
  },
  timeout: {
    label: "Timeout",
    intent: "warning" as const,
  },
} as const;

const INTENT_CLASSES = {
  success: "bg-emerald-500/10 text-emerald-700 border-emerald-500/25 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-700 border-amber-500/25 dark:text-amber-400",
  danger: "bg-red-500/10 text-red-700 border-red-500/25 dark:text-red-400",
  info: "bg-sky-500/10 text-sky-700 border-sky-500/25 dark:text-sky-400",
  muted: "bg-muted text-muted-foreground",
} as const;

interface EventTypeBadgeProps {
  eventType: LoadbalanceEventType;
  className?: string;
}

export function EventTypeBadge({ eventType, className }: EventTypeBadgeProps) {
  const config = EVENT_TYPE_CONFIG[eventType];
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] shrink-0",
        INTENT_CLASSES[config.intent],
        className
      )}
    >
      {config.label}
    </Badge>
  );
}

interface FailureKindBadgeProps {
  failureKind: LoadbalanceFailureKind | null;
  className?: string;
}

export function FailureKindBadge({ failureKind, className }: FailureKindBadgeProps) {
  if (!failureKind) {
    return (
      <Badge
        variant="outline"
        className={cn("text-[10px] shrink-0", INTENT_CLASSES.muted, className)}
      >
        N/A
      </Badge>
    );
  }

  const config = FAILURE_KIND_CONFIG[failureKind];
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] shrink-0",
        INTENT_CLASSES[config.intent],
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
