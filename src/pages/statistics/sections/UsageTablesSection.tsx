import type {
  UsageEndpointStatistic,
  UsageModelStatistic,
  UsageProxyApiKeyStatistic,
  UsageSnapshotCurrency,
} from "@/lib/types";
import { EndpointStatisticsTable } from "../tables/EndpointStatisticsTable";
import { ModelStatisticsTable } from "../tables/ModelStatisticsTable";
import { ProxyApiKeyStatisticsTable } from "../tables/ProxyApiKeyStatisticsTable";

interface UsageTablesSectionProps {
  currency: UsageSnapshotCurrency;
  endpointStatistics: UsageEndpointStatistic[];
  modelStatistics: UsageModelStatistic[];
  proxyApiKeyStatistics: UsageProxyApiKeyStatistic[];
}

export function UsageTablesSection({
  currency,
  endpointStatistics,
  modelStatistics,
  proxyApiKeyStatistics,
}: UsageTablesSectionProps) {
  return (
    <>
      <div className="grid gap-6 2xl:grid-cols-2">
        <EndpointStatisticsTable currency={currency} items={endpointStatistics} />
        <ModelStatisticsTable currency={currency} items={modelStatistics} />
      </div>

      <ProxyApiKeyStatisticsTable currency={currency} items={proxyApiKeyStatistics} />
    </>
  );
}
