import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type Props = {
  search: string;
  setSearch: (value: string) => void;
};

export function ModelsToolbar({ search, setSearch }: Props) {
  return (
    <div className="relative w-full xl:max-w-sm">
      <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search models..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="h-9 pl-9"
      />
    </div>
  );
}
