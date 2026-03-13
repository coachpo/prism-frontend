import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface WebSocketStatusIndicatorProps {
  isConnected: boolean;
}

export function WebSocketStatusIndicator({
  isConnected,
}: WebSocketStatusIndicatorProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex h-2.5 w-2.5 shrink-0 rounded-full",
              isConnected ? "animate-pulse bg-emerald-500" : "bg-gray-400"
            )}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>{isConnected ? "Connected" : "Disconnected"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
