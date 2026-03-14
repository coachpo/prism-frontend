import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseTokenInputValue } from "../queryParams";

interface TokenRangeControlsProps {
  clearAllFilters: () => void;
  resetOffset: () => void;
  setTokenMax: (val: number | null) => void;
  setTokenMaxInput: (val: string | ((prev: string) => string)) => void;
  setTokenMin: (val: number | null) => void;
  setTokenMinInput: (val: string | ((prev: string) => string)) => void;
  tokenMaxInput: string;
  tokenMinInput: string;
}

function normalizeTokenInput(value: string): string {
  const parsed = parseTokenInputValue(value);
  return parsed === null ? "" : String(parsed);
}

export function TokenRangeControls({
  clearAllFilters,
  resetOffset,
  setTokenMax,
  setTokenMaxInput,
  setTokenMin,
  setTokenMinInput,
  tokenMaxInput,
  tokenMinInput,
}: TokenRangeControlsProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Token min</span>
        <Input
          value={tokenMinInput}
          onChange={(event) => setTokenMinInput(event.target.value)}
          onBlur={() => {
            setTokenMin(parseTokenInputValue(tokenMinInput));
            setTokenMinInput((prev) => normalizeTokenInput(prev));
            resetOffset();
          }}
          placeholder="optional"
          inputMode="numeric"
          className="h-8 text-xs"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Token max</span>
        <Input
          value={tokenMaxInput}
          onChange={(event) => setTokenMaxInput(event.target.value)}
          onBlur={() => {
            setTokenMax(parseTokenInputValue(tokenMaxInput));
            setTokenMaxInput((prev) => normalizeTokenInput(prev));
            resetOffset();
          }}
          placeholder="optional"
          inputMode="numeric"
          className="h-8 text-xs"
        />
      </div>

      <div className="flex justify-start sm:justify-end">
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={clearAllFilters}>
          Clear Filters
        </Button>
      </div>
    </div>
  );
}
