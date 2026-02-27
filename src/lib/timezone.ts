import { api } from "@/lib/api";

export function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export async function getUserTimezonePreference(): Promise<string> {
  try {
    const settings = await api.settings.costing.get();
    if (settings.timezone_preference) {
      return settings.timezone_preference;
    }
  } catch (error) {
    console.error("Failed to fetch timezone preference:", error);
  }
  return getBrowserTimezone();
}

export function formatTimestamp(
  isoString: string,
  timezone: string,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!isoString) return "-";
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
      ...options,
    }).format(date);
  } catch (error) {
    console.error("Error formatting timestamp:", error);
    return isoString;
  }
}
