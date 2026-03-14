import { Boxes, Link2, Sparkles } from "lucide-react";

interface EndpointsSummaryCardsProps {
  endpointsCount: number;
  totalAttachedModels: number;
  uniqueAttachedModels: number;
  endpointsInUse: number;
}

export function EndpointsSummaryCards({
  endpointsCount,
  totalAttachedModels,
  uniqueAttachedModels,
  endpointsInUse,
}: EndpointsSummaryCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Configured Endpoints
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{endpointsCount}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary">
            <Boxes className="h-4 w-4" />
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Attached Models
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{totalAttachedModels}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary">
            <Link2 className="h-4 w-4" />
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-4 sm:col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Unique Models In Use
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{uniqueAttachedModels}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          {endpointsInUse} of {endpointsCount} endpoints mapped
        </p>
      </div>
    </div>
  );
}
