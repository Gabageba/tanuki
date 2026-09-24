import { describe, expect, it } from 'vitest';
import { TITLE_LINK_VERDICT } from '@tanuki/contracts';
import type { DatabaseService } from '../database/database.service';
import { TitleLinksService, excludeRejected, orderPair, toTitleLink } from './title-links.service';

const row = {
  aId: 'desume:aaa',
  bId: 'readmanga_ru:bbb',
  aName: 'Магическая битва',
  bName: 'Магическая битва (ReadManga)',
  verdict: TITLE_LINK_VERDICT.CONFIRMED,
};

describe('orderPair', () => {
  it('даёт одинаковый порядок независимо от того, с какой стороны пришла правка', () => {
    // Ровно это и делает связь симметричной: зеркальная запись невозможна, а уникальный
    // индекс по паре ловит повтор.
    expect(orderPair('desume:aaa', 'readmanga_ru:bbb')).toEqual(['desume:aaa', 'readmanga_ru:bbb']);
    expect(orderPair('readmanga_ru:bbb', 'desume:aaa')).toEqual(['desume:aaa', 'readmanga_ru:bbb']);
  });
});

describe('toTitleLink', () => {
  it('возвращает вторую сторону пары, с какой бы стороны ни спросили', () => {
    expect(toTitleLink(row, 'desume:aaa')).toEqual({
      targetId: 'readmanga_ru:bbb',
      targetName: 'Магическая битва (ReadManga)',
      verdict: TITLE_LINK_VERDICT.CONFIRMED,
    });

    expect(toTitleLink(row, 'readmanga_ru:bbb')).toEqual({
      targetId: 'desume:aaa',
      targetName: 'Магическая битва',
      verdict: TITLE_LINK_VERDICT.CONFIRMED,
    });
  });
});

describe('excludeRejected', () => {
  // Группа 1 собрана цепочкой 1↔2↔3; ключ самого 1 в неё не входит.
  const group = ['source_b:2', 'source_c:3'];

  it('без прямых отказов оставляет всю цепочку', () => {
    const links = [
      { targetId: 'source_b:2', targetName: 'B', verdict: TITLE_LINK_VERDICT.CONFIRMED },
    ];
    expect(excludeRejected(group, links)).toEqual(['source_b:2', 'source_c:3']);
  });

  it('прямой отказ 1↔3 сильнее цепочки 1↔2↔3', () => {
    const links = [
      { targetId: 'source_b:2', targetName: 'B', verdict: TITLE_LINK_VERDICT.CONFIRMED },
      { targetId: 'source_c:3', targetName: 'C', verdict: TITLE_LINK_VERDICT.REJECTED },
    ];
    expect(excludeRejected(group, links)).toEqual(['source_b:2']);
  });
});

describe('TitleLinksService при недоступной базе', () => {
  // withFallback — единственное место, где сервис решает судьбу отказа, поэтому подделываем
  // именно его: он всегда отдаёт запасное значение, как при мёртвом Postgres.
  const unavailable = {
    withFallback: <T>(_operation: () => Promise<T>, fallback: T) => Promise.resolve(fallback),
  } as unknown as DatabaseService;

  it('чтение отдаёт пустой список, а не роняет выдачу матчей', async () => {
    const service = new TitleLinksService(unavailable);
    await expect(service.listFor('desume:aaa')).resolves.toEqual([]);
  });

  it('группа подтверждений пустая, а не роняет выдачу матчей и прогресс', async () => {
    const service = new TitleLinksService(unavailable);
    await expect(service.listGroup('desume:aaa')).resolves.toEqual([]);
    await expect(service.listConfirmedGroup('desume:aaa')).resolves.toEqual([]);
  });

  it('запись сообщает об ошибке, а не теряет правку молча', async () => {
    const service = new TitleLinksService(unavailable);

    await expect(
      service.set('desume:aaa', 'A', 'readmanga_ru:bbb', 'B', TITLE_LINK_VERDICT.CONFIRMED),
    ).rejects.toThrow('Хранилище недоступно');
  });
});
