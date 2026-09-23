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

  it('fires on a bare ddos-guard block page with no marker text in the body', () => {
    // Real-world case: ddos-guard's own "Client does not have access rights" 403 page never
    // mentions ddos-guard by name in the body, only in the Server header.
    const body =
      '<html><p><b>403 - Forbidden .</b> Client does not have access rights to the content.</html>';
    expect(looksLikeAntibotChallenge(403, { server: 'ddos-guard' }, body)).toBe(true);
  });

  it('does not fire on a dedicated antibot server header outside 403/503', () => {
    expect(looksLikeAntibotChallenge(500, { server: 'ddos-guard' }, 'Internal Server Error')).toBe(
      false,
    );
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

  it("appends the error page's own <title> to a generic 4xx/5xx message, when present", () => {
    // Real-world case: AllHentai's own maintenance page ("Профилактика на сайте") returns a
    // bare 503 with no antibot markers — the <title> is the only clue this is a real, self-
    // resolving outage rather than a parser bug worth investigating.
    const body =
      '<html><head><title>Профилактика</title></head><body><h1>Сервер обновляется.</h1></body></html>';
    const err = classifyResponse(SOURCE_ID.DESUME, 503, URL, {}, body);
    expect(err).toBeInstanceOf(SourceUnavailableError);
    expect(err?.message).toBe(`Upstream HTTP 503 at ${URL} (Профилактика)`);
  });

  it('omits the title suffix when the error page has none', () => {
    const err = classifyResponse(
      SOURCE_ID.DESUME,
      502,
      URL,
      {},
      '<html><body>Bad Gateway</body></html>',
    );
    expect(err?.message).toBe(`Upstream HTTP 502 at ${URL}`);
  });
});
