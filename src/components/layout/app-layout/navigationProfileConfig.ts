import {
  LayoutDashboard,
  Server,
  BarChart3,
  Settings,
  Coins,
  Plug,
  Logs,
  KeyRound,
} from "lucide-react";

export const NAV_LINKS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/models", icon: Server, label: "Models" },
  { to: "/endpoints", icon: Plug, label: "Endpoints" },
  { to: "/pricing-templates", icon: Coins, label: "Pricing Templates" },
  { to: "/statistics", icon: BarChart3, label: "Statistics" },
  { to: "/request-logs", icon: Logs, label: "Request Logs" },
  { to: "/proxy-api-keys", icon: KeyRound, label: "API Keys" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export const PROFILE_SCOPED_PREFIXES = [
  "/models",
  "/endpoints",
  "/pricing-templates",
  "/statistics",
  "/request-logs",
];

export const MAX_PROFILES = 10;

const APP_VERSION_PREFIX = "v1";
const GIT_RUN_NUMBER = String(import.meta.env.VITE_GIT_RUN_NUMBER ?? "local").trim() || "local";
const GIT_REVISION = String(import.meta.env.VITE_GIT_REVISION ?? "unknown").trim() || "unknown";

export const VERSION_LABEL = `${APP_VERSION_PREFIX}.${GIT_RUN_NUMBER}-${GIT_REVISION}`;
