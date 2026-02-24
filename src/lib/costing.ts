const MICRO_FACTOR = 1_000_000;

const PRICING_UNIT_LABELS: Record<string, string> = {
  PER_1K: "Per 1K tokens",
  PER_1M: "Per 1M tokens",
};

const MISSING_SPECIAL_TOKEN_POLICY_LABELS: Record<string, string> = {
  MAP_TO_OUTPUT: "Map to output price",
  ZERO_COST: "Zero cost",
};

const UNPRICED_REASON_LABELS: Record<string, string> = {
  LEGACY_NO_COST_DATA: "Legacy (no cost data)",
  PRICING_DISABLED: "Pricing disabled",
  MISSING_PRICE_DATA: "Missing price data",
  MISSING_ENDPOINT: "Missing endpoint",
  MISSING_TOKEN_USAGE: "Missing token usage",
};

const FX_RATE_SOURCE_LABELS: Record<string, string> = {
  ENDPOINT_SPECIFIC: "Endpoint-specific rate",
  DEFAULT_1_TO_1: "Default (1:1)",
};

function formatEnumLabel(
  value: string | null | undefined,
  labels: Record<string, string>,
  fallback = "-"
): string {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  return labels[value] ?? value;
}

export function microsToDecimal(micros: number | null | undefined): number {
  if (micros === null || micros === undefined) {
    return 0;
  }
  return micros / MICRO_FACTOR;
}

export function formatMoneyMicros(
  micros: number | null | undefined,
  symbol: string,
  code?: string,
  minimumFractionDigits = 2,
  maximumFractionDigits = 6
): string {
  if (micros === null || micros === undefined) {
    return "-";
  }
  const value = microsToDecimal(micros);
  const formatted = value.toLocaleString(undefined, {
    minimumFractionDigits,
    maximumFractionDigits,
  });
  return `${symbol}${formatted}${code ? ` ${code}` : ""}`;
}

export function formatTokenCount(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "-";
  }
  return value.toLocaleString();
}

export function isValidCurrencyCode(value: string): boolean {
  return /^[A-Z]{3}$/.test(value.trim().toUpperCase());
}

export function isValidPositiveDecimalString(value: string): boolean {
  if (!value.trim()) {
    return false;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
    return false;
  }
  return parsed > 0;
}

export function formatPricingUnitLabel(value: string | null | undefined): string {
  return formatEnumLabel(value, PRICING_UNIT_LABELS);
}

export function formatMissingSpecialTokenPolicyLabel(
  value: string | null | undefined
): string {
  return formatEnumLabel(value, MISSING_SPECIAL_TOKEN_POLICY_LABELS);
}

export function formatUnpricedReasonLabel(value: string | null | undefined): string {
  return formatEnumLabel(value, UNPRICED_REASON_LABELS);
}

export function formatFxRateSourceLabel(value: string | null | undefined): string {
  return formatEnumLabel(value, FX_RATE_SOURCE_LABELS);
}
