import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/i18n/useLocale";

export function FxMappingsSummary() {
  const { locale } = useLocale();
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-medium">{locale === "zh-CN" ? "FX 映射" : "FX mappings"}</h4>
        <Badge variant="outline">{locale === "zh-CN" ? "默认 FX = 1.0" : "Default FX = 1.0"}</Badge>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {locale === "zh-CN" ? "映射会覆盖默认值。" : "Mapping overrides default."}
      </p>
    </>
  );
}
