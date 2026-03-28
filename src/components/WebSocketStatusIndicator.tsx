import type { ConnectionState } from "@/lib/websocket";
import { getStaticMessages } from "@/i18n/staticMessages";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface WebSocketStatusIndicatorProps {
  connectionState: ConnectionState;
  isSyncing?: boolean;
}

export function WebSocketStatusIndicator({
  connectionState,
  isSyncing = false,
}: WebSocketStatusIndicatorProps) {
  const copy = getStaticMessages().common;
  const statusStyles: Record<ConnectionState, { dotClassName: string; label: string }> = {
    connected: {
      dotClassName: "bg-emerald-500 animate-pulse",
      label: copy.connected,
    },
    connecting: {
      dotClassName: "bg-amber-500 animate-pulse",
      label: copy.connecting,
    },
    reconnecting: {
      dotClassName: "bg-amber-500 animate-pulse",
      label: copy.reconnecting,
    },
    disconnected: {
      dotClassName: "bg-gray-400",
      label: copy.disconnected,
    },
  };
  const status = isSyncing
    ? { dotClassName: "bg-sky-500 animate-pulse", label: copy.syncing }
    : statusStyles[connectionState];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex h-2.5 w-2.5 shrink-0 rounded-full",
              status.dotClassName
            )}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>{status.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
