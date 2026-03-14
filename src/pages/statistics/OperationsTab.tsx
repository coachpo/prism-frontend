import { SpecialTokenCoverageStrip } from "@/components/statistics/SpecialTokenCoverageStrip";
import { useTimezone } from "@/hooks/useTimezone";
import type { OperationsTabProps } from "./operations/operationsTabProps";
import { OperationsChartsSection } from "./operations/OperationsChartsSection";
import { OperationsDebugSection } from "./operations/OperationsDebugSection";
import { OperationsFiltersCard } from "./operations/OperationsFiltersCard";
import { OperationsHealthSection } from "./operations/OperationsHealthSection";
import { useOperationsTabData } from "./operations/useOperationsTabData";

export function OperationsTab({
  logs,
  newLogIds,
  clearNewLogHighlight,
  models,
  connections,
  modelId,
  setModelId,
  providerType,
  setProviderType,
  connectionId,
  setConnectionId,
  timeRange,
  setTimeRange,
  specialTokenFilter,
  setSpecialTokenFilter,
  operationsStatusFilter,
  setOperationsStatusFilter,
}: OperationsTabProps) {
  const { format: formatTime } = useTimezone();
  const {
    requestLogRows,
    chartData,
    specialTokenCoverage,
    errorCodeBreakdown,
    slowRequests,
    costlyRequests,
    topErrors,
    latencyBandData,
    reportSymbol,
    reportCode,
    filteredRequestCount,
    filteredErrorCount,
    filteredSuccessCount,
    filteredSuccessRate,
    requestsPerSecond,
    filteredAvgLatency,
    filteredP95Latency,
    filteredP99Latency,
    rate4xx,
    rate5xx,
    cacheHitRate,
    ttftP95,
    operationsAggregationLabel,
    operationsLastUpdated,
    requestLogsPath,
  } = useOperationsTabData({
    logs,
    modelId,
    providerType,
    connectionId,
    timeRange,
    specialTokenFilter,
    operationsStatusFilter,
    formatTime,
  });

  return (
    <div className="space-y-6">
      <OperationsFiltersCard
        models={models}
        connections={connections}
        modelId={modelId}
        setModelId={setModelId}
        providerType={providerType}
        setProviderType={setProviderType}
        connectionId={connectionId}
        setConnectionId={setConnectionId}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        specialTokenFilter={specialTokenFilter}
        setSpecialTokenFilter={setSpecialTokenFilter}
        operationsStatusFilter={operationsStatusFilter}
        setOperationsStatusFilter={setOperationsStatusFilter}
        operationsAggregationLabel={operationsAggregationLabel}
        operationsLastUpdated={operationsLastUpdated}
      />

      <OperationsHealthSection
        requestLogRows={requestLogRows}
        filteredRequestCount={filteredRequestCount}
        filteredErrorCount={filteredErrorCount}
        filteredSuccessCount={filteredSuccessCount}
        filteredSuccessRate={filteredSuccessRate}
        requestsPerSecond={requestsPerSecond}
        filteredAvgLatency={filteredAvgLatency}
        filteredP95Latency={filteredP95Latency}
        filteredP99Latency={filteredP99Latency}
        rate4xx={rate4xx}
        rate5xx={rate5xx}
        cacheHitRate={cacheHitRate}
        ttftP95={ttftP95}
        reportSymbol={reportSymbol}
        reportCode={reportCode}
      />

      <OperationsChartsSection
        chartData={chartData}
        reportSymbol={reportSymbol}
        reportCode={reportCode}
        requestLogsPath={requestLogsPath}
      />

      <OperationsDebugSection
        errorCodeBreakdown={errorCodeBreakdown}
        latencyBandData={latencyBandData}
        topErrors={topErrors}
        slowRequests={slowRequests}
        costlyRequests={costlyRequests}
        newLogIds={newLogIds}
        clearNewLogHighlight={clearNewLogHighlight}
        reportSymbol={reportSymbol}
        reportCode={reportCode}
        requestLogsPath={requestLogsPath}
      />

      <SpecialTokenCoverageStrip
        totalRows={specialTokenCoverage.totalRows}
        cachedCaptured={specialTokenCoverage.cachedCaptured}
        reasoningCaptured={specialTokenCoverage.reasoningCaptured}
        anySpecialCaptured={specialTokenCoverage.anySpecialCaptured}
        noTokenUsage={specialTokenCoverage.noTokenUsage}
      />
    </div>
  );
}
