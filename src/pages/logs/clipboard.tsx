import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function restoreSelection(selection: Selection | null, previousRanges: Range[]): boolean {
  if (!selection) return true;

  try {
    selection.removeAllRanges();
    previousRanges.forEach((range) => selection.addRange(range));
    return true;
  } catch {
    return false;
  }
}

function restoreFocus(activeElement: HTMLElement | null): boolean {
  if (!activeElement || typeof activeElement.focus !== "function") return true;

  try {
    activeElement.focus();
    return true;
  } catch {
    return false;
  }
}

function fallbackCopyText(text: string): boolean {
  if (typeof document === "undefined" || !document.body) return false;

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.setAttribute("aria-hidden", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  textarea.style.fontSize = "12pt";

  const selection = document.getSelection();
  const previousRanges: Range[] = [];
  if (selection) {
    for (let index = 0; index < selection.rangeCount; index += 1) {
      previousRanges.push(selection.getRangeAt(index).cloneRange());
    }
  }

  const activeElement = document.activeElement as HTMLElement | null;

  try {
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    if (textarea.parentNode) {
      textarea.parentNode.removeChild(textarea);
    }

    restoreSelection(selection, previousRanges);
    restoreFocus(activeElement);
  }
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && typeof window !== "undefined" && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return fallbackCopyText(text);
    }
  }

  return fallbackCopyText(text);
}

function useClipboard(options?: { timeout?: number }) {
  const timeout = options?.timeout ?? 2000;
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const copy = useCallback(
    async (text: string, successMessage = "Copied to clipboard", errorMessage = "Failed to copy") => {
      const success = await copyTextToClipboard(text);
      if (!success) {
        toast.error(errorMessage);
        return false;
      }

      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }

      setCopied(true);
      toast.success(successMessage);
      timeoutRef.current = window.setTimeout(() => setCopied(false), timeout);
      return true;
    },
    [timeout]
  );

  return { copied, copy };
}

interface ClipboardButtonProps {
  ariaLabel?: string;
  className?: string;
  errorMessage?: string;
  label?: string;
  size?: "default" | "sm" | "lg" | "icon";
  successMessage?: string;
  text: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function ClipboardButton({
  ariaLabel = "Copy to clipboard",
  className,
  errorMessage,
  label,
  size = "icon",
  successMessage,
  text,
  variant = "ghost",
}: ClipboardButtonProps) {
  const { copied, copy } = useClipboard();

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(size === "icon" ? "h-7 w-7 shrink-0" : "gap-1.5", className)}
      aria-label={ariaLabel}
      onClick={(event) => {
        event.stopPropagation();
        void copy(text, successMessage, errorMessage);
      }}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
      {label ? <span>{label}</span> : null}
    </Button>
  );
}
