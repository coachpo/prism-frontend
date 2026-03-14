import type { TimeBucket } from "../utils";

export interface RequestLogsPathOptions {
  outcome_filter?: "all" | "success" | "error";
  stream_filter?: "all" | "stream" | "non_stream";
  limit?: number;
}

export type RequestLogsPathBuilder = (
  overrides?: Partial<RequestLogsPathOptions>
) => string;

export interface SpecialTokenCoverageSummary {
  totalRows: number;
  cachedCaptured: number;
  reasoningCaptured: number;
  anySpecialCaptured: number;
  noTokenUsage: number;
}

export interface ErrorCodeBreakdownItem {
  status: string;
  count: number;
}

export interface TopErrorItem {
  count: number;
  statusCode: number;
  detail: string;
  rawDetail: string;
}

export interface LatencyBandDatum {
  band: string;
  count: number;
}

export type OperationsChartData = TimeBucket[];
