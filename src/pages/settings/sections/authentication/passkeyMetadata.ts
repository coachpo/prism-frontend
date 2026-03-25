import type { PasskeyCredential } from "./types";
import {
  formatDateForLocale,
  formatRelativeTimeFromNow,
  getCurrentLocale,
} from "@/i18n/format";

function formatCreatedDate(dateString: string) {
  const locale = getCurrentLocale();
  const isChinese = locale === "zh-CN";
  const timestamp = new Date(dateString);
  if (Number.isNaN(timestamp.getTime())) {
    return isChinese ? "未知日期" : "Unknown date";
  }

  return formatDateForLocale(locale, dateString, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelativeLastUsed(dateString: string | null) {
  const locale = getCurrentLocale();
  const isChinese = locale === "zh-CN";
  if (!dateString) {
    return isChinese ? "尚未使用" : "Not used yet";
  }

  const timestamp = new Date(dateString);
  if (Number.isNaN(timestamp.getTime())) {
    return isChinese ? "上次使用时间未知" : "Unknown last use";
  }

  return formatRelativeTimeFromNow(dateString, locale);
}

export function getPasskeyStateBadge(passkey: PasskeyCredential) {
  const isChinese = getCurrentLocale() === "zh-CN";
  if (passkey.backup_state) {
    return {
      label: isChinese ? "已同步" : "Synced",
      className:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    };
  }

  if (passkey.backup_eligible === true) {
    return {
      label: isChinese ? "可备份" : "Backup ready",
      className: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    };
  }

  if (passkey.backup_eligible === false) {
    return {
      label: isChinese ? "设备绑定" : "Device-bound",
      className: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    };
  }

  return null;
}

export function buildPasskeyMetadata(passkey: PasskeyCredential) {
  const isChinese = getCurrentLocale() === "zh-CN";
  const parts = [isChinese ? `创建于 ${formatCreatedDate(passkey.created_at)}` : `Created ${formatCreatedDate(passkey.created_at)}`];

  if (passkey.last_used_at) {
    parts.push(isChinese ? `上次使用 ${formatRelativeLastUsed(passkey.last_used_at)}` : `Last used ${formatRelativeLastUsed(passkey.last_used_at)}`);
  } else {
    parts.push(isChinese ? "尚未使用" : "Not used yet");
  }

  if (passkey.backup_state) {
    parts.push(isChinese ? "已同步到你的账户" : "Synced to your account");
  } else if (passkey.backup_eligible === true) {
    parts.push(isChinese ? "支持备份" : "Backup capable");
  } else if (passkey.backup_eligible === false) {
    parts.push(isChinese ? "存储在此设备上" : "Stored on this device");
  }

  return parts.join(" · ");
}
