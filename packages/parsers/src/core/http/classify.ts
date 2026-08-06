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

export const looksLikeAntibotChallenge = (
  statusCode: number,
  headers: Record<string, string | string[] | undefined>,
  bodySample: string,
): boolean => {
  if (statusCode !== 403 && statusCode !== 503) {
    return false;
  }

  const lowerBody = bodySample.toLowerCase();
  return CHALLENGE_MARKERS.some((marker) => lowerBody.includes(marker));
};

/** Turns a raw upstream HTTP response into a ParserError, or null if the response is usable. */
export const classifyResponse = (
  sourceId: string,
  statusCode: number,
  headers: Record<string, string | string[] | undefined>,
  bodySample: string,
): SourceBlockedError | NotFoundError | SourceUnavailableError | null => {
  if (statusCode < 400) {
    return null;
  }
  if (looksLikeAntibotChallenge(statusCode, headers, bodySample)) {
    return new SourceBlockedError(`Antibot challenge (HTTP ${statusCode})`, sourceId);
  }
  if (statusCode === 404) {
    return new NotFoundError('Not found', sourceId);
  }
  return new SourceUnavailableError(`Upstream HTTP ${statusCode}`, sourceId);
};
