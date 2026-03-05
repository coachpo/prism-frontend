

export function fallbackCopyText(text: string): boolean {
  if (typeof document === "undefined" || !document.body) return false;
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.setAttribute("aria-hidden", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";

  const selection = document.getSelection();
  const previousRanges: Range[] = [];
  if (selection) {
    for (let i = 0; i < selection.rangeCount; i += 1) {
      previousRanges.push(selection.getRangeAt(i).cloneRange());
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
    if (selection) {
      try {
        selection.removeAllRanges();
        previousRanges.forEach((range) => selection.addRange(range));
      } catch {
        // Ignore selection restore failures.
      }
    }
    if (activeElement && typeof activeElement.focus === "function") {
      try {
        activeElement.focus();
      } catch {
        // Ignore focus restore failures.
      }
    }
  }
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  // Try fallback first so copy still works in restricted/insecure contexts.
  if (fallbackCopyText(text)) {
    return true;
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // No-op: fall through to false.
    }
  }

  return false;
}
