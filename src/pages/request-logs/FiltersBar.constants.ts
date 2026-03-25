export const TIME_LABELS: Record<string, string> = {
  "1h": "Last hour",
  "6h": "Last 6 hours",
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  all: "All time",
};

export const LATENCY_LABELS: Record<string, string> = {
  all: "Any latency",
  fast: "< 500ms",
  normal: "500ms-2s",
  slow: "2s-5s",
  very_slow: "> 5s",
};

export const STATUS_FAMILY_LABELS: Record<string, string> = {
  all: "All statuses",
  "4xx": "4xx only",
  "5xx": "5xx only",
};
