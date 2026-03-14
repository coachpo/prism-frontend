import { Badge } from "@/components/ui/badge";

export function FxMappingsSummary() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-medium">FX mappings</h4>
        <Badge variant="outline">Default FX = 1.0</Badge>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Mapping overrides default.</p>
    </>
  );
}
