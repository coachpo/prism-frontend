import { FileText, Terminal } from "lucide-react";
import { useLocale } from "@/i18n/useLocale";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { RequestLogEntry } from "@/lib/types";
import type { DetailTab } from "./queryParams";
import { useAuditDetail } from "./useAuditDetail";
import { RequestLogAuditTab } from "./detail/RequestLogAuditTab";
import { RequestLogOverviewTab } from "./detail/RequestLogOverviewTab";

interface RequestLogDetailSheetProps {
  request: RequestLogEntry | null;
  open: boolean;
  activeTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
  onClose: () => void;
  onNavigateToConnection: (connectionId: number) => void;
  formatTimestamp: (iso: string) => string;
  resolveModelLabel: (modelId: string) => string;
}

export function RequestLogDetailSheet({
  request,
  open,
  activeTab,
  onTabChange,
  onClose,
  onNavigateToConnection,
  formatTimestamp,
  resolveModelLabel,
}: RequestLogDetailSheetProps) {
  const { messages } = useLocale();
  const { audits, loading: auditLoading, error: auditError } = useAuditDetail({
    requestLogId: request?.id ?? null,
    enabled: open && activeTab === "audit",
  });

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <SheetContent className="w-full overflow-y-auto border-l border-border/70 bg-background/98 px-0 sm:max-w-xl xl:max-w-2xl">
        <div className="space-y-6 px-6 pb-6 pt-5">
          <SheetHeader className="space-y-2 pr-8 text-left">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Terminal className="h-3.5 w-3.5" />
              <span>{messages.requestLogs.technicalInspection}</span>
            </div>
            <SheetTitle className="text-xl font-semibold tracking-tight">
              {messages.requestLogs.requestTitle(request?.id ?? "")}
            </SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              {messages.requestLogs.detailDescription}
            </SheetDescription>
          </SheetHeader>

          {request && (
            <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as DetailTab)} className="space-y-4">
              <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl bg-muted/70 p-1">
                <TabsTrigger value="overview" className="gap-2 rounded-lg text-sm font-medium">
                  <FileText className="h-4 w-4" />
                  {messages.requestLogs.overview}
                </TabsTrigger>
                <TabsTrigger value="audit" className="gap-2 rounded-lg text-sm font-medium">
                  <Terminal className="h-4 w-4" />
                  {messages.requestLogs.audit}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-0">
                <RequestLogOverviewTab
                  request={request}
                  onNavigateToConnection={onNavigateToConnection}
                  formatTimestamp={formatTimestamp}
                  resolveModelLabel={resolveModelLabel}
                />
              </TabsContent>

              <TabsContent value="audit" className="mt-0">
                <RequestLogAuditTab
                  audits={audits}
                  loading={auditLoading}
                  error={auditError}
                  formatTimestamp={formatTimestamp}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
