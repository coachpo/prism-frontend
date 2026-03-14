import { api } from "@/lib/api";

const timezonePreferenceCache = new Map<string, string | null>();
const timezonePreferenceRequestCache = new Map<string, Promise<string | null>>();

export async function getUserTimezonePreference(
  cacheKey: string,
  forceRefresh = false,
): Promise<string | null> {
  if (!forceRefresh && timezonePreferenceCache.has(cacheKey)) {
    return timezonePreferenceCache.get(cacheKey) ?? null;
  }

  if (!forceRefresh) {
    const inFlightRequest = timezonePreferenceRequestCache.get(cacheKey);
    if (inFlightRequest) {
      return inFlightRequest;
    }
  }

  const loadPromise = api.settings.costing
    .get()
    .then((settings) => {
      const preference = settings.timezone_preference ?? null;
      timezonePreferenceCache.set(cacheKey, preference);
      return preference;
    })
    .finally(() => {
      if (timezonePreferenceRequestCache.get(cacheKey) === loadPromise) {
        timezonePreferenceRequestCache.delete(cacheKey);
      }
    });

  timezonePreferenceRequestCache.set(cacheKey, loadPromise);
  return loadPromise;
}

export function clearUserTimezonePreference(cacheKey?: string) {
  if (cacheKey === undefined) {
    timezonePreferenceCache.clear();
    timezonePreferenceRequestCache.clear();
    return;
  }

  timezonePreferenceCache.delete(cacheKey);
  timezonePreferenceRequestCache.delete(cacheKey);
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
