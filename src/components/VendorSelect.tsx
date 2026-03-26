import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Vendor } from "@/lib/types";

interface VendorSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  valueType?: "vendor_id" | "vendor_key";
  showAll?: boolean;
  allLabel?: string;
  vendors: Vendor[];
  className?: string;
  placeholder?: string;
}

export function VendorSelect({
  value,
  onValueChange,
  valueType = "vendor_id",
  showAll = true,
  allLabel = "All Vendors",
  vendors,
  className,
  placeholder = "Vendor",
}: VendorSelectProps) {
  const itemValue = (vendor: Vendor) =>
    valueType === "vendor_id" ? String(vendor.id) : vendor.key;

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {showAll ? <SelectItem value="all">{allLabel}</SelectItem> : null}
        {vendors.map((vendor) => (
          <SelectItem key={vendor.id} value={itemValue(vendor)}>
            <span className="flex items-center gap-2">{vendor.name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
