import { ShieldAlert, Unplug } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import type { AuditLogDetail } from "@/lib/types";
import { UNIVERSAL_TIMESTAMP_FORMAT } from "./formatters";
import type { RequestDetailTab } from "./queryParams";
import {
  AuditLoadingSkeleton,
  CodePanel,
  DetailMetric,
  DetailSection,
} from "./RequestLogDetailShared";

interface RequestLogAuditTabProps {
  auditDetail: AuditLogDetail | null;
  auditLoading: boolean;
  auditError: string | null;
  auditChecked: boolean;
  formatTime: (date: string, options?: Intl.DateTimeFormatOptions) => string;
  setDetailTab: (tab: RequestDetailTab) => void;
}

export function RequestLogAuditTab({
  auditDetail,
  auditLoading,
  auditError,
  auditChecked,
  formatTime,
  setDetailTab,
}: RequestLogAuditTabProps) {
  if (auditLoading) {
    return <AuditLoadingSkeleton />;
  }

  if (auditError) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4" role="alert">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-destructive">Audit detail failed to load</p>
            <p className="text-sm text-destructive/90">{auditError}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setDetailTab("overview")}>
            Return to overview
          </Button>
        </div>
      </div>
    );
  }

  if (!auditDetail && auditChecked) {
    return (
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="rounded-3xl border bg-card/80 p-5 shadow-sm">
          <EmptyState
            icon={<ShieldAlert className="h-7 w-7" />}
            title="No linked audit payload is available"
            description="Prism could not resolve a retained audit record for this request in the selected profile."
          />
        </div>
        <div className="grid gap-3">
          <div className="rounded-2xl border border-dashed bg-muted/20 p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-foreground">No audit recorded</p>
                <p className="text-sm text-muted-foreground">
                  Audit capture may have been disabled when this request ran, so no request/response payload was stored.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-dashed bg-muted/20 p-4">
            <div className="flex items-start gap-3">
              <Unplug className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold text-foreground">Audit removed or expired</p>
                <p className="text-sm text-muted-foreground">
                  Retention cleanup or manual deletion can remove an audit record after the request log has already been preserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!auditDetail) {
    return null;
  }

  return (
    <>
      <DetailSection
        title="Audit summary"
        description="Full payload capture resolved from the linked audit record for the selected request."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DetailMetric label="Audit log" value={`#${auditDetail.id}`} />
          <DetailMetric label="Response status" value={`HTTP ${auditDetail.response_status}`} />
          <DetailMetric label="Duration" value={`${auditDetail.duration_ms}ms`} />
          <DetailMetric
            label="Captured at"
            value={formatTime(auditDetail.created_at, UNIVERSAL_TIMESTAMP_FORMAT)}
          />
        </div>
      </DetailSection>

      <DetailSection
        title="Request capture"
        description="Sanitized upstream request details for this invocation. Copy actions always copy the full stored payload."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <DetailMetric label="Method" value={auditDetail.request_method} />
          <DetailMetric label="Request URL" value={auditDetail.request_url} />
        </div>
        <div className="grid gap-4">
          <CodePanel
            title="Request headers"
            value={auditDetail.request_headers}
            fallback="No request headers were captured."
          />
          <CodePanel
            title="Request body"
            value={auditDetail.request_body}
            fallback="No request body was captured for this request."
          />
        </div>
      </DetailSection>

      <DetailSection
        title="Response capture"
        description="Redacted response payload stored by the audit pipeline. Streaming responses keep headers but do not retain response bodies."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <DetailMetric
            label="Stream mode"
            value={auditDetail.is_stream ? "Streaming response" : "Non-stream response"}
          />
          <DetailMetric
            label="Linked request"
            value={auditDetail.request_log_id ? `#${auditDetail.request_log_id}` : "Link unavailable"}
          />
        </div>
        <div className="grid gap-4">
          <CodePanel
            title="Response headers"
            value={auditDetail.response_headers}
            fallback="No response headers were captured."
          />
          <CodePanel
            title="Response body"
            value={auditDetail.response_body}
            fallback={
              auditDetail.is_stream
                ? "Streaming response bodies are not retained in audit capture."
                : "No response body was captured for this request."
            }
          />
        </div>
      </DetailSection>
    </>
  );
}
