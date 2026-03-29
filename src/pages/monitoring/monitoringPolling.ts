import { api } from "@/lib/api";

export const DEFAULT_MONITORING_POLL_INTERVAL_SECONDS = 300;
export const MIN_MONITORING_POLL_INTERVAL_SECONDS = 30;
export const MAX_MONITORING_POLL_INTERVAL_SECONDS = 3600;

export function clampMonitoringPollIntervalSeconds(value: number | null | undefined): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_MONITORING_POLL_INTERVAL_SECONDS;
  }

  return Math.min(
    MAX_MONITORING_POLL_INTERVAL_SECONDS,
    Math.max(MIN_MONITORING_POLL_INTERVAL_SECONDS, Math.trunc(value ?? DEFAULT_MONITORING_POLL_INTERVAL_SECONDS)),
  );
}

export function toMonitoringPollIntervalMs(seconds: number): number {
  return clampMonitoringPollIntervalSeconds(seconds) * 1000;
}

export async function loadMonitoringPollIntervalSeconds(): Promise<number> {
  try {
    const response = await api.settings.monitoring.get();
    return clampMonitoringPollIntervalSeconds(response.monitoring_probe_interval_seconds);
  } catch {
    return DEFAULT_MONITORING_POLL_INTERVAL_SECONDS;
  }
}
