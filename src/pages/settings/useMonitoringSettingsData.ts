import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { getStaticMessages } from "@/i18n/staticMessages";
import type { MonitoringSettingsResponse } from "@/lib/types";
import type { SettingsSaveSection } from "./settingsSaveTypes";
import {
  clampMonitoringPollIntervalSeconds,
  DEFAULT_MONITORING_POLL_INTERVAL_SECONDS,
} from "../monitoring/monitoringPolling";

interface UseMonitoringSettingsDataInput {
  revision: number;
  setRecentlySavedSection: (section: SettingsSaveSection) => void;
}

function toInputValue(settings: MonitoringSettingsResponse | null): string {
  return String(
    clampMonitoringPollIntervalSeconds(
      settings?.monitoring_probe_interval_seconds ?? DEFAULT_MONITORING_POLL_INTERVAL_SECONDS,
    ),
  );
}

export function useMonitoringSettingsData({
  revision,
  setRecentlySavedSection,
}: UseMonitoringSettingsDataInput) {
  const [settings, setSettings] = useState<MonitoringSettingsResponse | null>(null);
  const [monitoringIntervalSeconds, setMonitoringIntervalSeconds] = useState(
    String(DEFAULT_MONITORING_POLL_INTERVAL_SECONDS),
  );
  const [monitoringLoading, setMonitoringLoading] = useState(true);
  const [monitoringSaving, setMonitoringSaving] = useState(false);
  const [monitoringUnavailable, setMonitoringUnavailable] = useState(false);
  const [monitoringError, setMonitoringError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const loadSettings = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setMonitoringLoading(true);
    setMonitoringError(null);

    try {
      const response = await api.settings.monitoring.get();
      if (requestId !== requestIdRef.current) {
        return;
      }

      setSettings(response);
      setMonitoringIntervalSeconds(toInputValue(response));
      setMonitoringUnavailable(false);
    } catch (loadError) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setMonitoringUnavailable(true);
      setMonitoringError(
        loadError instanceof Error
          ? loadError.message
          : getStaticMessages().settingsMonitoringData.loadFailed,
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setMonitoringLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void revision;
    void loadSettings();

    return () => {
      requestIdRef.current += 1;
    };
  }, [loadSettings, revision]);

  const monitoringDirty = useMemo(
    () => monitoringIntervalSeconds !== toInputValue(settings),
    [monitoringIntervalSeconds, settings],
  );

  const handleSaveMonitoringSettings = useCallback(async () => {
    const parsed = Number.parseInt(monitoringIntervalSeconds, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setMonitoringError(getStaticMessages().settingsMonitoringData.invalidInterval);
      return;
    }

    setMonitoringSaving(true);
    setMonitoringError(null);

    try {
      const response = await api.settings.monitoring.update({
        monitoring_probe_interval_seconds: parsed,
      });
      setSettings(response);
      setMonitoringIntervalSeconds(toInputValue(response));
      setMonitoringUnavailable(false);
      setRecentlySavedSection("monitoring");
    } catch (saveError) {
      setMonitoringError(
        saveError instanceof Error
          ? saveError.message
          : getStaticMessages().settingsMonitoringData.saveFailed,
      );
    } finally {
      setMonitoringSaving(false);
    }
  }, [monitoringIntervalSeconds, setRecentlySavedSection]);

  return {
    handleSaveMonitoringSettings,
    monitoringDirty,
    monitoringError,
    monitoringIntervalSeconds,
    monitoringLoading,
    monitoringSaving,
    monitoringUnavailable,
    setMonitoringIntervalSeconds,
  };
}
