import { useState, useEffect } from "react";
import { getUserTimezonePreference, getBrowserTimezone, formatTimestamp } from "@/lib/timezone";

export function useTimezone() {
  const [timezone, setTimezone] = useState<string>(getBrowserTimezone());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getUserTimezonePreference().then((tz) => {
      if (mounted) {
        setTimezone(tz);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const format = (isoString: string, options?: Intl.DateTimeFormatOptions) => {
    return formatTimestamp(isoString, timezone, options);
  };

  return { timezone, format, loading, refresh: () => getUserTimezonePreference().then(setTimezone) };
}
