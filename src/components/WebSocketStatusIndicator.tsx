import type { ConnectionState } from "@/lib/websocket";
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

const STATUS_STYLES: Record<ConnectionState, { dotClassName: string; label: string }> = {
  connected: {
    dotClassName: "bg-emerald-500 animate-pulse",
    label: "Connected",
  },
  connecting: {
    dotClassName: "bg-amber-500 animate-pulse",
    label: "Connecting...",
  },
  reconnecting: {
    dotClassName: "bg-amber-500 animate-pulse",
    label: "Reconnecting...",
  },
  disconnected: {
    dotClassName: "bg-gray-400",
    label: "Disconnected",
  },
};

export function WebSocketStatusIndicator({
  connectionState,
  isSyncing = false,
}: WebSocketStatusIndicatorProps) {
  const status = isSyncing
    ? { dotClassName: "bg-sky-500 animate-pulse", label: "Syncing..." }
    : STATUS_STYLES[connectionState];

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
