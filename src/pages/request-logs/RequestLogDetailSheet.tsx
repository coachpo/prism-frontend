import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { RequestLogEntry } from "@/lib/types";
import type { RequestDetailTab } from "./queryParams";
import { RequestLogAuditTab } from "./RequestLogAuditTab";
import { RequestLogDetailHeader } from "./RequestLogDetailHeader";
import { RequestLogOverviewTab } from "./RequestLogOverviewTab";
import { useRequestLogAuditDetail } from "./useRequestLogAuditDetail";

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
  const selectedLogId = selectedLog?.id ?? null;

  const { auditDetail, auditLoading, auditError, auditChecked } = useRequestLogAuditDetail({
    selectedLogId,
    detailTab,
  });

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

  const openConnectionDetails = () => {
    if (selectedLog?.connection_id) {
      void navigateToConnection(selectedLog.connection_id);
    }
  };

  return (
    <Sheet open={!!selectedLog} onOpenChange={(open) => !open && closeSheet()}>
      <SheetContent
        className="w-full overflow-y-auto p-0 outline-none sm:max-w-3xl"
        tabIndex={-1}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          (event.currentTarget as HTMLElement | null)?.focus();
        }}
      >
        {selectedLog ? (
          <div className="flex min-h-full flex-col bg-gradient-to-b from-background via-background to-muted/10">
            <RequestLogDetailHeader selectedLog={selectedLog} formatTime={formatTime} />

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
                  <RequestLogOverviewTab
                    selectedLog={selectedLog}
                    formatTime={formatTime}
                    refineRequestContext={refineRequestContext}
                    focusConnectionOnly={focusConnectionOnly}
                    openConnectionDetails={openConnectionDetails}
                    exportSelectedLog={exportSelectedLog}
                  />
                </TabsContent>

                <TabsContent value="audit" className="space-y-4">
                  <RequestLogAuditTab
                    auditDetail={auditDetail}
                    auditLoading={auditLoading}
                    auditError={auditError}
                    auditChecked={auditChecked}
                    formatTime={formatTime}
                    setDetailTab={setDetailTab}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
