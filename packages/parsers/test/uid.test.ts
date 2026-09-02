import { describe, expect, it } from 'vitest';
import { SOURCE_ID } from '@tanuki/contracts';
import { generateUid } from '../src/core/uid';

describe('generateUid', () => {
  it('is deterministic across calls', () => {
    expect(generateUid(SOURCE_ID.DESUME, '/manga/123-solo-leveling')).toBe(
      generateUid(SOURCE_ID.DESUME, '/manga/123-solo-leveling'),
    );
  });

  it('is namespaced by source id', () => {
    expect(generateUid(SOURCE_ID.DESUME, '/manga/123')).not.toBe(
      generateUid(SOURCE_ID.MINTMANGA, '/manga/123'),
    );
  });

  it('is namespaced by key', () => {
    expect(generateUid(SOURCE_ID.DESUME, '/manga/123')).not.toBe(
      generateUid(SOURCE_ID.DESUME, '/manga/124'),
    );
  });

  it('accepts both string and numeric keys without colliding', () => {
    expect(generateUid(SOURCE_ID.DESUME, 123)).not.toBe(generateUid(SOURCE_ID.DESUME, '124'));
  });

  it('always returns a safe integer', () => {
    for (const key of ['/a', '/b', 42, 'ReadManga chapter 1', '']) {
      const id = generateUid(SOURCE_ID.READMANGA_RU, key);
      expect(Number.isSafeInteger(id)).toBe(true);
      expect(id).toBeGreaterThanOrEqual(0);
    }
  });

  it('has no collisions across a large synthetic key set', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 100_000; i += 1) {
      seen.add(generateUid(SOURCE_ID.DESUME, `/manga/${i}-title-${i * 7}`));
    }
    expect(seen.size).toBe(100_000);
  });
});
