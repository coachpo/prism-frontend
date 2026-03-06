import type { Endpoint, ModelConfigListItem } from "@/lib/types";

const MODEL_BADGE_STYLES = [
  "border-primary/25 bg-primary/10 text-primary",
] as const;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function normalizeModelColorKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function getModelBadgeClass(model: ModelConfigListItem): string {
  const colorKey = normalizeModelColorKey(model.display_name || model.model_id);
  return MODEL_BADGE_STYLES[hashString(colorKey) % MODEL_BADGE_STYLES.length];
}

export function getEndpointHost(baseUrl: string): string {
  try {
    return new URL(baseUrl).host;
  } catch {
    return baseUrl;
  }
}

export function buildDuplicateName(sourceName: string, existingNames: Set<string>): string {
  const baseName = `${sourceName.trim()} copy`;
  if (!existingNames.has(baseName)) {
    return baseName;
  }

  let suffix = 2;
  while (existingNames.has(`${baseName} ${suffix}`)) {
    suffix += 1;
  }
  return `${baseName} ${suffix}`;
}

function fallbackCopyText(text: string): boolean {
  if (typeof document === "undefined") return false;
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (fallbackCopyText(text)) {
    return true;
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

export function getMaskedApiKey(endpoint: Endpoint): string {
  return endpoint.api_key.length > 8
    ? `${endpoint.api_key.slice(0, 4)}••••••${endpoint.api_key.slice(-4)}`
    : "••••••";
}
