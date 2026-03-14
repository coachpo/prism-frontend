import { useEffect, useState } from "react";
import { useProfileContext } from "@/context/ProfileContext";
import { formatTimestamp, getUserTimezonePreference } from "@/lib/timezone";

let timezonePreferencePromise:
  | {
      key: string;
      promise: Promise<string | null>;
    }
  | null = null;

async function loadTimezonePreference(
  key: string,
  reuseInFlight = false,
): Promise<string | null> {
  if (reuseInFlight && timezonePreferencePromise?.key === key) {
    return timezonePreferencePromise.promise;
  }

  const loadPromise = getUserTimezonePreference();

  if (reuseInFlight) {
    timezonePreferencePromise = {
      key,
      promise: loadPromise,
    };
    void loadPromise.finally(() => {
      if (timezonePreferencePromise?.promise === loadPromise) {
        timezonePreferencePromise = null;
      }
    });
  }

  return loadPromise;
}

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
        const tz = await loadTimezonePreference(timezoneKey, true);
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
      const tz = await loadTimezonePreference(timezoneKey, false);
      const effectiveTimezone = tz ?? getBrowserTimezone();
      setTimezone(effectiveTimezone);
      return effectiveTimezone;
    },
  };
}
