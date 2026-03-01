import { useEffect, useState } from "react";
import { useProfileContext } from "@/context/ProfileContext";
import { formatTimestamp, getUserTimezonePreference } from "@/lib/timezone";

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
        setTimezone(tz);
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
    if (!timezone) {
      return "-";
    }
    return formatTimestamp(isoString, timezone, options);
  };

  return {
    timezone,
    format,
    loading,
    refresh: async () => {
      const tz = await getUserTimezonePreference();
      setTimezone(tz);
      return tz;
    },
  };
}
