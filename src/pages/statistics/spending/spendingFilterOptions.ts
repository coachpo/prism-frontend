export const MAX_SPENDING_TOP_N = 50;
export const MIN_SPENDING_TOP_N = 1;

export const SPENDING_GROUP_BY_OPTIONS = [
  { label: "All", value: "none" },
  { label: "Day", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Provider", value: "provider" },
  { label: "Model", value: "model" },
  { label: "Endpoint", value: "endpoint" },
  { label: "Model + Endpoint", value: "model_endpoint" },
] as const;

export const SPENDING_PRESET_OPTIONS = [
  { label: "Today", value: "today" },
  { label: "Last 7 Days", value: "last_7_days" },
  { label: "Last 30 Days", value: "last_30_days" },
  { label: "All Time", value: "all" },
  { label: "Custom Range", value: "custom" },
] as const;
