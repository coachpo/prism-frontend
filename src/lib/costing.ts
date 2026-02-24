const MICRO_FACTOR = 1_000_000;

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
