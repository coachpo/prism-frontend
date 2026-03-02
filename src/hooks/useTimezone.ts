import { useEffect, useState } from "react";
import { useProfileContext } from "@/context/ProfileContext";
import { formatTimestamp, getUserTimezonePreference } from "@/lib/timezone";

function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function useTimezone() {
  const { revision } = useProfileContext();
  const [timezone, setTimezone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadTimezone = async () => {
      setLoading(true);
      try {
        const tz = await getUserTimezonePreference();
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
  }, [revision]);

  const format = (isoString: string, options?: Intl.DateTimeFormatOptions) => {
    const effectiveTimezone = timezone ?? getBrowserTimezone();
    return formatTimestamp(isoString, effectiveTimezone, options);
  };

  return {
    timezone,
    format,
    loading,
    refresh: async () => {
      const tz = await getUserTimezonePreference();
      const effectiveTimezone = tz ?? getBrowserTimezone();
      setTimezone(effectiveTimezone);
      return effectiveTimezone;
    },
  };
}
