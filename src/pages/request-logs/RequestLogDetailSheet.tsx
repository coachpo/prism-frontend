import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  Clock,
  Copy,
  ExternalLink,
  FileJson,
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
import type { AuditLogDetail, RequestLogEntry } from "@/lib/types";
import {
  UNIVERSAL_TIMESTAMP_FORMAT,
  formatLatency,
  getDisplayCurrency,
} from "./formatters";

type RequestDetailTab = "overview" | "audit";

interface RequestLogDetailSheetProps {
  selectedLog: RequestLogEntry | null;
  setSelectedLog: (log: RequestLogEntry | null) => void;
  setModelId: (id: string) => void;
  setProviderType: (type: string) => void;
  setConnectionId: (id: string) => void;
  setOffset: (offset: number) => void;
  navigateToConnection: (id: number) => Promise<void>;
  formatTime: (date: string, options?: Intl.DateTimeFormatOptions) => string;
  requestId: number | null;
  detailTab: RequestDetailTab;
  setDetailTab: (tab: RequestDetailTab) => void;
  clearRequestFocus: () => void;
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-background/70 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-mono text-sm text-foreground">{value}</p>
    </div>
  );
}

function DetailSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-3xl border bg-card/80 p-4 shadow-sm">
      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const handleCopy = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
    } catch (error) {
      console.error(`Failed to copy ${label.toLowerCase()}`, error);
    }
  };

  return (
    <Button type="button" variant="ghost" size="sm" className="h-7 gap-1.5 px-2" onClick={handleCopy}>
      <Copy className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
}

