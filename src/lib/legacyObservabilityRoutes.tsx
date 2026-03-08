import { Navigate, useLocation } from "react-router-dom";

function mapLegacyOutcomeFilter(value: string | null): string | null {
  if (value === "success") return "2xx";
  if (value === "error") return "error";
  return null;
}

function mapLegacyAuditStatus(value: string | null): string | null {
  if (value === "2xx" || value === "4xx" || value === "5xx" || value === "error") {
    return value;
  }
  return null;
}

function mapLegacyRequestDetailTab(value: string | null): string | null {
  if (value === "audit") return "audit";
  if (value === "overview") return "request";
  return null;
}

function buildRedirectPath(params: URLSearchParams): string {
  const query = params.toString();
  return query ? `/logs?${query}` : "/logs";
}

function translateLegacyRequestLogsSearch(search: string): string {
  const legacy = new URLSearchParams(search);
  const next = new URLSearchParams();

  const copyIfPresent = (sourceKey: string, targetKey: string) => {
    const value = legacy.get(sourceKey);
    if (value && value.trim().length > 0) {
      next.set(targetKey, value);
    }
  };

  copyIfPresent("model_id", "model");
  copyIfPresent("provider_type", "provider");
  copyIfPresent("connection_id", "connection");
  copyIfPresent("endpoint_id", "endpoint");
  copyIfPresent("time_range", "range");
  copyIfPresent("search", "search");
  copyIfPresent("view", "request_view");
  copyIfPresent("triage", "triage");
  copyIfPresent("stream_filter", "stream");
  copyIfPresent("special_token_filter", "special");
  copyIfPresent("token_min", "token_min");
  copyIfPresent("token_max", "token_max");
  copyIfPresent("limit", "req_limit");
  copyIfPresent("offset", "req_offset");
  copyIfPresent("request_id", "request_id");

  const status = mapLegacyOutcomeFilter(legacy.get("outcome_filter"));
  if (status) {
    next.set("status", status);
  }

  const detailTab = mapLegacyRequestDetailTab(legacy.get("detail_tab"));
  if (detailTab) {
    next.set("detail_tab", detailTab);
  }

  if (legacy.get("priced_only") === "true") {
    next.set("priced", "true");
  }

  if (legacy.get("billable_only") === "true") {
    next.set("billable", "true");
  }

  return buildRedirectPath(next);
}

function translateLegacyAuditSearch(search: string): string {
  const legacy = new URLSearchParams(search);
  const next = new URLSearchParams();

  const copyIfPresent = (sourceKey: string, targetKey: string) => {
    const value = legacy.get(sourceKey);
    if (value && value.trim().length > 0) {
      next.set(targetKey, value);
    }
  };

  copyIfPresent("model_id", "model");
  copyIfPresent("connection_id", "connection");
  copyIfPresent("offset", "audit_offset");

  const status = mapLegacyAuditStatus(legacy.get("statusFilter"));
  if (status) {
    next.set("status", status);
  }

  return buildRedirectPath(next);
}

export function LegacyRequestLogsRedirect() {
  const location = useLocation();
  return <Navigate to={translateLegacyRequestLogsSearch(location.search)} replace />;
}

export function LegacyAuditRedirect() {
  const location = useLocation();
  return <Navigate to={translateLegacyAuditSearch(location.search)} replace />;
}
