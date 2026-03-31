export const DEFAULT_MONITORING_POLL_INTERVAL_SECONDS = 30;
export const MIN_MONITORING_POLL_INTERVAL_SECONDS = 15;
export const MAX_MONITORING_POLL_INTERVAL_SECONDS = 300;

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
