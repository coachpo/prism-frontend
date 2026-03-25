import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocale } from "@/i18n/useLocale";

type LanguageSwitcherProps = {
  className?: string;
};

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { locale, messages, setLocale } = useLocale();

  return (
    <fieldset
      className={cn("inline-flex items-center rounded-md border bg-background/80 p-0.5", className)}
    >
      <legend className="sr-only">{messages.locale.label}</legend>
      <Button
        type="button"
        variant={locale === "en" ? "secondary" : "ghost"}
        className="h-8 rounded-sm px-2 text-xs"
        onClick={() => setLocale("en")}
      >
        {messages.locale.options.en}
      </Button>
      <Button
        type="button"
        variant={locale === "zh-CN" ? "secondary" : "ghost"}
        className="h-8 rounded-sm px-2 text-xs"
        onClick={() => setLocale("zh-CN")}
      >
        {messages.locale.options["zh-CN"]}
      </Button>
    </fieldset>
  );
}
