import { useEffect, useState } from "react";
import { useProfileContext } from "@/context/ProfileContext";
import {
  formatTimestamp,
  getBrowserTimezone,
  getUserTimezonePreference,
} from "@/lib/timezone";

export function useTimezone() {
  const { revision } = useProfileContext();
  const [timezone, setTimezone] = useState<string>(getBrowserTimezone());
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
