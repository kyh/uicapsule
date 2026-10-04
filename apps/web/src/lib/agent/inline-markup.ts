/**
 * The inline markup prose copy may carry: `**bold**`, `` `code` `` and
 * `[label](href)`. Both representations of a page read their spans through this
 * one tokenizer, so the HTML page and its Markdown twin can never disagree
 * about what in a string is markup.
 *
 * Spans do not nest. Legal copy needs bold lead-ins and links side by side,
 * never one inside the other, and a flat scan cannot mis-pair a marker.
 */

export type InlineToken =
  | { kind: "text"; text: string }
  | { kind: "bold"; text: string }
  | { kind: "code"; text: string }
  | { kind: "link"; text: string; href: string };

const INLINE_SPAN =
  /\*\*(?<bold>[^*]+)\*\*|`(?<code>[^`]+)`|\[(?<label>[^\]]+)\]\((?<href>[^)\s]+)\)/gu;

const spanToken = (groups: Record<string, string | undefined>): InlineToken | null => {
  if (groups.bold !== undefined) {
    return { kind: "bold", text: groups.bold };
  }
  if (groups.code !== undefined) {
    return { kind: "code", text: groups.code };
  }
  if (groups.label !== undefined && groups.href !== undefined) {
    return { href: groups.href, kind: "link", text: groups.label };
  }
  return null;
};

export const parseInline = (source: string): InlineToken[] => {
  const tokens: InlineToken[] = [];
  let cursor = 0;
  for (const match of source.matchAll(INLINE_SPAN)) {
    const token = spanToken(match.groups ?? {});
    if (token) {
      if (match.index > cursor) {
        tokens.push({ kind: "text", text: source.slice(cursor, match.index) });
      }
      tokens.push(token);
      cursor = match.index + match[0].length;
    }
  }
  if (cursor < source.length) {
    tokens.push({ kind: "text", text: source.slice(cursor) });
  }
  return tokens;
};

/** Every link a string carries, in order. */
export const inlineLinks = (source: string): { text: string; href: string }[] =>
  parseInline(source).flatMap((token) =>
    token.kind === "link" ? [{ href: token.href, text: token.text }] : [],
  );
