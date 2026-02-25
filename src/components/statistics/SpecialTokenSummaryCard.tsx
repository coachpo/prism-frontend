import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatTokenCount } from "@/lib/costing";

interface SpecialTokenSummaryCardProps {
  cachedInputTokens: number | undefined;
  cacheCreationTokens: number | undefined;
  reasoningTokens: number | undefined;
}

export function SpecialTokenSummaryCard({
  cachedInputTokens,
  cacheCreationTokens,
  reasoningTokens,
}: SpecialTokenSummaryCardProps) {
  const allSpecialTotalsAreZero =
    cachedInputTokens === 0 && cacheCreationTokens === 0 && reasoningTokens === 0;

  const detail =
    cachedInputTokens === undefined ||
    cacheCreationTokens === undefined ||
    reasoningTokens === undefined
      ? undefined
      : `Cache Create ${formatTokenCount(cacheCreationTokens)} / Reasoning ${formatTokenCount(reasoningTokens)}`;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Special Tokens Captured</p>
            <span className="text-2xl font-bold tracking-tight">
              {formatTokenCount(cachedInputTokens)}
            </span>
            {detail ? <p className="text-xs text-muted-foreground">{detail}</p> : null}
            {allSpecialTotalsAreZero ? (
              <p className="text-xs text-muted-foreground">
                No special token capture in selected range.
              </p>
            ) : null}
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
