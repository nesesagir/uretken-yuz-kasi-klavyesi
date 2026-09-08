export function extractSentence(raw: string): string | null {
  try {
    const parsed = JSON.parse(raw) as { sentence?: unknown };
    if (typeof parsed.sentence === "string" && parsed.sentence.trim()) {
      return parsed.sentence.trim();
    }
  } catch {
    const match = raw.match(/"sentence"\s*:\s*"((?:\\.|[^"\\])*)"/);
    if (match?.[1]) {
      return match[1].replace(/\\"/g, '"').trim();
    }
  }
  return null;
}
