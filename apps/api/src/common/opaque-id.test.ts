import { describe, expect, it } from 'vitest';
import { decodeChapterId, decodeTitleId, encodeChapterId, encodeTitleId } from './opaque-id';
import { NotFoundApiException } from './errors';

describe('opaque-id', () => {
  it('round-trips a title ref', () => {
    const ref = { id: 42, url: '/manga/solo-leveling.42' };
    expect(decodeTitleId(encodeTitleId(ref))).toEqual(ref);
  });

  it('round-trips a chapter ref, including a null branch', () => {
    const ref = { id: 7, url: '/manga/42/vol1/ch7/', branch: null };
    expect(decodeChapterId(encodeChapterId(ref))).toEqual(ref);

    const withBranch = { id: 8, url: '/manga/42/vol1/ch8/', branch: 'Team A' };
    expect(decodeChapterId(encodeChapterId(withBranch))).toEqual(withBranch);
  });

  it('throws NotFoundApiException on malformed input instead of a raw parse error', () => {
    expect(() => decodeTitleId('not-valid-base64url-json')).toThrow(NotFoundApiException);
    expect(() => decodeChapterId('%%%')).toThrow(NotFoundApiException);
  });
});
