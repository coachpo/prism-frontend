import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoneyMicros } from "@/lib/costing";
import { Progress } from "@/components/ui/progress";

interface TopSpendingItem {
  label: string;
  costMicros: number;
}

interface TopSpendingCardProps {
  title: string;
  items: TopSpendingItem[];
  totalCostMicros: number;
  currencySymbol: string;
  currencyCode: string;
}

export function TopSpendingCard({
  title,
  items,
  totalCostMicros,
  currencySymbol,
  currencyCode,
}: TopSpendingCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data available</p>
        ) : (
          items.map((item, i) => {
            const percentage = totalCostMicros > 0 ? (item.costMicros / totalCostMicros) * 100 : 0;
            return (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate max-w-[180px]">{item.label}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {formatMoneyMicros(item.costMicros, currencySymbol, currencyCode)}
                  </span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
