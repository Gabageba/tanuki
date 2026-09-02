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
  it('returns null for a successful response', () => {
    expect(classifyResponse(SOURCE_ID.DESUME, 200, {}, '')).toBeNull();
  });

  it('maps antibot challenges to SourceBlockedError, checked before 404/generic', () => {
    const err = classifyResponse(SOURCE_ID.DESUME, 403, {}, 'Just a moment...');
    expect(err).toBeInstanceOf(SourceBlockedError);
  });

  it('maps 404 to NotFoundError', () => {
    expect(classifyResponse(SOURCE_ID.DESUME, 404, {}, 'Not Found')).toBeInstanceOf(NotFoundError);
  });

  it('maps other 4xx/5xx to SourceUnavailableError', () => {
    expect(classifyResponse(SOURCE_ID.DESUME, 500, {}, 'error')).toBeInstanceOf(
      SourceUnavailableError,
    );
    expect(classifyResponse(SOURCE_ID.DESUME, 400, {}, 'bad request')).toBeInstanceOf(
      SourceUnavailableError,
    );
  });
});
