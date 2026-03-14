import { NavLink } from "react-router-dom";
import { X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_LINKS, VERSION_LABEL } from "./navigationProfileConfig";

type Props = {
  activeProfileName: string;
  hasMismatch: boolean;
  selectedProfileName: string;
  setSidebarOpen: (open: boolean) => void;
  sidebarOpen: boolean;
};

export function AppSidebar({
  activeProfileName,
  hasMismatch,
  selectedProfileName,
  setSidebarOpen,
  sidebarOpen,
}: Props) {
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-50 flex h-full w-[min(88vw,320px)] flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 ease-in-out lg:w-[320px]",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-sidebar-primary to-sidebar-primary/70">
          <Zap className="h-3.5 w-3.5 text-sidebar-primary-foreground" />
        </div>
        <span className="text-sm font-semibold tracking-tight">Prism</span>
        <button
          onClick={() => setSidebarOpen(false)}
          className="ml-auto text-sidebar-foreground/50 transition-colors hover:text-sidebar-foreground lg:hidden"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close sidebar</span>
        </button>
      </div>

      <div className="border-b border-sidebar-border px-3 py-3">
        <div className="rounded-lg border border-sidebar-border/80 bg-sidebar-accent/35 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/55">
              Profile runtime
            </p>
            <span
              className={cn(
                "rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                hasMismatch
                  ? "border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-200"
                  : "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-200"
              )}
            >
              {hasMismatch ? "Mismatch" : "Aligned"}
            </span>
          </div>
          <dl className="mt-2 grid grid-cols-[72px_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 text-xs">
            <dt className="text-sidebar-foreground/60">Viewing</dt>
            <dd className="truncate font-medium text-sidebar-foreground/95">{selectedProfileName}</dd>
            <dt className="text-sidebar-foreground/60">Runtime</dt>
            <dd className="truncate font-medium text-sidebar-foreground/95">{activeProfileName}</dd>
          </dl>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {NAV_LINKS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/55 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-2.5">
        <span className="text-[11px] font-medium text-sidebar-foreground/35">{VERSION_LABEL}</span>
      </div>
    </aside>
  );
}
