import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatProviderType } from "@/lib/utils";
import type { Provider } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProviderIcon } from "@/components/ProviderIcon";

interface ProviderSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  /** Whether the value emitted is `provider_type` string or `provider_id` (numeric string). Default: "provider_type" */
  valueType?: "provider_type" | "provider_id";
  /** Show an "All Providers" option. Default: true */
  showAll?: boolean;
  /** Label for the "All" option. Default: "All Providers" */
  allLabel?: string;
  /** Pass providers externally to skip internal fetch */
  providers?: Provider[];
  className?: string;
  placeholder?: string;
}

export function ProviderSelect({
  value,
  onValueChange,
  valueType = "provider_type",
  showAll = true,
  allLabel = "All Providers",
  providers: externalProviders,
  className,
  placeholder = "Provider",
}: ProviderSelectProps) {
  const [internalProviders, setInternalProviders] = useState<Provider[]>([]);

  useEffect(() => {
    if (!externalProviders) {
      api.providers.list().then(setInternalProviders).catch(console.error);
    }
  }, [externalProviders]);

  const providers = externalProviders ?? internalProviders;

  const itemValue = (p: Provider) =>
    valueType === "provider_id" ? String(p.id) : p.provider_type;

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {showAll && <SelectItem value="all">{allLabel}</SelectItem>}
        {providers.map((p) => (
          <SelectItem key={p.id} value={itemValue(p)}>
            <span className="flex items-center gap-2">
              <ProviderIcon providerType={p.provider_type} size={14} />
              {formatProviderType(p.provider_type)}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
