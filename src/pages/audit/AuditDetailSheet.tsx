import { useMemo, type ReactNode } from "react";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import { ValueBadge, TypeBadge } from "@/components/StatusBadge";
import { BodyInspector, CopyButton } from "./BodyInspector";
import { useTimezone } from "@/hooks/useTimezone";
import type { AuditLogDetail } from "@/lib/types";
import { statusIntent, methodIntent, formatRequestPath, formatJson, UNIVERSAL_TIMESTAMP_FORMAT } from "./utils";
export function DetailMetaItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1 rounded-md border bg-background/80 px-2.5 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="min-h-4 text-xs">{value}</div>
    </div>
  );
}

export function DetailSection({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2 rounded-xl border bg-card/80 p-3 sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
          {subtitle ? <p className="text-[11px] text-muted-foreground">{subtitle}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

interface AuditDetailSheetProps {
  isSheetOpen: boolean;
  handleSheetOpenChange: (open: boolean) => void;
  detailLoading: boolean;
  selectedLog: AuditLogDetail | null;
  navigateToConnection: (id: number) => void;
}

export function AuditDetailSheet({
  isSheetOpen,
  handleSheetOpenChange,
  detailLoading,
  selectedLog,
  navigateToConnection,
}: AuditDetailSheetProps) {
  const { format: formatTime } = useTimezone();
  const selectedConnectionId = selectedLog?.connection_id ?? null;
  const selectedRequestPath = selectedLog ? formatRequestPath(selectedLog.request_url) : "";
  const selectedLogPayload = useMemo(
    () => (selectedLog ? JSON.stringify(selectedLog, null, 2) : ""),
    [selectedLog]
  );

  return (
    <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
      <SheetContent showCloseButton={false} className="flex w-full flex-col p-0 sm:max-w-2xl">
        {detailLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : selectedLog ? (
          <>
            <SheetHeader className="shrink-0 border-b bg-card px-5 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[11px]">
                      Audit Log #{selectedLog.id}
                    </Badge>
                    <ValueBadge
                      label={selectedLog.request_method}
                      intent={methodIntent(selectedLog.request_method)}
                      className="text-xs"
                    />
                    <ValueBadge
                      label={String(selectedLog.response_status)}
                      intent={statusIntent(selectedLog.response_status)}
                      className="text-xs"
                    />
                    {selectedLog.is_stream ? <TypeBadge label="Stream" /> : null}
                  </div>
                  <SheetTitle className="truncate text-base sm:text-lg">{selectedRequestPath}</SheetTitle>
                  <SheetDescription className="text-[11px] leading-relaxed">
                    <span className="break-all font-mono text-muted-foreground">{selectedLog.request_url}</span>
                  </SheetDescription>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <CopyButton
                    text={selectedLogPayload}
                    successMessage="Audit details copied"
                    ariaLabel="Copy full audit details"
                  />
                  <SheetClose asChild>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="Close details">
                      <X className="h-4 w-4" />
                    </Button>
                  </SheetClose>
                </div>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <DetailMetaItem
                  label="Timestamp"
                  value={
                    <span className="text-muted-foreground">
                      {formatTime(selectedLog.created_at, UNIVERSAL_TIMESTAMP_FORMAT)}
                    </span>
                  }
                />
                <DetailMetaItem
                  label="Duration"
                  value={<span className="font-mono tabular-nums text-muted-foreground">{selectedLog.duration_ms}ms</span>}
                />
                <DetailMetaItem
                  label="Endpoint"
                  value={
                    selectedLog.endpoint_id === null ? (
                      <span className="text-muted-foreground">Unavailable</span>
                    ) : (
                      <span className="font-mono text-muted-foreground">#{selectedLog.endpoint_id}</span>
                    )
                  }
                />
                <DetailMetaItem
                  label="Connection"
                  value={
                    selectedConnectionId === null ? (
                      <span className="text-muted-foreground">Unavailable</span>
                    ) : (
                      <button
                        type="button"
                        className="font-mono text-primary hover:underline"
                        onClick={() => navigateToConnection(selectedConnectionId)}
                      >
                        #{selectedConnectionId}
                      </button>
                    )
                  }
                />
              </div>
            </SheetHeader>

            <Tabs defaultValue="request" className="flex min-h-0 flex-1 flex-col">
              <div className="shrink-0 border-b bg-background px-5 py-2 sm:px-6">
                <TabsList className="h-8 w-fit">
                  <TabsTrigger value="request">Request</TabsTrigger>
                  <TabsTrigger value="response">Response</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="request" className="mt-0 flex-1 overflow-y-auto px-5 py-4 [scrollbar-gutter:stable] sm:px-6">
                <div className="space-y-[var(--density-card-gap)] pr-3">
                  <DetailSection
                    title="Request URL"
                    action={
                      <CopyButton
                        text={selectedLog.request_url}
                        successMessage="Request URL copied"
                        ariaLabel="Copy request URL from section"
                      />
                    }
                  >
                    <p className="break-all rounded-lg border bg-muted/20 px-3 py-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
                      {selectedLog.request_url}
                    </p>
                  </DetailSection>

                  <DetailSection
                    title="Headers"
                    subtitle="API keys are always redacted."
                    action={
                      <CopyButton
                        text={formatJson(selectedLog.request_headers)}
                        successMessage="Request headers copied"
                        ariaLabel="Copy request headers"
                      />
                    }
                  >
                    <pre className="max-h-[28vh] overflow-auto rounded-lg border bg-muted/60 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all scrollbar-thin">
                      {formatJson(selectedLog.request_headers)}
                    </pre>
                  </DetailSection>

                  <DetailSection title="Body">
                    <BodyInspector
                      content={selectedLog.request_body}
                      emptyMessage="Body capture disabled for this provider."
                    />
                  </DetailSection>
                </div>
              </TabsContent>

              <TabsContent value="response" className="mt-0 flex-1 overflow-y-auto px-5 py-4 [scrollbar-gutter:stable] sm:px-6">
                <div className="space-y-[var(--density-card-gap)] pr-3">
                  <DetailSection title="Response Status">
                    <div className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2">
                      <ValueBadge
                        label={String(selectedLog.response_status)}
                        intent={statusIntent(selectedLog.response_status)}
                        className="text-xs"
                      />
                      <p className="text-xs text-muted-foreground">Status returned by the upstream provider.</p>
                    </div>
                  </DetailSection>

                  <DetailSection
                    title="Headers"
                    subtitle="API keys are always redacted."
                    action={
                      selectedLog.response_headers ? (
                        <CopyButton
                          text={formatJson(selectedLog.response_headers)}
                          successMessage="Response headers copied"
                          ariaLabel="Copy response headers"
                        />
                      ) : null
                    }
                  >
                    <pre className="max-h-[28vh] overflow-auto rounded-lg border bg-muted/60 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all scrollbar-thin">
                      {formatJson(selectedLog.response_headers)}
                    </pre>
                  </DetailSection>

                  <DetailSection title="Body">
                    <BodyInspector
                      content={selectedLog.response_body}
                      emptyMessage={
                        selectedLog.is_stream
                          ? "Response body not recorded for streaming requests."
                          : "Body capture disabled for this provider."
                      }
                    />
                  </DetailSection>
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Failed to load details.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
