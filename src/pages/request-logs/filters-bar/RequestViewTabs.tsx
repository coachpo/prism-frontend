import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VIEW_OPTIONS } from "../queryParams";
import type { ViewType } from "../queryParams";

interface RequestViewTabsProps {
  setView: (view: ViewType) => void;
  view: ViewType;
}

export function RequestViewTabs({ setView, view }: RequestViewTabsProps) {
  return (
    <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1">
      <Tabs value={view} onValueChange={(next) => setView(next as ViewType)} className="w-full">
        <TabsList className="w-full justify-start sm:w-auto">
          {VIEW_OPTIONS.map((option) => (
            <TabsTrigger key={option.value} value={option.value} className="gap-2 px-3">
              <option.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{option.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
