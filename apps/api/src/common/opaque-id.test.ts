import { describe, expect, it } from 'vitest';
import { decodeChapterId, decodeMangaId, encodeChapterId, encodeMangaId } from './opaque-id';
import { NotFoundApiException } from './errors';

describe('opaque-id', () => {
  it('round-trips a manga ref', () => {
    const ref = { id: 42, url: '/manga/solo-leveling.42' };
    expect(decodeMangaId(encodeMangaId(ref))).toEqual(ref);
  });

  it('round-trips a chapter ref, including a null branch', () => {
    const ref = { id: 7, url: '/manga/42/vol1/ch7/', branch: null };
    expect(decodeChapterId(encodeChapterId(ref))).toEqual(ref);

    const withBranch = { id: 8, url: '/manga/42/vol1/ch8/', branch: 'Team A' };
    expect(decodeChapterId(encodeChapterId(withBranch))).toEqual(withBranch);
  });

  it('throws NotFoundApiException on malformed input instead of a raw parse error', () => {
    expect(() => decodeMangaId('not-valid-base64url-json')).toThrow(NotFoundApiException);
    expect(() => decodeChapterId('%%%')).toThrow(NotFoundApiException);
  });
});
