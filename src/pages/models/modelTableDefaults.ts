import type { ModelColumnKey } from "./modelTableContracts";

export const DEFAULT_VISIBLE_COLUMNS: Record<ModelColumnKey, boolean> = {
  provider: true,
  type: true,
  strategy: true,
  endpoints: true,
  success: true,
  p95: true,
  requests: true,
  spend: true,
  status: true,
};

export const getLast24hFromTime = (): string =>
  new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
