import type { PasskeyCredential } from "./types";

const createdDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
  style: "short",
});

function formatCreatedDate(dateString: string) {
  const timestamp = new Date(dateString);
  if (Number.isNaN(timestamp.getTime())) {
    return "Unknown date";
  }

  return createdDateFormatter.format(timestamp);
}

function formatRelativeLastUsed(dateString: string | null) {
  if (!dateString) {
    return "Not used yet";
  }

  const timestamp = new Date(dateString);
  if (Number.isNaN(timestamp.getTime())) {
    return "Unknown last use";
  }

  const delta = timestamp.getTime() - Date.now();
  const absoluteDelta = Math.abs(delta);

  if (absoluteDelta < 60_000) {
    return "just now";
  }

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31_536_000_000],
    ["month", 2_592_000_000],
    ["week", 604_800_000],
    ["day", 86_400_000],
    ["hour", 3_600_000],
    ["minute", 60_000],
  ];

  for (const [unit, size] of units) {
    if (absoluteDelta >= size) {
      return relativeTimeFormatter.format(Math.round(delta / size), unit);
    }
  }

  return "just now";
}

export function getPasskeyStateBadge(passkey: PasskeyCredential) {
  if (passkey.backup_state) {
    return {
      label: "Synced",
      className:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    };
  }

  if (passkey.backup_eligible === true) {
    return {
      label: "Backup ready",
      className: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    };
  }

  if (passkey.backup_eligible === false) {
    return {
      label: "Device-bound",
      className: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    };
  }

  return null;
}

export function buildPasskeyMetadata(passkey: PasskeyCredential) {
  const parts = [`Created ${formatCreatedDate(passkey.created_at)}`];

  if (passkey.last_used_at) {
    parts.push(`Last used ${formatRelativeLastUsed(passkey.last_used_at)}`);
  } else {
    parts.push("Not used yet");
  }

  if (passkey.backup_state) {
    parts.push("Synced to your account");
  } else if (passkey.backup_eligible === true) {
    parts.push("Backup capable");
  } else if (passkey.backup_eligible === false) {
    parts.push("Stored on this device");
  }

  return parts.join(" · ");
}
