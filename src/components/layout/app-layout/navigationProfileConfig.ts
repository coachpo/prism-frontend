import {
  LayoutDashboard,
  Server,
  BarChart3,
  Settings,
  Coins,
  Plug,
  KeyRound,
  FileText,
  Scale,
} from "lucide-react";
import type { Messages } from "@/i18n/messages/en";

interface NavLinkConfig {
  icon: typeof LayoutDashboard;
  labelKey: keyof Messages["nav"];
  to: string;
}

export const NAV_LINKS: NavLinkConfig[] = [
  { to: "/dashboard", icon: LayoutDashboard, labelKey: "dashboard" },
  { to: "/models", icon: Server, labelKey: "models" },
  { to: "/endpoints", icon: Plug, labelKey: "endpoints" },
  { to: "/loadbalance-strategies", icon: Scale, labelKey: "loadbalanceStrategies" },
  { to: "/pricing-templates", icon: Coins, labelKey: "pricingTemplates" },
  { to: "/statistics", icon: BarChart3, labelKey: "statistics" },
  { to: "/request-logs", icon: FileText, labelKey: "requestLogs" },
  { to: "/proxy-api-keys", icon: KeyRound, labelKey: "apiKeys" },
  { to: "/settings", icon: Settings, labelKey: "settings" },
];

export type NavLabelKey = keyof Messages["nav"];

export const PROFILE_SCOPED_PREFIXES = [
  "/models",
  "/endpoints",
  "/loadbalance-strategies",
  "/pricing-templates",
  "/statistics",
  "/request-logs",
];

export const MAX_PROFILES = 10;

const APP_VERSION_PREFIX = "2.0";
const GIT_RUN_NUMBER = String(import.meta.env.VITE_GIT_RUN_NUMBER ?? "local").trim() || "local";
const GIT_REVISION = String(import.meta.env.VITE_GIT_REVISION ?? "unknown").trim() || "unknown";

export const VERSION_LABEL = `${APP_VERSION_PREFIX}.${GIT_RUN_NUMBER} - ${GIT_REVISION}`;
