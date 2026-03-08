import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  Clock,
  ExternalLink,
  FileSearch,
  Filter,
  Search,
  ShieldAlert,
  Unplug,
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { ProviderIcon } from "@/components/ProviderIcon";
import { TypeBadge, ValueBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { formatMoneyMicros, formatTokenCount } from "@/lib/costing";
import type { AuditLogDetail, AuditLogListItem, RequestLogEntry } from "@/lib/types";
import { BodyInspector } from "./BodyInspector";
import { ClipboardButton } from "./clipboard";
import type { DetailTab } from "./queryParams";
import {
  formatJson,
  formatLatency,
  getDisplayCurrency,
  statusIntent,
  UNIVERSAL_TIMESTAMP_FORMAT,
} from "./formatters";

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-background/70 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-mono text-sm text-foreground">{value}</p>
    </div>
  );
}

function DetailSection({
  action,
  children,
  description,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <section className="space-y-3 rounded-3xl border bg-card/80 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

function JsonPanel({ title, value }: { title: string; value: string }) {
  return (
    <div className="space-y-2 rounded-2xl border bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
        <ClipboardButton text={value} successMessage={`${title} copied`} errorMessage={`Failed to copy ${title.toLowerCase()}`} ariaLabel={`Copy ${title.toLowerCase()}`} />
      </div>
      <pre className="max-h-72 overflow-auto rounded-xl bg-slate-950 p-3 text-xs leading-5 text-slate-100">
        <code>{value}</code>
      </pre>
    </div>
  );
}

function AuditLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-20 rounded-2xl" />
      <Skeleton className="h-56 rounded-2xl" />
      <Skeleton className="h-56 rounded-2xl" />
    </div>
  );
}

interface ObservabilityInspectorSheetProps {
  applyRequestContext: (log: RequestLogEntry) => void;
  auditDetail: AuditLogDetail | null;
  auditDetailLoading: boolean;
  auditSummary: AuditLogListItem | null;
  detailTab: DetailTab;
  formatTime: (date: string, options?: Intl.DateTimeFormatOptions) => string;
  isAuditingEnabled: boolean;
  navigateToConnection: (id: number) => Promise<void>;
  onClose: () => void;
  requestLog: RequestLogEntry | null;
  setDetailTab: (tab: DetailTab) => void;
}

