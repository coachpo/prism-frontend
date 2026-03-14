import type { ReactNode } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Skeleton } from "@/components/ui/skeleton";

export function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-background/70 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-mono text-sm text-foreground">{value}</p>
    </div>
  );
}

export function DetailSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-3xl border bg-card/80 p-4 shadow-sm">
      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function CodePanel({
  title,
  value,
  fallback,
}: {
  title: string;
  value: string | null | undefined;
  fallback: string;
}) {
  const content = value && value.trim().length > 0 ? value : fallback;

  return (
    <div className="min-w-0 space-y-3 rounded-3xl border bg-muted/15 p-4 shadow-sm">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <p className="min-w-0 flex-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {title}
        </p>
        <CopyButton value={content} label="Copy" targetLabel={title} />
      </div>
      <pre className="h-80 w-full min-w-0 max-w-full overflow-y-auto overflow-x-hidden overscroll-contain rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100 shadow-inner sm:h-96 md:h-[28rem]">
        <code className="block min-w-0 whitespace-pre-wrap [overflow-wrap:anywhere]">{content}</code>
      </pre>
    </div>
  );
}

export function AuditLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-20 rounded-2xl" />
      <Skeleton className="h-56 rounded-2xl" />
      <Skeleton className="h-56 rounded-2xl" />
    </div>
  );
}
