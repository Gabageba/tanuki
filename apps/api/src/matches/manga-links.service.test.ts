import { describe, expect, it } from 'vitest';
import { MANGA_LINK_VERDICT } from '@tanuki/contracts';
import type { DatabaseService } from '../database/database.service';
import { MangaLinksService, orderPair, toMangaLink } from './manga-links.service';

const row = {
  aId: 'desume:aaa',
  bId: 'readmanga_ru:bbb',
  aTitle: 'Магическая битва',
  bTitle: 'Магическая битва (ReadManga)',
  verdict: MANGA_LINK_VERDICT.CONFIRMED,
};

describe('orderPair', () => {
  it('даёт одинаковый порядок независимо от того, с какой стороны пришла правка', () => {
    // Ровно это и делает связь симметричной: зеркальная запись невозможна, а уникальный
    // индекс по паре ловит повтор.
    expect(orderPair('desume:aaa', 'readmanga_ru:bbb')).toEqual(['desume:aaa', 'readmanga_ru:bbb']);
    expect(orderPair('readmanga_ru:bbb', 'desume:aaa')).toEqual(['desume:aaa', 'readmanga_ru:bbb']);
  });
});

describe('toMangaLink', () => {
  it('возвращает вторую сторону пары, с какой бы стороны ни спросили', () => {
    expect(toMangaLink(row, 'desume:aaa')).toEqual({
      targetId: 'readmanga_ru:bbb',
      targetTitle: 'Магическая битва (ReadManga)',
      verdict: MANGA_LINK_VERDICT.CONFIRMED,
    });

    expect(toMangaLink(row, 'readmanga_ru:bbb')).toEqual({
      targetId: 'desume:aaa',
      targetTitle: 'Магическая битва',
      verdict: MANGA_LINK_VERDICT.CONFIRMED,
    });
  });
});

describe('MangaLinksService при недоступной базе', () => {
  // withFallback — единственное место, где сервис решает судьбу отказа, поэтому подделываем
  // именно его: он всегда отдаёт запасное значение, как при мёртвом Postgres.
  const unavailable = {
    withFallback: <T>(_operation: () => Promise<T>, fallback: T) => Promise.resolve(fallback),
  } as unknown as DatabaseService;

  it('чтение отдаёт пустой список, а не роняет выдачу матчей', async () => {
    const service = new MangaLinksService(unavailable);
    await expect(service.listFor('desume:aaa')).resolves.toEqual([]);
  });

  it('запись сообщает об ошибке, а не теряет правку молча', async () => {
    const service = new MangaLinksService(unavailable);

    await expect(
      service.set('desume:aaa', 'A', 'readmanga_ru:bbb', 'B', MANGA_LINK_VERDICT.CONFIRMED),
    ).rejects.toThrow('Хранилище недоступно');
  });
});
