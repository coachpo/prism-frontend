import type { LucideIcon } from "lucide-react";
import { ApiFamilyIcon } from "@/components/ApiFamilyIcon";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatApiFamily } from "@/lib/utils";

export function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[112px_minmax(0,1fr)] items-start gap-4 py-2 text-sm">
      <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <div className="min-w-0 text-sm font-medium text-foreground">{children}</div>
    </div>
  );
}

export function SummaryStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/80 p-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <div className="mt-1.5 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

export function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="space-y-0 px-4 py-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">{children}</CardContent>
    </Card>
  );
}

export function ApiFamilyPill({ apiFamily }: { apiFamily: string | null | undefined }) {
  if (!apiFamily) {
    return null;
  }

  return (
    <Badge variant="outline" className="gap-1.5 border-border/70 bg-background/80 text-[10px] font-medium">
      <ApiFamilyIcon apiFamily={apiFamily} size={12} />
      {formatApiFamily(apiFamily)}
    </Badge>
  );
}
