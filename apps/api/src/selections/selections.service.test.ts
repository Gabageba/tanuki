import { describe, expect, it, vi } from 'vitest';
import { SEARCH_GROUP_STATUS, SOURCE_ACCESS, SOURCE_STATUS, type Source } from '@tanuki/contracts';
import { SourceAccountRequiredException } from '../common/errors';
import type { Env } from '../config/env';
import type { ParsersClientService } from '../parsers-client/parsers-client.service';
import type { SourcesService } from '../sources/sources.service';
import { SelectionsService } from './selections.service';

const ENV = { IMG_SIGN_SECRET: 'secret-secret-secret' } as Env;

const source = (patch: Partial<Source> = {}) =>
  ({
    id: 'remanga',
    access: SOURCE_ACCESS.AVAILABLE,
    status: SOURCE_STATUS.OK,
    homeSections: [{ id: 'hotNew', title: 'Горячие новинки' }],
    ...patch,
  }) as Source;

const rawTitle = {
  id: 1,
  title: 'Ван-Пис',
  altTitles: [],
  url: '/manga/one-piece',
  publicUrl: 'https://remanga.org/manga/one-piece',
  rating: 0.85,
  contentRating: null,
  coverUrl: 'https://remanga.org/cover.jpg',
  tags: [],
  releaseState: null,
  authors: [],
  largeCoverUrl: null,
  description: null,
  chapters: null,
  source: 'remanga',
};

const createService = (sources: Source[], getHome: ParsersClientService['getHome']) =>
  new SelectionsService(
    ENV,
    { listSources: () => Promise.resolve(sources) } as unknown as SourcesService,
    { getHome } as unknown as ParsersClientService,
  );

describe('SelectionsService', () => {
  it('отдаёт блоки источника с тайтлами в форме каталога', async () => {
    const getHome = vi.fn().mockResolvedValue({
      data: { sections: [{ id: 'hotNew', title: 'Горячие новинки', items: [rawTitle] }] },
      stale: false,
    });
    const response = await createService([source()], getHome).get('user', 'remanga');

    expect(response.status).toBe(SEARCH_GROUP_STATUS.OK);
    expect(response.sections[0]!.items[0]).toMatchObject({
      name: 'Ван-Пис',
      sourceId: 'remanga',
      rating: 8.5,
    });
    expect(response.sections[0]!.items[0]!.id).toMatch(/^remanga:/);
  });

  it('закрытый без аккаунта и нездоровый источник не опрашиваются', async () => {
    const getHome = vi.fn();
    const service = createService(
      [
        source({ id: 'locked', access: SOURCE_ACCESS.LOCKED }),
        source({ id: 'down', status: SOURCE_STATUS.DEGRADED }),
      ],
      getHome,
    );

    await expect(service.get('user', 'locked')).resolves.toMatchObject({
      status: SEARCH_GROUP_STATUS.LOCKED,
      sections: [],
    });
    await expect(service.get('user', 'down')).resolves.toMatchObject({
      status: SEARCH_GROUP_STATUS.UNAVAILABLE,
    });
    expect(getHome).not.toHaveBeenCalled();
  });

  it('ошибка источника — статус, а не ошибка запроса; протухший аккаунт — «нужен вход»', async () => {
    const failing = createService([source()], () => Promise.reject(new Error('boom')));
    await expect(failing.get('user', 'remanga')).resolves.toMatchObject({
      status: SEARCH_GROUP_STATUS.ERROR,
    });

    const relogin = createService([source()], () =>
      Promise.reject(new SourceAccountRequiredException('remanga', true)),
    );
    await expect(relogin.get('user', 'remanga')).resolves.toMatchObject({
      status: SEARCH_GROUP_STATUS.LOCKED,
    });
  });

  it('не дождались главной — «не успел ответить»', async () => {
    vi.useFakeTimers();
    try {
      const pending = createService([source()], () => new Promise(() => undefined)).get(
        'user',
        'remanga',
      );
      await vi.advanceTimersByTimeAsync(20_000);
      await expect(pending).resolves.toMatchObject({ status: SEARCH_GROUP_STATUS.TIMEOUT });
    } finally {
      vi.useRealTimers();
    }
  });

  it('источника без главной — пустые подборки без запроса, неизвестного — 404', async () => {
    const getHome = vi.fn();
    const service = createService([source({ homeSections: [] })], getHome);

    await expect(service.get('user', 'remanga')).resolves.toEqual({
      sourceId: 'remanga',
      status: SEARCH_GROUP_STATUS.OK,
      sections: [],
    });
    await expect(service.get('user', 'nope')).rejects.toThrow();
    expect(getHome).not.toHaveBeenCalled();
  });
});
