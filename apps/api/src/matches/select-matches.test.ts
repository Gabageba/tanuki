import { describe, expect, it } from 'vitest';
import { MATCH_CONFIDENCE } from '@tanuki/contracts';
import { MATCH_MAX_PER_SOURCE } from './models';
import { selectPerSource, type ScoredEntry } from './select-matches';

const entry = (overrides: Partial<ScoredEntry> = {}): ScoredEntry => ({
  sourceId: 'desume',
  key: '/manga/a',
  score: 0.9,
  confidence: MATCH_CONFIDENCE.HIGH,
  ...overrides,
});

describe('selectPerSource', () => {
  it('схлопывает повторы одного тайтла внутри источника', () => {
    const result = selectPerSource([
      entry({ key: '/manga/a', score: 0.9 }),
      entry({ key: '/manga/a', score: 0.7 }),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]?.score).toBe(0.9);
    expect(result[0]?.tied).toBe(false);
  });

  it('оставляет только лучшего, когда разрыв заметный', () => {
    const result = selectPerSource([
      entry({ key: '/manga/a', score: 0.9 }),
      entry({ key: '/manga/b', score: 0.7 }),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]?.key).toBe('/manga/a');
  });

  it('возвращает обоих, когда они неразличимы', () => {
    const result = selectPerSource([
      entry({ key: '/manga/a', score: 0.9 }),
      entry({ key: '/manga/b', score: 0.88 }),
    ]);

    expect(result).toHaveLength(2);
    expect(result.every((item) => item.tied)).toBe(true);
  });

  it('не отдаёт с одного источника больше положенного', () => {
    const result = selectPerSource([
      entry({ key: '/manga/a', score: 0.9 }),
      entry({ key: '/manga/b', score: 0.9 }),
      entry({ key: '/manga/c', score: 0.9 }),
    ]);

    expect(result).toHaveLength(MATCH_MAX_PER_SOURCE);
  });

  it('понижает уверенность обоим при нечёткой ничьей', () => {
    const result = selectPerSource([
      entry({ key: '/manga/a', score: 0.9, confidence: MATCH_CONFIDENCE.HIGH }),
      entry({ key: '/manga/b', score: 0.88, confidence: MATCH_CONFIDENCE.HIGH }),
    ]);

    expect(result.map((item) => item.confidence)).toEqual([
      MATCH_CONFIDENCE.LOW,
      MATCH_CONFIDENCE.LOW,
    ]);
  });

  it('не понижает точное совпадение из-за соседнего издания', () => {
    const result = selectPerSource([
      entry({ key: '/manga/a', score: 1, confidence: MATCH_CONFIDENCE.EXACT }),
      entry({ key: '/manga/a-colored', score: 0.95, confidence: MATCH_CONFIDENCE.HIGH }),
    ]);

    // Который из двух основной, мы как раз знаем — сомневаться не в чем.
    expect(result.map((item) => item.confidence)).toEqual([
      MATCH_CONFIDENCE.EXACT,
      MATCH_CONFIDENCE.HIGH,
    ]);
  });

  it('не понижает ничью двух точных совпадений', () => {
    // Это настоящие дубликаты на сайте, а не наша неуверенность.
    const result = selectPerSource([
      entry({ key: '/manga/a', score: 1, confidence: MATCH_CONFIDENCE.EXACT }),
      entry({ key: '/manga/b', score: 1, confidence: MATCH_CONFIDENCE.EXACT }),
    ]);

    expect(result.map((item) => item.confidence)).toEqual([
      MATCH_CONFIDENCE.EXACT,
      MATCH_CONFIDENCE.EXACT,
    ]);
  });

  it('держит источники независимо друг от друга', () => {
    const result = selectPerSource([
      entry({ sourceId: 'desume', key: '/a', score: 0.9 }),
      entry({ sourceId: 'remanga', key: '/b', score: 0.8 }),
    ]);

    expect(result).toHaveLength(2);
    expect(result.map((item) => item.sourceId)).toEqual(['desume', 'remanga']);
  });

  it('сортирует итог по убыванию скора', () => {
    const result = selectPerSource([
      entry({ sourceId: 'desume', key: '/a', score: 0.7 }),
      entry({ sourceId: 'remanga', key: '/b', score: 0.95 }),
    ]);

    expect(result.map((item) => item.score)).toEqual([0.95, 0.7]);
  });

  it('не падает на пустом входе', () => {
    expect(selectPerSource([])).toEqual([]);
  });
});

describe('selectPerSource — порядок', () => {
  it('ставит уверенность выше счёта', () => {
    // Метаданные могут добить счёт кандидату со спорным названием почти до единицы — он не
    // должен из-за этого обойти точное совпадение.
    const result = selectPerSource([
      entry({ sourceId: 'remanga', key: '/colored', score: 1, confidence: MATCH_CONFIDENCE.LOW }),
      entry({ sourceId: 'desume', key: '/main', score: 0.8, confidence: MATCH_CONFIDENCE.EXACT }),
    ]);

    expect(result.map((item) => item.sourceId)).toEqual(['desume', 'remanga']);
  });
});
