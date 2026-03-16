import type { Connection, CostingSettingsUpdate, EndpointFxMapping } from "@/lib/types";
import { isValidPositiveDecimalString } from "@/lib/costing";

export const SETTINGS_SECTIONS = [
  { id: "backup", label: "Backup" },
  { id: "authentication", label: "Authentication" },
  { id: "billing-currency", label: "Billing & Currency" },
  { id: "timezone", label: "Timezone" },
  { id: "audit-configuration", label: "Audit & Privacy" },
  { id: "retention-deletion", label: "Retention & Deletion" },
] as const;

export const SETTINGS_SECTION_IDS = new Set<string>(SETTINGS_SECTIONS.map((section) => section.id));

export type CleanupType = "" | "requests" | "audits" | "loadbalance_events";
export type DeleteCleanupType = Exclude<CleanupType, "">;
export type RetentionPreset = "" | "7" | "30" | "90" | "all";

export const DELETE_CONFIRM_KEYWORD = "DELETE";
export const FX_RATE_MAX_DECIMALS = 6;
export const TIMEZONE_PREVIEW_SOURCE = new Date("2026-02-27T21:39:00Z");
export const AUTH_PASSWORD_MIN_LENGTH = 8;
export const AUTH_PASSWORD_MAX_LENGTH = 512;

export function getCleanupTypeLabel(type: DeleteCleanupType): string {
  switch (type) {
    case "requests":
      return "Request Logs";
    case "audits":
      return "Audit Logs";
    case "loadbalance_events":
      return "Loadbalance Events";
  }
}

export const DEFAULT_COSTING_FORM: CostingSettingsUpdate = {
  report_currency_code: "USD",
  report_currency_symbol: "$",
  timezone_preference: null,
  endpoint_fx_mappings: [],
};

export const getConnectionName = (connection: Pick<Connection, "name">): string =>
  connection.name ?? "";

export const getMappingKey = (mapping: EndpointFxMapping): string =>
  `${mapping.model_id}::${mapping.endpoint_id}`;

export const normalizeMappings = (mappings: EndpointFxMapping[]): EndpointFxMapping[] =>
  [...mappings]
    .map((mapping) => ({
      ...mapping,
      fx_rate: mapping.fx_rate.trim(),
    }))
    .sort((a, b) => {
      if (a.model_id === b.model_id) {
        return a.endpoint_id - b.endpoint_id;
      }
      return a.model_id.localeCompare(b.model_id);
    });

export const normalizeCostingForm = (form: CostingSettingsUpdate): CostingSettingsUpdate => ({
  report_currency_code: form.report_currency_code.trim().toUpperCase(),
  report_currency_symbol: form.report_currency_symbol.trim(),
  timezone_preference: form.timezone_preference ?? null,
  endpoint_fx_mappings: normalizeMappings(form.endpoint_fx_mappings),
});

export const areMappingsEqual = (left: EndpointFxMapping[], right: EndpointFxMapping[]): boolean => {
  if (left.length !== right.length) {
    return false;
  }
  for (let index = 0; index < left.length; index += 1) {
    if (
      left[index].model_id !== right[index].model_id ||
      left[index].endpoint_id !== right[index].endpoint_id ||
      left[index].fx_rate !== right[index].fx_rate
    ) {
      return false;
    }
  }
  return true;
};

export const validateFxRate = (rawValue: string): string | null => {
  const value = rawValue.trim();
  if (!value) {
    return "FX rate is required";
  }
  if (!isValidPositiveDecimalString(value)) {
    return "FX rate must be greater than zero";
  }
  const [, decimals = ""] = value.split(".");
  if (decimals.length > FX_RATE_MAX_DECIMALS) {
    return `Use up to ${FX_RATE_MAX_DECIMALS} decimal places`;
  }
  return null;
};

export const validateMappings = (mappings: EndpointFxMapping[]): string | null => {
  const seen = new Set<string>();
  for (const mapping of mappings) {
    const key = getMappingKey(mapping);
    if (seen.has(key)) {
      return `Duplicate FX mapping detected for ${mapping.model_id} #${mapping.endpoint_id}`;
    }
    seen.add(key);

    const fxRateError = validateFxRate(mapping.fx_rate);
    if (fxRateError) {
      return `FX rate for ${mapping.model_id} #${mapping.endpoint_id}: ${fxRateError}`;
    }
  }
  return null;
};

export const validateAuthPassword = (value: string): string | null => {
  if (!value) {
    return null;
  }
  if (value.length < AUTH_PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${AUTH_PASSWORD_MIN_LENGTH} characters`;
  }
  if (value.length > AUTH_PASSWORD_MAX_LENGTH) {
    return `Password must be at most ${AUTH_PASSWORD_MAX_LENGTH} characters`;
  }
  return null;
};

export const formatFxRateDisplay = (value: string): string => {
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) {
    return value;
  }
  return numeric.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: FX_RATE_MAX_DECIMALS,
  });
};

export const formatTimezonePreview = (timezone: string): string => {
  try {
    const parts = new Intl.DateTimeFormat("sv-SE", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(TIMEZONE_PREVIEW_SOURCE);

    const byType = new Map(parts.map((part) => [part.type, part.value]));
    const year = byType.get("year") ?? "0000";
    const month = byType.get("month") ?? "00";
    const day = byType.get("day") ?? "00";
    const hour = byType.get("hour") ?? "00";
    const minute = byType.get("minute") ?? "00";
    return `${year}-${month}-${day} ${hour}:${minute}`;
  } catch {
    return "Unavailable";
  }
};
