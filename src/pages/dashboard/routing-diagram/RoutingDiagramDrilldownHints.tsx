import { ArrowUpRight } from "lucide-react";

const HINTS = [
  {
    title: "Endpoints",
    description:
      "Inspect all request logs routed through a specific endpoint from the current profile.",
  },
  {
    title: "Models",
    description: "Jump directly into model configuration and connection details for a topology target.",
  },
  {
    title: "Links",
    description: "Open request logs filtered to a single endpoint-model path for fast triage.",
  },
] as const;

export function RoutingDiagramDrilldownHints() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {HINTS.map((hint) => (
        <DrilldownHint key={hint.title} title={hint.title} description={hint.description} />
      ))}
    </div>
  );
}

function DrilldownHint({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border bg-muted/30 px-3 py-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <ArrowUpRight className="h-4 w-4 text-primary" />
        {title}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
