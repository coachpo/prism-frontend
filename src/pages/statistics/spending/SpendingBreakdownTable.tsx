import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoneyMicros } from "@/lib/costing";
import type { SpendingReportResponse } from "@/lib/types";

interface SpendingBreakdownTableProps {
  canPaginateForward: boolean;
  reportCode: string;
  reportSymbol: string;
  setSpendingOffset: (value: number) => void;
  spending: SpendingReportResponse;
  spendingLimit: number;
  spendingOffset: number;
}

export function SpendingBreakdownTable({
  canPaginateForward,
  reportCode,
  reportSymbol,
  setSpendingOffset,
  spending,
  spendingLimit,
  spendingOffset,
}: SpendingBreakdownTableProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Spending Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group</TableHead>
                <TableHead className="text-right">Requests</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead className="text-right">% Total</TableHead>
                <TableHead className="text-right">$/Req</TableHead>
                <TableHead className="text-right">$/1M tok</TableHead>
                <TableHead className="text-right">Tok/Req</TableHead>
                <TableHead className="text-right">Priced %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {spending.groups.map((group) => {
                const percent =
                  spending.summary.total_cost_micros > 0
                    ? (group.total_cost_micros / spending.summary.total_cost_micros) * 100
                    : 0;
                const costPerReq = group.total_requests > 0 ? group.total_cost_micros / group.total_requests : 0;
                const costPer1MTok = group.total_tokens > 0 ? (group.total_cost_micros / group.total_tokens) * 1_000_000 : 0;
                const tokPerReq = group.total_requests > 0 ? group.total_tokens / group.total_requests : 0;
                const pricedPercent = group.total_requests > 0 ? (group.priced_requests / group.total_requests) * 100 : 0;

                return (
                  <TableRow key={group.key}>
                    <TableCell className="font-medium">{group.key}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {group.total_requests.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {(group.total_tokens / 1000).toFixed(0)}k
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoneyMicros(group.total_cost_micros, reportSymbol, reportCode)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {percent.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs">
                      {formatMoneyMicros(costPerReq, reportSymbol, reportCode, 4)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs">
                      {formatMoneyMicros(costPer1MTok, reportSymbol, reportCode, 4)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs">{tokPerReq.toFixed(0)}</TableCell>
                    <TableCell className="text-right tabular-nums text-xs">
                      {pricedPercent.toFixed(0)}%
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between border-t px-4 py-3">
          <p className="text-xs text-muted-foreground">
            {spendingOffset + 1}–{Math.min(spendingOffset + spendingLimit, spending.groups_total)} of {" "}
            {spending.groups_total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={spendingOffset === 0}
              onClick={() => setSpendingOffset(Math.max(0, spendingOffset - spendingLimit))}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!canPaginateForward}
              onClick={() => setSpendingOffset(spendingOffset + spendingLimit)}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
