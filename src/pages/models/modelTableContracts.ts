export type ModelColumnKey =
  | "provider"
  | "type"
  | "strategy"
  | "endpoints"
  | "success"
  | "p95"
  | "requests"
  | "spend"
  | "status";

export type ModelDerivedMetric = {
  success_rate: number | null;
  request_count_24h: number;
  p95_latency_ms: number | null;
};
