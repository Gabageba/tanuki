import { NotFoundError, SourceBlockedError, SourceUnavailableError } from '../../errors';

/**
 * Ported from apps/api/src/parsers-client/antibot-detection.ts. In the old sidecar
 * architecture this inspected the *sidecar's* `{"error": "..."}` envelope — the real upstream
 * challenge body only reached it if it happened to land inside a Kotlin exception message, so
 * it could essentially never fire correctly. Here it runs against the real upstream response,
 * which is where this check belongs. False positives are fine — SOURCE_BLOCKED and
 * SOURCE_UNAVAILABLE behave almost identically for the client, only the message differs.
 */
const CHALLENGE_MARKERS = [
  'cf-browser-verification',
  'cf-chl-',
  'challenge-platform',
  'just a moment',
  'attention required',
  'checking your browser',
  'ddos protection by',
  'ddos-guard',
];

/**
 * Unlike `server: cloudflare` (fronts a huge share of the legitimate web, so it's deliberately
 * *not* trusted alone — see the classifyResponse tests), these vendors are single-purpose bot
 * mitigation with no legitimate-CDN use here: a 403/503 that's still coming from the mitigation
 * layer itself (not proxied through to the source's own app) is the challenge/block response,
 * whatever its body happens to say this week.
 */
const DEDICATED_ANTIBOT_SERVER_HEADERS = ['ddos-guard'];

const normalizeHeader = (value: string | string[] | undefined): string =>
  (Array.isArray(value) ? value.join(',') : (value ?? '')).toLowerCase();

const PAGE_TITLE_REGEX = /<title[^>]*>([^<]{1,120})<\/title>/i;

/**
 * A generic 5xx/4xx error page's own `<title>` is usually the most human-readable summary of
 * what's actually wrong (a source's own "Профилактика"/"Server is under maintenance" page, a
 * CDN's "Bad Gateway", a WAF's block page) — cheaper and more broadly useful than teaching
 * classifyResponse per-source phrasing, and it turns `Upstream HTTP 503 at <url>` into something
 * that tells the reader whether to just wait it out or go investigate.
 */
const extractPageTitle = (bodySample: string): string | null => {
  const title = PAGE_TITLE_REGEX.exec(bodySample)?.[1]?.replace(/\s+/g, ' ').trim();
  return title ? title : null;
};

export const looksLikeAntibotChallenge = (
  statusCode: number,
  headers: Record<string, string | string[] | undefined>,
  bodySample: string,
): boolean => {
  if (statusCode !== 403 && statusCode !== 503) {
    return false;
  }

  const server = normalizeHeader(headers['server']);
  if (DEDICATED_ANTIBOT_SERVER_HEADERS.some((marker) => server.includes(marker))) {
    return true;
  }

  const lowerBody = bodySample.toLowerCase();
  return CHALLENGE_MARKERS.some((marker) => lowerBody.includes(marker));
};

/** Turns a raw upstream HTTP response into a ParserError, or null if the response is usable. */
export const classifyResponse = (
  sourceId: string,
  statusCode: number,
  url: string,
  headers: Record<string, string | string[] | undefined>,
  bodySample: string,
): SourceBlockedError | NotFoundError | SourceUnavailableError | null => {
  if (statusCode < 400) {
    return null;
  }
  if (looksLikeAntibotChallenge(statusCode, headers, bodySample)) {
    return new SourceBlockedError(`Antibot challenge (HTTP ${statusCode}) at ${url}`, sourceId);
  }
  if (statusCode === 404) {
    return new NotFoundError(`Not found: ${url}`, sourceId);
  }
  const pageTitle = extractPageTitle(bodySample);
  const suffix = pageTitle ? ` (${pageTitle})` : '';
  return new SourceUnavailableError(`Upstream HTTP ${statusCode} at ${url}${suffix}`, sourceId);
};