export function ObservabilityInspectorSheet({
  applyRequestContext,
  auditDetail,
  auditDetailLoading,
  auditSummary,
  detailTab,
  formatTime,
  isAuditingEnabled,
  navigateToConnection,
  onClose,
  requestLog,
  setDetailTab,
}: ObservabilityInspectorSheetProps) {
  const [linkedAudit, setLinkedAudit] = useState<AuditLogDetail | null>(null);
  const [linkedAuditLoading, setLinkedAuditLoading] = useState(false);
  const [linkedAuditChecked, setLinkedAuditChecked] = useState(false);
  const [linkedAuditError, setLinkedAuditError] = useState<string | null>(null);
  const [linkedRequest, setLinkedRequest] = useState<RequestLogEntry | null>(null);
  const [linkedRequestLoading, setLinkedRequestLoading] = useState(false);
  const [linkedRequestChecked, setLinkedRequestChecked] = useState(false);
  const [linkedRequestError, setLinkedRequestError] = useState<string | null>(null);

  useEffect(() => {
    setLinkedAudit(null);
    setLinkedAuditLoading(false);
    setLinkedAuditChecked(false);
    setLinkedAuditError(null);
  }, [requestLog?.id]);

  useEffect(() => {
    setLinkedRequest(null);
    setLinkedRequestLoading(false);
    setLinkedRequestChecked(false);
    setLinkedRequestError(null);
  }, [auditDetail?.id]);

  useEffect(() => {
    if (!requestLog || detailTab !== "audit" || linkedAuditChecked) {
      return;
    }

    let cancelled = false;

    const loadLinkedAudit = async () => {
      setLinkedAuditLoading(true);
      setLinkedAuditError(null);

      try {
        const auditLookup = await api.audit.list({ limit: 1, offset: 0, request_log_id: requestLog.id });
        if (cancelled) return;

        const linkedAuditSummary = auditLookup.items[0];
        if (!linkedAuditSummary) {
          setLinkedAudit(null);
          setLinkedAuditChecked(true);
          return;
        }

        const detail = await api.audit.get(linkedAuditSummary.id);
        if (cancelled) return;

        setLinkedAudit(detail);
        setLinkedAuditChecked(true);
      } catch (error) {
        if (cancelled) return;
        setLinkedAudit(null);
        setLinkedAuditChecked(true);
        setLinkedAuditError(error instanceof Error ? error.message : "Failed to load linked audit detail");
      } finally {
        if (!cancelled) {
          setLinkedAuditLoading(false);
        }
      }
    };

    void loadLinkedAudit();

    return () => {
      cancelled = true;
    };
  }, [detailTab, linkedAuditChecked, requestLog]);

  useEffect(() => {
    if (!auditDetail?.request_log_id || detailTab !== "request" || linkedRequestChecked || requestLog) {
      return;
    }

    let cancelled = false;

    const loadLinkedRequest = async () => {
      setLinkedRequestLoading(true);
      setLinkedRequestError(null);

      try {
        const response = await api.stats.requests({
          limit: 1,
          offset: 0,
          request_id: auditDetail.request_log_id ?? undefined,
        });
        if (cancelled) return;

        setLinkedRequest(response.items[0] ?? null);
        setLinkedRequestChecked(true);
      } catch (error) {
        if (cancelled) return;
        setLinkedRequest(null);
        setLinkedRequestChecked(true);
        setLinkedRequestError(error instanceof Error ? error.message : "Failed to load linked request detail");
      } finally {
        if (!cancelled) {
          setLinkedRequestLoading(false);
        }
      }
    };

    void loadLinkedRequest();

    return () => {
      cancelled = true;
    };
  }, [auditDetail, detailTab, linkedRequestChecked, requestLog]);

  const resolvedRequest = requestLog ?? linkedRequest;
  const resolvedAudit = auditDetail ?? linkedAudit;
  const isOpen = Boolean(requestLog || auditSummary);
  const displayCurrency = useMemo(
    () => (resolvedRequest ? getDisplayCurrency(resolvedRequest) : { code: "USD", symbol: "$" }),
    [resolvedRequest]
  );
  const auditButtonLabel = linkedAuditLoading
    ? "Loading audit..."
    : detailTab === "audit" && resolvedAudit
      ? "Audit open"
      : linkedAuditChecked && !resolvedAudit
        ? "No audit captured"
        : "View audit capture";

  const rawJson = useMemo(
    () =>
      JSON.stringify(
        {
          audit: resolvedAudit,
          request: resolvedRequest,
        },
        null,
        2
      ),
    [resolvedAudit, resolvedRequest]
  );

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-3xl">
        <div className="flex min-h-full flex-col bg-gradient-to-b from-background via-background to-muted/10">
          <SheetHeader className="sticky top-0 z-20 space-y-4 border-b bg-background/95 p-6 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {resolvedRequest ? <Badge variant="outline" className="font-mono text-xs">Request #{resolvedRequest.id}</Badge> : null}
                {auditSummary ? <Badge variant="outline" className="font-mono text-xs">Audit #{auditSummary.id}</Badge> : null}
                {resolvedRequest ? <ValueBadge label={String(resolvedRequest.status_code)} intent={statusIntent(resolvedRequest.status_code)} /> : null}
                {resolvedAudit && !resolvedRequest ? <ValueBadge label={String(resolvedAudit.response_status)} intent={statusIntent(resolvedAudit.response_status)} /> : null}
                {resolvedRequest?.is_stream || resolvedAudit?.is_stream ? <TypeBadge label="Stream" /> : null}
                {resolvedRequest ? (
                  <Badge variant="secondary" className="gap-1 font-mono">
                    <Clock className="h-3.5 w-3.5" />
                    {formatLatency(resolvedRequest.response_time_ms)}
                  </Badge>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {resolvedRequest ? (
                  <ClipboardButton
                    text={String(resolvedRequest.id)}
                    label="Copy ID"
                    size="sm"
                    variant="outline"
                    successMessage="Request ID copied"
                    errorMessage="Failed to copy request ID"
                    ariaLabel="Copy request ID"
                  />
                ) : null}
                {requestLog ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={linkedAuditLoading || (linkedAuditChecked && !resolvedAudit)}
                    onClick={() => setDetailTab("audit")}
                  >
                    <FileSearch className="mr-2 h-4 w-4" />
                    {auditButtonLabel}
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <SheetTitle className="flex flex-wrap items-center gap-2 text-left text-xl font-mono text-foreground">
                {resolvedRequest?.model_id || resolvedAudit?.model_id || "Observability record"}
              </SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-2 text-sm">
                {resolvedRequest ? <ProviderIcon providerType={resolvedRequest.provider_type} size={14} /> : null}
                <span className="capitalize">{resolvedRequest?.provider_type || "audit"}</span>
                <span className="text-muted-foreground">•</span>
                <span>{resolvedRequest?.endpoint_description || resolvedAudit?.endpoint_description || "Unknown endpoint"}</span>
                <span className="text-muted-foreground">•</span>
                <span className="font-mono">
                  {formatTime(
                    resolvedRequest?.created_at || resolvedAudit?.created_at || new Date().toISOString(),
                    UNIVERSAL_TIMESTAMP_FORMAT
                  )}
                </span>
              </SheetDescription>
            </div>

            <Tabs value={detailTab} onValueChange={(value) => setDetailTab(value as DetailTab)}>
              <TabsList variant="line" className="w-full justify-start gap-2 overflow-x-auto border-b pb-1">
                <TabsTrigger value="request" className="flex-none px-3">Request</TabsTrigger>
                <TabsTrigger value="audit" className="flex-none px-3">Audit</TabsTrigger>
                <TabsTrigger value="json" className="flex-none px-3">Raw JSON</TabsTrigger>
              </TabsList>
            </Tabs>
          </SheetHeader>

          <div className="flex-1 p-6">
            <Tabs value={detailTab} onValueChange={(value) => setDetailTab(value as DetailTab)}>
              <TabsContent value="request" className="space-y-4">
                {linkedRequestLoading ? <AuditLoadingSkeleton /> : null}

                {linkedRequestError ? (
                  <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4" role="alert">
                    <p className="text-sm font-semibold text-destructive">Request detail failed to load</p>
                    <p className="text-sm text-destructive/90">{linkedRequestError}</p>
                  </div>
                ) : null}

                {!resolvedRequest && linkedRequestChecked && !linkedRequestLoading ? (
                  <div className="rounded-3xl border bg-card/80 p-5 shadow-sm">
                    <EmptyState
                      icon={<Unplug className="h-7 w-7" />}
                      title="No linked request overview is available"
                      description="This audit record no longer resolves to a retained request log in the selected profile."
                    />
                  </div>
                ) : null}

                {resolvedRequest ? (
                  <>
                    {resolvedRequest.status_code >= 400 ? (
                      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4" role="alert">
                        <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-destructive">
                          <AlertCircle className="h-4 w-4" />
                          Status & error payload
                        </h4>
                        <pre className="whitespace-pre-wrap text-xs font-mono text-destructive/90">
                          {resolvedRequest.error_detail || "No error payload provided"}
                        </pre>
                      </div>
                    ) : null}

                    <DetailSection title="Request overview" description="Routing, usage, and billing context for this invocation.">
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <DetailMetric label="Latency" value={formatLatency(resolvedRequest.response_time_ms)} />
                        <DetailMetric label="Connection" value={resolvedRequest.connection_id ? `#${resolvedRequest.connection_id}` : "-"} />
                        <DetailMetric label="Total tokens" value={formatTokenCount(resolvedRequest.total_tokens)} />
                        <DetailMetric
                          label="Total cost"
                          value={formatMoneyMicros(
                            resolvedRequest.total_cost_user_currency_micros,
                            displayCurrency.symbol,
                            displayCurrency.code,
                            2,
                            6
                          )}
                        />
                      </div>
                    </DetailSection>

                    <DetailSection title="Token breakdown" description="Usage, cache activity, and reasoning volume for this request.">
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <DetailMetric label="Input tokens" value={formatTokenCount(resolvedRequest.input_tokens)} />
                        <DetailMetric label="Output tokens" value={formatTokenCount(resolvedRequest.output_tokens)} />
                        <DetailMetric label="Cached tokens" value={formatTokenCount(resolvedRequest.cache_read_input_tokens)} />
                        <DetailMetric label="Cache create tokens" value={formatTokenCount(resolvedRequest.cache_creation_input_tokens)} />
                        <DetailMetric label="Reasoning tokens" value={formatTokenCount(resolvedRequest.reasoning_tokens)} />
                        <DetailMetric label="Total tokens" value={formatTokenCount(resolvedRequest.total_tokens)} />
                      </div>
                    </DetailSection>

                    <DetailSection title="Routing metadata" description="The request path and pricing snapshot that powered this result.">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <DetailMetric label="Request path" value={resolvedRequest.request_path} />
                        <DetailMetric label="Endpoint ID" value={resolvedRequest.endpoint_id ? `#${resolvedRequest.endpoint_id}` : "-"} />
                        <DetailMetric
                          label="Pricing config"
                          value={
                            resolvedRequest.pricing_config_version_used == null
                              ? "-"
                              : `v${resolvedRequest.pricing_config_version_used}`
                          }
                        />
                        <DetailMetric label="Report currency" value={displayCurrency.code || "USD"} />
                      </div>
                    </DetailSection>

                    <DetailSection title="Actions" description="Keep investigating without leaving the observability workflow.">
                      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                        <Button type="button" variant="outline" className="justify-start" onClick={() => applyRequestContext(resolvedRequest)}>
                          <Search className="mr-2 h-4 w-4" />
                          Find similar traffic
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="justify-start"
                          disabled={!resolvedRequest.connection_id}
                          onClick={() => {
                            if (resolvedRequest.connection_id) {
                              void navigateToConnection(resolvedRequest.connection_id);
                            }
                          }}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open connection details
                        </Button>
                        <Button type="button" variant="outline" className="justify-start" onClick={() => setDetailTab("audit")}>
                          <Filter className="mr-2 h-4 w-4" />
                          {auditButtonLabel}
                        </Button>
                        <ClipboardButton
                          text={JSON.stringify(resolvedRequest, null, 2)}
                          label="Copy request JSON"
                          size="sm"
                          variant="outline"
                          successMessage="Request JSON copied"
                          errorMessage="Failed to copy request JSON"
                          ariaLabel="Copy request JSON"
                        />
                      </div>
                    </DetailSection>
                  </>
                ) : null}
              </TabsContent>

              <TabsContent value="audit" className="space-y-4">
                {(auditDetailLoading || linkedAuditLoading) ? <AuditLoadingSkeleton /> : null}

                {linkedAuditError ? (
                  <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4" role="alert">
                    <p className="text-sm font-semibold text-destructive">Audit detail failed to load</p>
                    <p className="text-sm text-destructive/90">{linkedAuditError}</p>
                  </div>
                ) : null}

                {!resolvedAudit && !(auditDetailLoading || linkedAuditLoading) ? (
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                    <div className="rounded-3xl border bg-card/80 p-5 shadow-sm">
                      <EmptyState
                        icon={<ShieldAlert className="h-7 w-7" />}
                        title="No audit capture is available"
                        description={
                          isAuditingEnabled
                            ? "Prism could not resolve a retained audit record for this selection in the current profile."
                            : "Auditing is currently off, so new requests are not capturing request and response payloads."
                        }
                      />
                    </div>
                    <div className="grid gap-3">
                      <div className="rounded-2xl border border-dashed bg-muted/20 p-4">
                        <p className="text-sm font-semibold text-foreground">No audit captured</p>
                        <p className="text-sm text-muted-foreground">
                          Audit capture may have been disabled when this request ran, so no request or response payload was stored.
                        </p>
                      </div>
                      <div className="rounded-2xl border border-dashed bg-muted/20 p-4">
                        <p className="text-sm font-semibold text-foreground">Audit removed or expired</p>
                        <p className="text-sm text-muted-foreground">
                          Retention cleanup or manual deletion can remove an audit record after the request log has already been preserved.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                {resolvedAudit ? (
                  <>
                    <DetailSection title="Audit summary" description="Full payload capture resolved from the linked audit record.">
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <DetailMetric label="Audit log" value={`#${resolvedAudit.id}`} />
                        <DetailMetric label="Response status" value={`HTTP ${resolvedAudit.response_status}`} />
                        <DetailMetric label="Duration" value={`${resolvedAudit.duration_ms}ms`} />
                        <DetailMetric label="Captured at" value={formatTime(resolvedAudit.created_at, UNIVERSAL_TIMESTAMP_FORMAT)} />
                      </div>
                    </DetailSection>

                    <DetailSection
                      title="Request capture"
                      description="Sanitized upstream request details for this invocation."
                      action={
                        <ClipboardButton
                          text={resolvedAudit.request_url}
                          successMessage="Request URL copied"
                          errorMessage="Failed to copy request URL"
                          ariaLabel="Copy request URL"
                        />
                      }
                    >
                      <div className="grid gap-3 sm:grid-cols-2">
                        <DetailMetric label="Method" value={resolvedAudit.request_method} />
                        <DetailMetric label="Request URL" value={resolvedAudit.request_url} />
                      </div>
                      <div className="grid gap-3 xl:grid-cols-2">
                        <JsonPanel title="Request headers" value={formatJson(resolvedAudit.request_headers) || "No request headers were captured."} />
                        <BodyInspector content={resolvedAudit.request_body} emptyMessage="No request body was captured for this request." />
                      </div>
                    </DetailSection>

                    <DetailSection title="Response capture" description="Redacted response payload stored by the audit pipeline.">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <DetailMetric label="Stream mode" value={resolvedAudit.is_stream ? "Streaming response" : "Non-stream response"} />
                        <DetailMetric label="Linked request" value={resolvedAudit.request_log_id ? `#${resolvedAudit.request_log_id}` : "Link unavailable"} />
                      </div>
                      <div className="grid gap-3 xl:grid-cols-2">
                        <JsonPanel title="Response headers" value={formatJson(resolvedAudit.response_headers) || "No response headers were captured."} />
                        <BodyInspector
                          content={resolvedAudit.response_body}
                          emptyMessage={
                            resolvedAudit.is_stream
                              ? "Streaming response bodies are not retained in audit capture."
                              : "No response body was captured for this request."
                          }
                        />
                      </div>
                    </DetailSection>
                  </>
                ) : null}
              </TabsContent>

              <TabsContent value="json" className="space-y-4">
                <DetailSection
                  title="Raw JSON"
                  description="Combined request and audit payload for copy-paste, incident notes, or external analysis."
                  action={
                    <ClipboardButton
                      text={rawJson}
                      label="Copy JSON"
                      size="sm"
                      variant="outline"
                      successMessage="Raw JSON copied"
                      errorMessage="Failed to copy raw JSON"
                      ariaLabel="Copy raw JSON"
                    />
                  }
                >
                  <pre className="max-h-[60vh] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                    <code>{rawJson}</code>
                  </pre>
                </DetailSection>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
