import { describe, expect, it } from 'vitest';
import { looksLikeAntibotChallenge, classifyResponse } from '../src/core/http/classify';
import { NotFoundError, SourceBlockedError, SourceUnavailableError } from '../src/errors';
import { SOURCE_ID } from '../src/sources/catalog';

describe('looksLikeAntibotChallenge', () => {
  it('detects a real Cloudflare challenge page', () => {
    const body =
      '<html><head><title>Just a moment...</title></head><body>Checking your browser before accessing example.com.</body></html>';
    expect(looksLikeAntibotChallenge(503, { server: 'cloudflare' }, body)).toBe(true);
  });

  it('detects a ddos-guard challenge page', () => {
    const body = '<html>This site is protected by DDoS-Guard</html>';
    expect(looksLikeAntibotChallenge(403, {}, body)).toBe(true);
  });

  it('does not fire on a genuine 500 with no challenge markers', () => {
    const body = '<html><body>Internal Server Error</body></html>';
    expect(looksLikeAntibotChallenge(500, {}, body)).toBe(false);
  });

  it('does not fire on 403/503 without a challenge marker in the body', () => {
    expect(looksLikeAntibotChallenge(403, { server: 'cloudflare' }, 'Forbidden')).toBe(false);
    expect(looksLikeAntibotChallenge(503, {}, 'Service Unavailable')).toBe(false);
  });
});

describe('classifyResponse', () => {
  const URL = 'https://example.com/manga/1';

  it('returns null for a successful response', () => {
    expect(classifyResponse(SOURCE_ID.DESUME, 200, URL, {}, '')).toBeNull();
  });

  it('maps antibot challenges to SourceBlockedError, checked before 404/generic', () => {
    const err = classifyResponse(SOURCE_ID.DESUME, 403, URL, {}, 'Just a moment...');
    expect(err).toBeInstanceOf(SourceBlockedError);
    expect(err?.message).toBe(`Antibot challenge (HTTP 403) at ${URL}`);
  });

  it('maps 404 to NotFoundError, url included', () => {
    const err = classifyResponse(SOURCE_ID.DESUME, 404, URL, {}, 'Not Found');
    expect(err).toBeInstanceOf(NotFoundError);
    expect(err?.message).toBe(`Not found: ${URL}`);
  });

  it('maps other 4xx/5xx to SourceUnavailableError, url included', () => {
    const serverError = classifyResponse(SOURCE_ID.DESUME, 500, URL, {}, 'error');
    expect(serverError).toBeInstanceOf(SourceUnavailableError);
    expect(serverError?.message).toBe(`Upstream HTTP 500 at ${URL}`);
    expect(classifyResponse(SOURCE_ID.DESUME, 400, URL, {}, 'bad request')).toBeInstanceOf(
      SourceUnavailableError,
    );
  });
});
