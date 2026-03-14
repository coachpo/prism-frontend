import { Button } from "@/components/ui/button";
import type { RequestDetailTab } from "./queryParams";

interface RequestFocusBannerProps {
  detailTab: RequestDetailTab;
  onClear: () => void;
  requestId: number;
}

export function RequestFocusBanner({
  detailTab,
  onClear,
  requestId,
}: RequestFocusBannerProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/[0.08] via-background to-amber-500/[0.08] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
          Request focus
        </p>
        <p className="font-mono text-sm text-foreground">Investigating request #{requestId}</p>
        <p className="text-sm text-muted-foreground">
          {detailTab === "audit"
            ? "Audit detail opens automatically when a linked payload is available."
            : "Close the detail sheet or return to the browser to resume the full request timeline view."}
        </p>
      </div>
      <Button variant="outline" className="shrink-0" onClick={onClear}>
        Return to request browser
      </Button>
    </div>
  );
}
