export function parseConflictMessage(
  error: unknown,
  localizedLimitReachedMessage: string,
): string | null {
  if (!(error instanceof Error)) return null;
  if (error.message.includes("Maximum 10 profiles reached")) {
    return localizedLimitReachedMessage;
  }
  if (error.message.includes("409") || error.message.toLowerCase().includes("conflict")) {
    return error.message;
  }
  return null;
}
