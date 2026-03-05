import type { BadgeIntent } from "@/components/StatusBadge";
import type { ConnectionDropdownItem } from "@/lib/types";

export const UNIVERSAL_TIMESTAMP_FORMAT: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
  hour12: true,
};

export function toDatetimeLocalValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatFilterDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", UNIVERSAL_TIMESTAMP_FORMAT).format(parsed);
}

export const getConnectionLabel = (
  connection: Pick<ConnectionDropdownItem, "id" | "name">
): string => connection.name ?? "";

export function statusIntent(status: number): BadgeIntent {
  if (status >= 200 && status < 300) return "success";
  if (status >= 400 && status < 500) return "warning";
  if (status >= 500) return "danger";
  return "muted";
}

export function methodIntent(method: string): BadgeIntent {
  switch (method.toUpperCase()) {
    case "GET":
      return "blue";
    case "POST":
      return "success";
    case "PUT":
      return "warning";
    case "DELETE":
      return "danger";
    default:
      return "muted";
  }
}

export function formatRequestPath(requestUrl: string): string {
  try {
    const url = new URL(requestUrl);
    return `${url.pathname}${url.search}`;
  } catch {
    return requestUrl;
  }
}

export function formatJson(raw: string | null): string {
  if (!raw) return "";
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}
