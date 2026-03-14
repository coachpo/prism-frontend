import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OperationsChartCardProps {
  title: string;
  heightClassName: string;
  children: ReactNode;
}

export function OperationsChartCard({
  title,
  heightClassName,
  children,
}: OperationsChartCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className={heightClassName}>{children}</div>
      </CardContent>
    </Card>
  );
}
