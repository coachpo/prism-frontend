export function parseConflictMessage(error: unknown): string | null {
  if (!(error instanceof Error)) return null;
  if (error.message.includes("Maximum 10 profiles reached")) {
    return "Maximum 10 profiles reached. Delete a profile to create a new one.";
  }
  if (error.message.includes("409") || error.message.toLowerCase().includes("conflict")) {
    return error.message;
  }
  return null;
}
