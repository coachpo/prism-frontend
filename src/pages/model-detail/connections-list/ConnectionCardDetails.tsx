import { Loader2 } from "lucide-react";
import type { Connection } from "@/lib/types";
import type { FormatTime } from "./connectionCardTypes";

export function ConnectionCardDetails({
  connection,
  formatTime,
  isChecking,
}: {
  connection: Connection;
  formatTime: FormatTime;
  isChecking: boolean;
}) {
  const endpoint = connection.endpoint;
  const maskedKey = endpoint?.masked_api_key || "......";

  return (
    <>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="truncate font-medium">{endpoint?.name ?? "Unknown endpoint"}</span>
        <span className="text-muted-foreground/70">.</span>
        <span className="font-mono break-all">{endpoint?.base_url}</span>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>Key: {maskedKey}</span>
        {isChecking ? (
          <span className="inline-flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Checking now...
          </span>
        ) : connection.last_health_check ? (
          <span>
            Checked {formatTime(connection.last_health_check, {
              hour: "numeric",
              minute: "numeric",
              second: "numeric",
              hour12: true,
            })}
          </span>
        ) : (
          <span>Not checked yet</span>
        )}
      </div>
    </>
  );
}
