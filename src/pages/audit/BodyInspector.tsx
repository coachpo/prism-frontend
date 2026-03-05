import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Copy, Search, WrapText } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { copyTextToClipboard } from "./clipboard";
import { getHighlightSegments } from "./highlight";

import { formatJson } from "./utils";
export function CopyButton({
  text,
  successMessage = "Copied to clipboard",
  ariaLabel = "Copy to clipboard",
}: {
  text: string;
  successMessage?: string;
  ariaLabel?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const success = await copyTextToClipboard(text);
      if (!success) {
        toast.error("Failed to copy");
        return;
      }
      toast.success(successMessage);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-7 w-7 shrink-0"
      onClick={(event) => {
        event.stopPropagation();
        void handleCopy();
      }}
      aria-label={ariaLabel}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-success" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}

export interface BodyInspectorProps {
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

  const { segments, count } = useMemo(
    () => getHighlightSegments(displayContent, query),
    [displayContent, query]
  );

  if (!content) {
    return (
      <div className="p-3 border border-dashed rounded-lg text-xs text-muted-foreground italic">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/20 p-2 pr-3">
        <div className="flex items-center gap-1">
          <Button
            variant={mode === "pretty" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setMode("pretty")}
          >
            Pretty
          </Button>
          <Button
            variant={mode === "raw" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setMode("raw")}
          >
            Raw
          </Button>
          <Button
            variant={wrap ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setWrap((prev) => !prev)}
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
          {query ? (
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {count} match{count === 1 ? "" : "es"}
            </span>
          ) : null}
          <CopyButton
            text={displayContent}
            successMessage="Body content copied"
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
