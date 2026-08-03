import { describe, expect, it } from 'vitest';
import { generateUid } from '../src/core/uid';

describe('generateUid', () => {
  it('is deterministic across calls', () => {
    expect(generateUid('DESUME', '/manga/123-solo-leveling')).toBe(
      generateUid('DESUME', '/manga/123-solo-leveling'),
    );
  });

  it('is namespaced by source id', () => {
    expect(generateUid('DESUME', '/manga/123')).not.toBe(generateUid('MINTMANGA', '/manga/123'));
  });

  it('is namespaced by key', () => {
    expect(generateUid('DESUME', '/manga/123')).not.toBe(generateUid('DESUME', '/manga/124'));
  });

  it('accepts both string and numeric keys without colliding', () => {
    expect(generateUid('DESUME', 123)).not.toBe(generateUid('DESUME', '124'));
  });

  it('always returns a safe integer', () => {
    for (const key of ['/a', '/b', 42, 'ReadManga chapter 1', '']) {
      const id = generateUid('READMANGA_RU', key);
      expect(Number.isSafeInteger(id)).toBe(true);
      expect(id).toBeGreaterThanOrEqual(0);
    }
  });

  it('has no collisions across a large synthetic key set', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 100_000; i += 1) {
      seen.add(generateUid('DESUME', `/manga/${i}-title-${i * 7}`));
    }
    expect(seen.size).toBe(100_000);
  });
});
