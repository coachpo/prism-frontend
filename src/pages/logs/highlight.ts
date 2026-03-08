export type HighlightSegment = {
  text: string;
  match: boolean;
};

export function getHighlightSegments(text: string, query: string): { count: number; segments: HighlightSegment[] } {
  if (!query) {
    return { count: 0, segments: [{ text, match: false }] };
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  if (lowerQuery.length === 0) {
    return { count: 0, segments: [{ text, match: false }] };
  }

  const segments: HighlightSegment[] = [];
  let cursor = 0;
  let count = 0;

  while (cursor < text.length) {
    const matchIndex = lowerText.indexOf(lowerQuery, cursor);
    if (matchIndex === -1) {
      segments.push({ text: text.slice(cursor), match: false });
      break;
    }

    if (matchIndex > cursor) {
      segments.push({ text: text.slice(cursor, matchIndex), match: false });
    }

    const end = matchIndex + lowerQuery.length;
    segments.push({ text: text.slice(matchIndex, end), match: true });
    count += 1;
    cursor = end;
  }

  if (segments.length === 0) {
    segments.push({ text, match: false });
  }

  return { count, segments };
}
