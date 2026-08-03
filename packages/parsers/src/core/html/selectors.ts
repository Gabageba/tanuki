import type { Cheerio } from 'cheerio';
import type { AnyNode } from 'domhandler';
import { ParseError } from '../../errors';

export function attrOrNull($el: Cheerio<AnyNode>, name: string): string | null {
  const value = $el.attr(name);
  return value === undefined || value === '' ? null : value;
}

export function textOrNull($el: Cheerio<AnyNode>): string | null {
  const value = $el.text().trim();
  return value === '' ? null : value;
}

/** jsoup's Element.ownText() — direct text-node children only, descendant elements excluded. */
export function ownText($el: Cheerio<AnyNode>): string {
  let text = '';
  $el.contents().each((_, node) => {
    if (node.type === 'text' && 'data' in node) {
      text += node.data;
    }
  });
  return text.trim();
}

/** Resolves `attrName` on the element against `baseUrl`, or null if the attribute is absent. */
export function absUrl($el: Cheerio<AnyNode>, attrName: string, baseUrl: string): string | null {
  const raw = attrOrNull($el, attrName);
  if (raw === null) return null;
  try {
    return new URL(raw, baseUrl).toString();
  } catch {
    return null;
  }
}

export function selectFirstOrThrow(
  $el: Cheerio<AnyNode>,
  selector: string,
  sourceId: string,
  context = '',
): Cheerio<AnyNode> {
  const found = $el.find(selector).first();
  if (found.length === 0) {
    throw new ParseError(
      `Element not found: ${selector}${context ? ` (${context})` : ''}`,
      sourceId,
    );
  }
  return found;
}