function CodePanel({
  title,
  value,
  fallback,
}: {
  title: string;
  value: string | null | undefined;
  fallback: string;
}) {
  const content = value && value.trim().length > 0 ? value : fallback;

  return (
    <div className="space-y-2 rounded-2xl border bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
        <CopyButton value={content} label="Copy" />
      </div>
      <pre className="max-h-72 overflow-auto rounded-xl bg-slate-950 p-3 text-xs leading-5 text-slate-100">
        <code>{content}</code>
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

export function RequestLogDetailSheet({
  selectedLog,
  setSelectedLog,
  setModelId,
  setProviderType,
  setConnectionId,
  setOffset,
  navigateToConnection,
  formatTime,
  requestId,
  detailTab,
  setDetailTab,
  clearRequestFocus,
}: RequestLogDetailSheetProps) {
  const [auditDetail, setAuditDetail] = useState<AuditLogDetail | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditChecked, setAuditChecked] = useState(false);

  const displayCurrency = useMemo(
    () => (selectedLog ? getDisplayCurrency(selectedLog) : { symbol: "$", code: "USD" }),
    [selectedLog]
  );

  useEffect(() => {
    setAuditDetail(null);
    setAuditError(null);
    setAuditChecked(false);
    setAuditLoading(false);
  }, [selectedLog?.id]);

  useEffect(() => {
    if (!selectedLog || detailTab !== "audit") {
      return;
    }

    let cancelled = false;

    const loadAuditDetail = async () => {
      setAuditLoading(true);
      setAuditError(null);
      setAuditChecked(true);

      try {
        const auditLookup = await api.audit.list({
          request_log_id: selectedLog.id,
          limit: 1,
          offset: 0,
        });

        if (cancelled) {
          return;
        }

        const linkedAudit = auditLookup.items[0];
        if (!linkedAudit) {
          setAuditDetail(null);
          return;
        }

        const detail = await api.audit.get(linkedAudit.id);
        if (!cancelled) {
          setAuditDetail(detail);
        }
      } catch (error) {
        console.error("Failed to load linked audit detail", error);
        if (!cancelled) {
          setAuditError(error instanceof Error ? error.message : "Failed to load audit detail");
          setAuditDetail(null);
        }
      } finally {
        if (!cancelled) {
          setAuditLoading(false);
        }
      }
    };

    void loadAuditDetail();

    return () => {
      cancelled = true;
    };
  }, [detailTab, selectedLog]);

  const closeSheet = () => {
    setSelectedLog(null);
    setDetailTab("overview");
    if (requestId !== null) {
      clearRequestFocus();
    }
  };

  const refineRequestContext = () => {
    if (!selectedLog) {
      return;
    }

    clearRequestFocus();
    setModelId(selectedLog.model_id);
    setProviderType(selectedLog.provider_type);
    if (selectedLog.connection_id) {
      setConnectionId(String(selectedLog.connection_id));
    }
    setOffset(0);
    setSelectedLog(null);
    setDetailTab("overview");
  };

  const focusConnectionOnly = () => {
    if (!selectedLog?.connection_id) {
      return;
    }

    clearRequestFocus();
    setConnectionId(String(selectedLog.connection_id));
    setOffset(0);
    setSelectedLog(null);
    setDetailTab("overview");
  };

  const exportSelectedLog = () => {
    if (!selectedLog) {
      return;
    }

    const blob = new Blob([JSON.stringify(selectedLog, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `request-log-${selectedLog.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Sheet open={!!selectedLog} onOpenChange={(open) => !open && closeSheet()}>
      <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-3xl">
        {selectedLog ? (
          <div className="flex min-h-full flex-col bg-gradient-to-b from-background via-background to-muted/10">
            <SheetHeader className="sticky top-0 z-20 space-y-4 border-b bg-background/95 p-6 backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    #{selectedLog.id}
                  </Badge>
                  <Badge variant="secondary" className="gap-1 font-mono">
                    <Clock className="h-3.5 w-3.5" />
                    {formatLatency(selectedLog.response_time_ms)}
                  </Badge>
                  <ValueBadge
                    label={String(selectedLog.status_code)}
                    intent={
                      selectedLog.status_code < 300
                        ? "success"
                        : selectedLog.status_code < 500
                          ? "warning"
                          : "danger"
                    }
                  />
                  {selectedLog.is_stream ? <TypeBadge label="Stream" /> : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <CopyButton value={String(selectedLog.id)} label="Copy ID" />
                  <Button type="button" variant="outline" size="sm" onClick={() => setDetailTab("audit")}>
                    <FileSearch className="mr-2 h-4 w-4" />
                    Open linked audit
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <SheetTitle className="flex flex-wrap items-center gap-2 text-left text-xl font-mono text-foreground">
                  {selectedLog.model_id}
                </SheetTitle>
                <SheetDescription className="flex flex-wrap items-center gap-2 text-sm">
                  <ProviderIcon providerType={selectedLog.provider_type} size={14} />
                  <span className="capitalize">{selectedLog.provider_type}</span>
                  <span className="text-muted-foreground">•</span>
                  <span>{selectedLog.endpoint_description || "Unknown endpoint"}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="font-mono">{formatTime(selectedLog.created_at, UNIVERSAL_TIMESTAMP_FORMAT)}</span>
                </SheetDescription>
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                <DetailMetric label="Latency" value={formatLatency(selectedLog.response_time_ms)} />
                <DetailMetric
                  label="Total Cost"
                  value={formatMoneyMicros(
                    selectedLog.total_cost_user_currency_micros,
                    displayCurrency.symbol,
                    displayCurrency.code,
                    2,
                    6
                  )}
                />
                <DetailMetric label="Total Tokens" value={formatTokenCount(selectedLog.total_tokens)} />
                <DetailMetric label="Connection" value={selectedLog.connection_id ? `#${selectedLog.connection_id}` : "-"} />
              </div>
            </SheetHeader>

            <div className="flex-1 p-6">
              <Tabs value={detailTab} onValueChange={(value) => setDetailTab(value as RequestDetailTab)}>
                <TabsList variant="line" className="mb-6 w-full justify-start gap-2 overflow-x-auto border-b pb-1">
                  <TabsTrigger value="overview" className="flex-none px-3">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="audit" className="flex-none px-3">
                    Audit
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  {selectedLog.status_code >= 400 ? (
                    <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4" role="alert">
                      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        Status & Error Payload
                      </h4>
                      <pre className="whitespace-pre-wrap text-xs font-mono text-destructive/90">
                        {selectedLog.error_detail || "No error payload provided"}
                      </pre>
                    </div>
                  ) : null}

                  <DetailSection
                    title="Request timeline"
                    description="A concise narrative of how Prism routed and completed this request."
                  >
                    <div className="space-y-3">
                      {[
                        {
                          label: "Request received",
                          value: formatTime(selectedLog.created_at, UNIVERSAL_TIMESTAMP_FORMAT),
                          tone: "bg-primary/80",
                        },
                        {
                          label: "Connection selected",
                          value: selectedLog.connection_id
                            ? `${selectedLog.endpoint_description || "Connection"} (#${selectedLog.connection_id})`
                            : selectedLog.endpoint_description || "No connection metadata",
                          tone: "bg-sky-500/80",
                        },
                        {
                          label: "Provider execution",
                          value: `${selectedLog.provider_type} completed in ${selectedLog.response_time_ms.toFixed(0)}ms`,
                          tone: "bg-amber-500/80",
                        },
                        {
                          label: "Response returned",
                          value: `HTTP ${selectedLog.status_code} sent back to the client`,
                          tone: selectedLog.status_code < 400 ? "bg-emerald-500/80" : "bg-rose-500/80",
                        },
                      ].map((event, index) => (
                        <div key={event.label} className="flex gap-3">
                          <div className="flex w-6 flex-col items-center">
                            <span className={`mt-1 h-2.5 w-2.5 rounded-full ${event.tone}`} />
                            {index < 3 ? <span className="mt-1 h-full w-px bg-border" /> : null}
                          </div>
                          <div className="pb-3">
                            <p className="text-sm font-medium text-foreground">{event.label}</p>
                            <p className="text-sm text-muted-foreground">{event.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </DetailSection>

                  <DetailSection title="Token breakdown" description="Usage, cache activity, and reasoning volume for this request.">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      <DetailMetric label="Input tokens" value={formatTokenCount(selectedLog.input_tokens)} />
                      <DetailMetric label="Output tokens" value={formatTokenCount(selectedLog.output_tokens)} />
                      <DetailMetric label="Cached tokens" value={formatTokenCount(selectedLog.cache_read_input_tokens)} />
                      <DetailMetric
                        label="Cache create tokens"
                        value={formatTokenCount(selectedLog.cache_creation_input_tokens)}
                      />
                      <DetailMetric label="Reasoning tokens" value={formatTokenCount(selectedLog.reasoning_tokens)} />
                      <DetailMetric label="Total tokens" value={formatTokenCount(selectedLog.total_tokens)} />
                    </div>
                  </DetailSection>

                  <DetailSection title="Cost breakdown" description="Snapshot pricing values captured for the selected profile currency.">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      <DetailMetric
                        label="Input cost"
                        value={formatMoneyMicros(selectedLog.input_cost_micros, displayCurrency.symbol)}
                      />
                      <DetailMetric
                        label="Output cost"
                        value={formatMoneyMicros(selectedLog.output_cost_micros, displayCurrency.symbol)}
                      />
                      <DetailMetric
                        label="Cached cost"
                        value={formatMoneyMicros(selectedLog.cache_read_input_cost_micros, displayCurrency.symbol)}
                      />
                      <DetailMetric
                        label="Cache create cost"
                        value={formatMoneyMicros(
                          selectedLog.cache_creation_input_cost_micros,
                          displayCurrency.symbol
                        )}
                      />
                      <DetailMetric
                        label="Reasoning cost"
                        value={formatMoneyMicros(selectedLog.reasoning_cost_micros, displayCurrency.symbol)}
                      />
                      <DetailMetric
                        label="Total cost"
                        value={formatMoneyMicros(
                          selectedLog.total_cost_user_currency_micros,
                          displayCurrency.symbol,
                          displayCurrency.code,
                          2,
                          6
                        )}
                      />
                    </div>
                  </DetailSection>

                  <DetailSection title="Routing metadata" description="The request path and pricing snapshot that powered this result.">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <DetailMetric label="Endpoint ID" value={selectedLog.endpoint_id ? `#${selectedLog.endpoint_id}` : "-"} />
                      <DetailMetric
                        label="Pricing config"
                        value={
                          selectedLog.pricing_config_version_used == null
                            ? "-"
                            : `v${selectedLog.pricing_config_version_used}`
                        }
                      />
                      <DetailMetric label="Request path" value={selectedLog.request_path} />
                      <DetailMetric label="Connection ID" value={selectedLog.connection_id ? `#${selectedLog.connection_id}` : "-"} />
                    </div>
                  </DetailSection>

                  <DetailSection title="Actions" description="Keep investigating without leaving the request timeline.">
                    <div className="grid gap-2 md:grid-cols-2">
                      <Button variant="outline" className="justify-start" onClick={refineRequestContext}>
                        <Search className="mr-2 h-4 w-4" />
                        Find similar traffic
                      </Button>
                      <Button
                        variant="outline"
                        className="justify-start"
                        onClick={focusConnectionOnly}
                        disabled={!selectedLog.connection_id}
                      >
                        <Filter className="mr-2 h-4 w-4" />
                        Show only this connection
                      </Button>
                      <Button
                        variant="outline"
                        className="justify-start"
                        onClick={() => {
                          if (selectedLog.connection_id) {
                            void navigateToConnection(selectedLog.connection_id);
                          }
                        }}
                        disabled={!selectedLog.connection_id}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open connection details
                      </Button>
                      <Button variant="outline" className="justify-start" onClick={exportSelectedLog}>
                        <FileJson className="mr-2 h-4 w-4" />
                        Export request JSON
                      </Button>
                    </div>
                  </DetailSection>
                </TabsContent>

                <TabsContent value="audit" className="space-y-4">
                  <DetailSection
                    title="Linked audit capture"
                    description="Request and response payloads are loaded on demand so the log browser stays fast for normal triage."
                  >
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="secondary" className="font-mono">
                        request_log_id={selectedLog.id}
                      </Badge>
                      <span>Audit data is resolved from the exact request linkage inside the current profile.</span>
                    </div>
                  </DetailSection>

                  {auditLoading ? <AuditLoadingSkeleton /> : null}

                  {!auditLoading && auditError ? (
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
                  ) : null}

                  {!auditLoading && !auditError && !auditDetail && auditChecked ? (
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
                  ) : null}

                  {!auditLoading && !auditError && auditDetail ? (
                    <>
                      <DetailSection title="Audit summary" description="Full payload capture resolved from the linked audit record.">
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

                      <DetailSection title="Request capture" description="Sanitized upstream request details for this invocation.">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <DetailMetric label="Method" value={auditDetail.request_method} />
                          <DetailMetric label="Request URL" value={auditDetail.request_url} />
                        </div>
                        <div className="grid gap-3 xl:grid-cols-2">
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

                      <DetailSection title="Response capture" description="Redacted response payload stored by the audit pipeline.">
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
                        <div className="grid gap-3 xl:grid-cols-2">
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
                  ) : null}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
