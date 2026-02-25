import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SpecialTokenCoverageStripProps {
  totalRows: number;
  cachedCaptured: number;
  reasoningCaptured: number;
  anySpecialCaptured: number;
  noTokenUsage: number;
}

interface CoverageMetricProps {
  label: string;
  value: number;
  totalRows: number;
}

function CoverageMetric({ label, value, totalRows }: CoverageMetricProps) {
  const pct = totalRows > 0 ? Math.round((value / totalRows) * 100) : 0;

  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold tabular-nums">
        {value.toLocaleString()}
        <span className="ml-1 text-[11px] font-normal text-muted-foreground">({pct}%)</span>
      </p>
    </div>
  );
}

export function SpecialTokenCoverageStrip({
  totalRows,
  cachedCaptured,
  reasoningCaptured,
  anySpecialCaptured,
  noTokenUsage,
}: SpecialTokenCoverageStripProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Special Token Coverage (visible rows)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Visible request rows: {totalRows.toLocaleString()}
        </p>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <CoverageMetric
            label="Cached captured"
            value={cachedCaptured}
            totalRows={totalRows}
          />
          <CoverageMetric
            label="Reasoning captured"
            value={reasoningCaptured}
            totalRows={totalRows}
          />
          <CoverageMetric
            label="Any special captured"
            value={anySpecialCaptured}
            totalRows={totalRows}
          />
          <CoverageMetric
            label="No token usage"
            value={noTokenUsage}
            totalRows={totalRows}
          />
        </div>
      </CardContent>
    </Card>
  );
}
