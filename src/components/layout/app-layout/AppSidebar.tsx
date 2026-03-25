import { NavLink } from "react-router-dom";
import { ChevronsLeft, ChevronsRight, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/i18n/useLocale";
import { cn } from "@/lib/utils";
import { NAV_LINKS, VERSION_LABEL, type NavLabelKey } from "./navigationProfileConfig";

type Props = {
  activeProfileName: string;
  closeProfileSwitcher: () => void;
  desktopSidebarCollapsed?: boolean;
  hasMismatch: boolean;
  selectedProfileName: string;
  setSidebarOpen: (open: boolean) => void;
  sidebarOpen: boolean;
  toggleDesktopSidebar?: () => void;
};

export function AppSidebar({
  activeProfileName,
  closeProfileSwitcher,
  desktopSidebarCollapsed = false,
  hasMismatch,
  selectedProfileName,
  setSidebarOpen,
  sidebarOpen,
  toggleDesktopSidebar,
}: Props) {
  const { messages } = useLocale();
  const localizedNavLabels: Record<NavLabelKey, string> = messages.nav;
  const DesktopSidebarToggleIcon = desktopSidebarCollapsed ? ChevronsRight : ChevronsLeft;
  const desktopSidebarToggleLabel = desktopSidebarCollapsed
    ? messages.shell.expandSidebar
    : messages.shell.collapseSidebar;

  return (
    <aside
      aria-label={messages.shell.primaryNavigation}
      className={cn(
        "fixed left-0 top-0 z-50 flex h-full w-[min(88vw,320px)] flex-col overflow-x-hidden bg-sidebar text-sidebar-foreground shadow-2xl transition-[width,transform] duration-200 ease-in-out will-change-transform lg:w-[320px]",
        "pointer-events-auto translate-x-0 lg:pointer-events-auto lg:translate-x-0",
        desktopSidebarCollapsed && "lg:w-[72px]",
        !sidebarOpen && "max-lg:pointer-events-none max-lg:-translate-x-full"
      )}
    >
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-sidebar-primary to-sidebar-primary/70">
          <Zap className="h-3.5 w-3.5 text-sidebar-primary-foreground" />
        </div>
        <span className={cn("text-sm font-semibold tracking-tight", desktopSidebarCollapsed && "lg:hidden")}>
          Prism
        </span>
        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={toggleDesktopSidebar}
            aria-label={desktopSidebarToggleLabel}
            title={desktopSidebarToggleLabel}
            className="hidden touch-manipulation text-sidebar-foreground/50 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground lg:inline-flex"
          >
            <DesktopSidebarToggleIcon className="h-4 w-4" />
          </Button>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="touch-manipulation text-sidebar-foreground/50 transition-colors hover:text-sidebar-foreground lg:hidden"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">{messages.shell.closeSidebar}</span>
          </button>
        </div>
      </div>

      <div className={cn("border-b border-sidebar-border px-3 py-3", desktopSidebarCollapsed && "lg:hidden")}>
        <div className="rounded-lg border border-sidebar-border/80 bg-sidebar-accent/35 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/55">
              {messages.shell.profileRuntime}
            </p>
            <span
              className={cn(
                "rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                hasMismatch
                  ? "border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-200"
                  : "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-200"
              )}
            >
              {hasMismatch ? messages.shell.mismatch : messages.shell.aligned}
            </span>
          </div>
          <dl className="mt-2 grid grid-cols-[72px_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 text-xs">
            <dt className="text-sidebar-foreground/60">{messages.shell.viewing}</dt>
            <dd className="truncate font-medium text-sidebar-foreground/95">{selectedProfileName}</dd>
            <dt className="text-sidebar-foreground/60">{messages.shell.runtime}</dt>
            <dd className="truncate font-medium text-sidebar-foreground/95">{activeProfileName}</dd>
          </dl>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {NAV_LINKS.map(({ to, icon: Icon, labelKey }) => {
          const navLabel = localizedNavLabels[labelKey];

          return (
            <NavLink
              key={to}
              to={to}
              aria-label={desktopSidebarCollapsed ? navLabel : undefined}
              title={desktopSidebarCollapsed ? navLabel : undefined}
              onClick={() => {
                closeProfileSwitcher();
                setSidebarOpen(false);
              }}
              className={({ isActive }) =>
                cn(
                  "flex w-full touch-manipulation items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
                  desktopSidebarCollapsed && "lg:justify-center lg:gap-0 lg:px-2",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/55 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className={cn("truncate", desktopSidebarCollapsed && "lg:hidden")}>{navLabel}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className={cn("border-t border-sidebar-border px-3 py-2.5", desktopSidebarCollapsed && "lg:hidden")}>
        <span className="text-[11px] font-medium text-sidebar-foreground/35">{VERSION_LABEL}</span>
      </div>
    </aside>
  );
}
