import type { VendorIconKey } from "@/lib/types";

export interface VendorIconPresetOption {
  icon_key: VendorIconKey;
  label: string;
  src: string;
}

const iconAsset = (name: string) => new URL(`./vendor-icon-${name}.svg`, import.meta.url).href;

export const vendorIconRegistry: Record<string, VendorIconPresetOption> = {
  openai: { icon_key: "openai", label: "OpenAI", src: iconAsset("openai") },
  anthropic: { icon_key: "anthropic", label: "Anthropic", src: iconAsset("anthropic") },
  google: { icon_key: "google", label: "Google", src: iconAsset("google") },
  deepseek: { icon_key: "deepseek", label: "DeepSeek", src: iconAsset("deepseek") },
  zhipu: { icon_key: "zhipu", label: "Z.ai", src: iconAsset("zhipu") },
  nvidia: { icon_key: "nvidia", label: "NVIDIA", src: iconAsset("nvidia") },
  aws: { icon_key: "aws", label: "AWS", src: iconAsset("aws") },
  azure: { icon_key: "azure", label: "Microsoft/Azure", src: iconAsset("azure") },
  meta: { icon_key: "meta", label: "Meta", src: iconAsset("meta") },
  mistral: { icon_key: "mistral", label: "Mistral", src: iconAsset("mistral") },
  cohere: { icon_key: "cohere", label: "Cohere", src: iconAsset("cohere") },
  huggingface: { icon_key: "huggingface", label: "Hugging Face", src: iconAsset("huggingface") },
  perplexity: { icon_key: "perplexity", label: "Perplexity", src: iconAsset("perplexity") },
  xai: { icon_key: "xai", label: "xAI", src: iconAsset("xai") },
  openrouter: { icon_key: "openrouter", label: "OpenRouter", src: iconAsset("openrouter") },
  alibaba: { icon_key: "alibaba", label: "Alibaba Cloud", src: iconAsset("alibaba") },
  tencent: { icon_key: "tencent", label: "Tencent", src: iconAsset("tencent") },
  baidu: { icon_key: "baidu", label: "Baidu", src: iconAsset("baidu") },
  kimi: { icon_key: "kimi", label: "Kimi", src: iconAsset("kimi") },
};

export const vendorIconPresetOptions = Object.values(vendorIconRegistry);

export function getVendorIconPreset(iconKey: string | null | undefined): VendorIconPresetOption | null {
  if (!iconKey) {
    return null;
  }

  return vendorIconRegistry[iconKey.trim().toLowerCase()] ?? null;
}
