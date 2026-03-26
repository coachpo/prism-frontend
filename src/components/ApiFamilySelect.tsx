import { ApiFamilyIcon } from "@/components/ApiFamilyIcon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ApiFamily } from "@/lib/types";
import { formatApiFamily } from "@/lib/utils";

interface ApiFamilySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  apiFamilies?: ApiFamily[];
  showAll?: boolean;
  allLabel?: string;
  className?: string;
  placeholder?: string;
}

const DEFAULT_API_FAMILIES: ApiFamily[] = ["openai", "anthropic", "gemini"];

export function ApiFamilySelect({
  value,
  onValueChange,
  apiFamilies = DEFAULT_API_FAMILIES,
  showAll = true,
  allLabel = "All API Families",
  className,
  placeholder = "API Family",
}: ApiFamilySelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {showAll ? <SelectItem value="all">{allLabel}</SelectItem> : null}
        {apiFamilies.map((apiFamily) => (
          <SelectItem key={apiFamily} value={apiFamily}>
            <span className="flex items-center gap-2">
              <ApiFamilyIcon apiFamily={apiFamily} size={14} />
              {formatApiFamily(apiFamily)}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
