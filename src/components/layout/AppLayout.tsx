import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  BarChart3,
  FileSearch,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Shield,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const navLinks = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/profiles", icon: Shield, label: "Profiles" },
  { to: "/statistics", icon: BarChart3, label: "Statistics" },
  { to: "/audit", icon: FileSearch, label: "Audit" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const auth = useAuth();

  async function handleLogout() {
    try {
      await auth.logout();
      toast.success("Logged out");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to log out";
      toast.error(message);
    }
  }

  return (
    <div className="flex h-screen w-full bg-background text-foreground">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-[240px] flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 ease-in-out",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
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

        <nav className="flex-1 space-y-0.5 px-2 py-3">
          {navLinks.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/55 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-2 border-t border-sidebar-border px-3 py-2.5">
          {auth.authEnabled && auth.isAuthenticated && (
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Log out
            </Button>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-sidebar-foreground/35">v1.0</span>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col lg:ml-[240px]">
        <header className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur-sm lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open sidebar</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
              <Zap className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Prism</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
