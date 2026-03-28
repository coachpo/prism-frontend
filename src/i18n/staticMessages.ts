import { getCurrentLocale } from "./format";
import type { Messages } from "./messages/en";
import { enMessages } from "./messages/en";
import { zhCNMessages } from "./messages/zh-CN";

export function getStaticMessages(): Messages {
  return getCurrentLocale() === "zh-CN" ? zhCNMessages : enMessages;
}

export function getStaticLocaleMessages(): Messages {
  return getStaticMessages();
}

function normalizeLegacyLabel(label: string | null | undefined) {
  return label?.trim().toLocaleLowerCase() ?? "";
}

export function isLegacyAllModelsLabel(label: string, key: string) {
  const normalizedLabel = normalizeLegacyLabel(label);
  return (
    key === "all" ||
    normalizedLabel === normalizeLegacyLabel(enMessages.statistics.allModels) ||
    normalizedLabel === normalizeLegacyLabel(getStaticMessages().statistics.allModels)
  );
}

export function isLegacyUnknownEndpointLabel(label: string) {
  const normalizedLabel = normalizeLegacyLabel(label);
  return (
    normalizedLabel === normalizeLegacyLabel(enMessages.modelDetail.unknownEndpoint) ||
    normalizedLabel === normalizeLegacyLabel(getStaticMessages().modelDetail.unknownEndpoint)
  );
}

export function isLegacyUnknownProxyApiKeyLabel(label: string | null) {
  const normalizedLabel = normalizeLegacyLabel(label);
  return (
    !label ||
    normalizedLabel === normalizeLegacyLabel(enMessages.statistics.unknownProxyApiKey) ||
    normalizedLabel === normalizeLegacyLabel(getStaticMessages().statistics.unknownProxyApiKey)
  );
}

export function isLegacyUnknownVendorLabel(label: string | null | undefined) {
  const normalizedLabel = normalizeLegacyLabel(label);
  return (
    !label ||
    normalizedLabel === normalizeLegacyLabel(enMessages.modelsUi.unknownVendor) ||
    normalizedLabel === normalizeLegacyLabel(getStaticMessages().modelsUi.unknownVendor)
  );
}
