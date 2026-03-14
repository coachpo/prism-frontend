import { Columns3, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProviderSelect } from "@/components/ProviderSelect";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Provider } from "@/lib/types";
import type { ModelColumnKey } from "./modelTableContracts";

type Props = {
  providerFilter: string;
  providers: Provider[];
  resetVisibleColumns: () => void;
  search: string;
  setProviderFilter: (value: string) => void;
  setSearch: (value: string) => void;
  setStatusFilter: (value: string) => void;
  setTypeFilter: (value: string) => void;
  statusFilter: string;
  typeFilter: string;
  updateColumnVisibility: (key: ModelColumnKey, checked: boolean) => void;
  visibleColumns: Record<ModelColumnKey, boolean>;
};

const COLUMN_LABELS: Array<{ key: ModelColumnKey; label: string }> = [
  { key: "provider", label: "Provider" },
  { key: "type", label: "Type" },
  { key: "strategy", label: "Strategy" },
  { key: "endpoints", label: "Endpoints" },
  { key: "success", label: "Success (24h)" },
  { key: "p95", label: "P95 (24h)" },
  { key: "requests", label: "Requests (24h)" },
  { key: "spend", label: "Spend (30d)" },
  { key: "status", label: "Status" },
];

export function ModelsToolbar({
  providerFilter,
  providers,
  resetVisibleColumns,
  search,
  setProviderFilter,
  setSearch,
  setStatusFilter,
  setTypeFilter,
  statusFilter,
  typeFilter,
  updateColumnVisibility,
  visibleColumns,
}: Props) {
  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div className="relative w-full xl:max-w-sm">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search models..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 pl-9"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <ProviderSelect
          value={providerFilter}
          onValueChange={setProviderFilter}
          providers={providers}
          className="h-9 w-auto min-w-[130px]"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-auto min-w-[110px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="enabled">On</SelectItem>
            <SelectItem value="disabled">Off</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-9 w-auto min-w-[110px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="native">Native</SelectItem>
            <SelectItem value="proxy">Proxy</SelectItem>
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <Columns3 className="h-4 w-4" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Visible Columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {COLUMN_LABELS.map(({ key, label }) => (
              <DropdownMenuCheckboxItem
                key={key}
                checked={visibleColumns[key]}
                onCheckedChange={(checked) => updateColumnVisibility(key, Boolean(checked))}
              >
                {label}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={resetVisibleColumns}>Reset Defaults</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
