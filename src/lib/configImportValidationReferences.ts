import type { z } from "zod";

type IssuePath = (string | number)[];
type RefinementContext = Pick<z.RefinementCtx, "addIssue">;

type CollectNamedReferencesOptions<T extends { name: string }> = {
  items: T[];
  ctx: RefinementContext;
  collectionPath: string;
  referenceLabel: string;
  getName?: (item: T) => string | null | undefined;
};

type ResolveReferenceNameOptions = {
  value: string | null | undefined;
  ctx: RefinementContext;
  knownNames: Set<string>;
  path: IssuePath;
  missingMessage?: string;
  unknownMessage: (normalizedName: string) => string;
};

function capitalizeReferenceLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function addCustomIssue(ctx: RefinementContext, path: IssuePath, message: string) {
  ctx.addIssue({
    code: "custom",
    path,
    message,
  });
}

export function normalizeReferenceName(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function collectNamedReferences<T extends { name: string }>({
  items,
  ctx,
  collectionPath,
  referenceLabel,
  getName,
}: CollectNamedReferencesOptions<T>): Set<string> {
  const names = new Set<string>();

  items.forEach((item, index) => {
    const normalizedName = normalizeReferenceName(getName ? getName(item) : item.name);

    if (normalizedName === null) {
      addCustomIssue(
        ctx,
        [collectionPath, index, "name"],
        `${capitalizeReferenceLabel(referenceLabel)} name must not be empty`,
      );
      return;
    }

    if (names.has(normalizedName)) {
      addCustomIssue(
        ctx,
        [collectionPath, index, "name"],
        `Duplicate ${referenceLabel} name '${normalizedName}'`,
      );
    }

    names.add(normalizedName);
  });

  return names;
}

export function resolveRequiredReferenceName({
  value,
  ctx,
  knownNames,
  path,
  missingMessage,
  unknownMessage,
}: ResolveReferenceNameOptions): string | null {
  const normalizedName = normalizeReferenceName(value);

  if (normalizedName === null) {
    addCustomIssue(ctx, path, missingMessage ?? "Must include a reference name");
    return null;
  }

  if (!knownNames.has(normalizedName)) {
    addCustomIssue(ctx, path, unknownMessage(normalizedName));
    return null;
  }

  return normalizedName;
}

export function resolveOptionalReferenceName({
  value,
  ctx,
  knownNames,
  path,
  unknownMessage,
}: ResolveReferenceNameOptions): string | null {
  const normalizedName = normalizeReferenceName(value);

  if (normalizedName === null) {
    return null;
  }

  if (!knownNames.has(normalizedName)) {
    addCustomIssue(ctx, path, unknownMessage(normalizedName));
    return null;
  }

  return normalizedName;
}
