import { useMemo } from "react";
import type { SpendingGroupRow, SpendingReportResponse } from "@/lib/types";

export function useSpendingTabData(
  spending: SpendingReportResponse | null,
  spendingOffset: number,
  spendingLimit: number
) {
  const reportSymbol = spending?.report_currency_symbol ?? "$";
  const reportCode = spending?.report_currency_code ?? "USD";
  const canPaginateForward =
    spending !== null && spendingOffset + spendingLimit < spending.groups_total;

  const scatterData = useMemo(() => {
    if (!spending) return [];
    return spending.groups.map((group) => ({
      key: group.key,
      tokPerReq: group.total_requests > 0 ? group.total_tokens / group.total_requests : 0,
      costPer1MTok:
        group.total_tokens > 0 ? (group.total_cost_micros / group.total_tokens) * 1_000_000 : 0,
      totalCost: group.total_cost_micros,
    }));
  }, [spending]);

  const insights = useMemo(() => {
    if (!spending) {
      return {
        highestCost: null as SpendingGroupRow | null,
        leastEfficient: null as SpendingGroupRow | null,
        avgCostPer1M: 0,
      };
    }

    const sortedByCost = [...spending.groups].sort((a, b) => b.total_cost_micros - a.total_cost_micros);
    const sortedByEfficiency = [...spending.groups]
      .filter((group) => group.total_tokens > 0)
      .sort((a, b) => {
        const efficiencyA = (a.total_cost_micros / a.total_tokens) * 1_000_000;
        const efficiencyB = (b.total_cost_micros / b.total_tokens) * 1_000_000;
        return efficiencyB - efficiencyA;
      });

    const avgCostPer1M =
      spending.summary.total_tokens > 0
        ? (spending.summary.total_cost_micros / spending.summary.total_tokens) * 1_000_000
        : 0;

    return {
      highestCost: sortedByCost[0] ?? null,
      leastEfficient: sortedByEfficiency[0] ?? null,
      avgCostPer1M,
    };
  }, [spending]);

  return {
    reportSymbol,
    reportCode,
    canPaginateForward,
    scatterData,
    insights,
  };
}
