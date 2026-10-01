import { describe, expect, it } from 'vitest';
import { API_ERROR_CODE, CONTENT_RATING } from '@tanuki/contracts';
import type { DatabaseService } from '../database/database.service';
import { VIEWER_KIND, type Viewer } from '../source-accounts/models';
import { runAsViewer } from '../source-accounts/viewer-context';
import { AdultContentService } from './adult-content.service';

const REGULAR_SOURCE = 'senkuro';
const ADULT_SOURCE = 'senkognito';

type StoredSettings = { showAdultSources: boolean | null; hideAdultTitles: boolean | null };

/** База с одной строкой user_settings — ровно то, что читает сервис. */
const makeService = (stored?: StoredSettings) => {
  const query = {
    select: () => query,
    from: () => query,
    where: () => query,
    limit: async () => (stored ? [stored] : []),
  };
  const database = {
    db: query,
    withFallback: <T>(operation: () => Promise<T>) => operation(),
  } as unknown as DatabaseService;
  return new AdultContentService(database);
};

const USER: Viewer = { kind: VIEWER_KIND.USER, userId: 'user' };
const GUEST: Viewer = { kind: VIEWER_KIND.GUEST };

const rejectionCode = async (check: Promise<void>) => {
  try {
    await check;
    return null;
  } catch (error) {
    return (error as { code?: string }).code;
  }
};

describe('AdultContentService.assertTitleVisible', () => {
  it('закрывает тайтл 18+ обычного источника, пока тайтлы 18+ скрыты', async () => {
    const service = makeService({ showAdultSources: true, hideAdultTitles: true });

    const code = await runAsViewer(USER, () =>
      rejectionCode(service.assertTitleVisible(REGULAR_SOURCE, CONTENT_RATING.ADULT)),
    );

    expect(code).toBe(API_ERROR_CODE.ADULT_CONTENT_HIDDEN);
  });

  it('открывает тайтл 18+ обычного источника, когда тайтлы 18+ показаны, — источники 18+ при этом ни при чём', async () => {
    const service = makeService({ showAdultSources: false, hideAdultTitles: false });

    const code = await runAsViewer(USER, () =>
      rejectionCode(service.assertTitleVisible(REGULAR_SOURCE, CONTENT_RATING.ADULT)),
    );

    expect(code).toBeNull();
  });

  it('не трогает обычные тайтлы, тайтлы без рейтинга и тайтлы источника 18+', async () => {
    const service = makeService({ showAdultSources: true, hideAdultTitles: true });

    const codes = await runAsViewer(USER, () =>
      Promise.all([
        rejectionCode(service.assertTitleVisible(REGULAR_SOURCE, CONTENT_RATING.SAFE)),
        rejectionCode(service.assertTitleVisible(REGULAR_SOURCE, null)),
        rejectionCode(service.assertTitleVisible(ADULT_SOURCE, CONTENT_RATING.ADULT)),
      ]),
    );

    expect(codes).toEqual([null, null, null]);
  });

  it('гостю и пользователю без сохранённых настроек тайтлы 18+ закрыты', async () => {
    const service = makeService();

    const codes = await Promise.all([
      runAsViewer(GUEST, () =>
        rejectionCode(service.assertTitleVisible(REGULAR_SOURCE, CONTENT_RATING.ADULT)),
      ),
      runAsViewer(USER, () =>
        rejectionCode(service.assertTitleVisible(REGULAR_SOURCE, CONTENT_RATING.ADULT)),
      ),
    ]);

    expect(codes).toEqual([
      API_ERROR_CODE.ADULT_CONTENT_HIDDEN,
      API_ERROR_CODE.ADULT_CONTENT_HIDDEN,
    ]);
  });
});

describe('AdultContentService.assertSourceVisible', () => {
  it('закрывает источник 18+ по умолчанию и открывает после включения', async () => {
    const hidden = makeService();
    const shown = makeService({ showAdultSources: true, hideAdultTitles: true });

    const codes = await runAsViewer(USER, () =>
      Promise.all([
        rejectionCode(hidden.assertSourceVisible(ADULT_SOURCE)),
        rejectionCode(hidden.assertSourceVisible(REGULAR_SOURCE)),
        rejectionCode(shown.assertSourceVisible(ADULT_SOURCE)),
      ]),
    );

    expect(codes).toEqual([API_ERROR_CODE.ADULT_CONTENT_HIDDEN, null, null]);
  });

  it('сервисной учётке открыто всё: веер совпадений общий на всех', async () => {
    const service = makeService();

    const codes = await Promise.all([
      rejectionCode(service.assertSourceVisible(ADULT_SOURCE)),
      rejectionCode(service.assertTitleVisible(REGULAR_SOURCE, CONTENT_RATING.ADULT)),
    ]);

    expect(codes).toEqual([null, null]);
  });
});
