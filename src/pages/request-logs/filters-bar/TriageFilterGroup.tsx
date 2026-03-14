import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TRIAGE_OPTIONS } from "../queryParams";
import type { TriageFilter } from "../queryParams";

interface TriageFilterGroupProps {
  resetOffset: () => void;
  setTriage: (triage: TriageFilter) => void;
  triage: TriageFilter;
}

export function TriageFilterGroup({
  resetOffset,
  setTriage,
  triage,
}: TriageFilterGroupProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      <span className="flex items-center gap-1 whitespace-nowrap text-xs font-medium text-muted-foreground">
        <Filter className="h-3 w-3" />
        Triage:
      </span>
      {TRIAGE_OPTIONS.map((option) => (
        <Button
          key={option.value}
          variant={triage === option.value ? "default" : "outline"}
          size="sm"
          className={cn(
            "h-7 gap-1.5 rounded-full border-dashed text-xs whitespace-nowrap",
            triage === option.value && "border-solid"
          )}
          onClick={() => {
            setTriage(triage === option.value ? "none" : option.value);
            resetOffset();
          }}
        >
          <option.icon className="h-3 w-3" />
          {option.label}
          {triage === option.value ? <X className="h-3 w-3" /> : null}
        </Button>
      ))}
    </div>
  );
}
