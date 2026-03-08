import { useMemo, useState } from "react";
import { Search, WrapText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ClipboardButton } from "./clipboard";
import { getHighlightSegments } from "./highlight";
import { formatJson } from "./formatters";

interface BodyInspectorProps {
  content: string | null;
  emptyMessage: string;
}

export function BodyInspector({ content, emptyMessage }: BodyInspectorProps) {
  const [mode, setMode] = useState<"pretty" | "raw">("pretty");
  const [wrap, setWrap] = useState(true);
  const [query, setQuery] = useState("");

  const rawContent = content ?? "";
  const prettyContent = useMemo(() => formatJson(rawContent), [rawContent]);
  const displayContent = mode === "pretty" ? prettyContent : rawContent;
  const { count, segments } = useMemo(() => getHighlightSegments(displayContent, query), [displayContent, query]);

  if (!content) {
    return <div className="rounded-lg border border-dashed p-3 text-xs italic text-muted-foreground">{emptyMessage}</div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/20 p-2 pr-3">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={mode === "pretty" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setMode("pretty")}
          >
            Pretty
          </Button>
          <Button
            type="button"
            variant={mode === "raw" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setMode("raw")}
          >
            Raw
          </Button>
          <Button
            type="button"
            variant={wrap ? "secondary" : "ghost"}
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => setWrap((previous) => !previous)}
          >
            <WrapText className="h-3 w-3" />
            Wrap
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find in body"
              className="h-7 w-[160px] pl-7 text-xs"
              aria-label="Find in body"
            />
          </div>
          {query ? <span className="text-[11px] tabular-nums text-muted-foreground">{count} match{count === 1 ? "" : "es"}</span> : null}
          <ClipboardButton
            text={displayContent}
            successMessage="Body content copied"
            errorMessage="Failed to copy body content"
            ariaLabel="Copy body content"
          />
        </div>
      </div>

      <pre
        className={cn(
          "max-h-[44vh] overflow-auto rounded-lg border bg-muted/60 p-3 font-mono text-xs leading-relaxed scrollbar-thin",
          wrap ? "whitespace-pre-wrap break-all" : "whitespace-pre"
        )}
      >
        {segments.map((segment, index) =>
          segment.match ? (
            <mark
              key={`${index}-${segment.text}`}
              className="rounded-sm bg-yellow-200 px-0.5 text-black dark:bg-yellow-700 dark:text-white"
            >
              {segment.text}
            </mark>
          ) : (
            <span key={`${index}-${segment.text}`}>{segment.text}</span>
          )
        )}
      </pre>
    </div>
  );
}
