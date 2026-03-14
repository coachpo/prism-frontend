import { useEffect, useState } from "react";
import { useProfileContext } from "@/context/ProfileContext";
import {
  clearUserTimezonePreference,
  formatTimestamp,
  getUserTimezonePreference,
} from "@/lib/timezone";

function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function useTimezone() {
  const { revision, selectedProfileId } = useProfileContext();
  const [timezone, setTimezone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const timezoneKey = `${selectedProfileId ?? "none"}:${revision}`;

  useEffect(() => {
    let mounted = true;

    const loadTimezone = async () => {
      setLoading(true);
      try {
        const tz = await getUserTimezonePreference(timezoneKey);
        if (!mounted) return;
        setTimezone(tz ?? getBrowserTimezone());
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadTimezone();

    return () => {
      mounted = false;
    };
  }, [timezoneKey]);

  const format = (isoString: string, options?: Intl.DateTimeFormatOptions) => {
    const effectiveTimezone = timezone ?? getBrowserTimezone();
    return formatTimestamp(isoString, effectiveTimezone, options);
  };

  return {
    timezone,
    format,
    loading,
    refresh: async () => {
      clearUserTimezonePreference(timezoneKey);
      const tz = await getUserTimezonePreference(timezoneKey, true);
      const effectiveTimezone = tz ?? getBrowserTimezone();
      setTimezone(effectiveTimezone);
      return effectiveTimezone;
    },
  };
}
