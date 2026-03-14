import { ShieldAlert, ShieldCheck } from "lucide-react";

interface ProxyKeyStatusCalloutProps {
  authEnabled: boolean;
}

export function ProxyKeyStatusCallout({ authEnabled }: ProxyKeyStatusCalloutProps) {
  return (
    <div
      className={
        authEnabled
          ? "rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-4"
          : "rounded-lg border border-amber-500/25 bg-amber-500/10 p-4"
      }
    >
      <div className="flex items-start gap-3">
        {authEnabled ? (
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-300" />
        ) : (
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
        )}
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {authEnabled
              ? "Keys are active for protected proxy traffic."
              : "Keys are prepared but not enforced until authentication is enabled."}
          </p>
          <p className="text-sm text-muted-foreground">
            {authEnabled
              ? "Requests to `/v1/*` and `/v1beta/*` must present a valid key."
              : "Enable authentication in Settings when you are ready to enforce these keys."}
          </p>
        </div>
      </div>
    </div>
  );
}
