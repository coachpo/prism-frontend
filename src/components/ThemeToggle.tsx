import { useTheme } from "next-themes";
import { Check, Laptop, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Laptop },
] as const;

export function ThemeToggle() {
  const { theme = "system", setTheme } = useTheme();
  const activeTheme = themeOptions.find((option) => option.value === theme) ?? themeOptions[2];
  const ActiveIcon = activeTheme.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:hover:bg-accent/60"
        >
          <ActiveIcon className="h-4 w-4" />
          <span className="sr-only">Change theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {themeOptions.map((option) => {
          const OptionIcon = option.icon;

          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setTheme(option.value)}
              className="justify-between"
            >
              <span className="inline-flex items-center gap-2">
                <OptionIcon className="h-4 w-4 text-muted-foreground" />
                {option.label}
              </span>
              <Check
                className={cn(
                  "h-4 w-4 text-primary transition-opacity",
                  theme === option.value ? "opacity-100" : "opacity-0"
                )}
              />
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
