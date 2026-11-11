import { describe, expect, it } from 'vitest';
import type { DatabaseService } from '../database/database.service';
import { titleChaptersSeen } from '../database/schema';
import type { RawChapter, RawTitle } from '../parsers-client/parsers-client.types';
import { TitleSnapshotsService } from './title-snapshots.service';

type SeenValue = { chapterId: string; branchId: string; baseline: boolean };
type SnapshotValue = { chaptersCount?: number | null };

/**
 * База, в которой снимок тайтла уже есть (checkedAt) или его нет (null). missing — строку оставил
 * сбой «не найдено»; hasSeen — у тайтла уже есть увиденные главы.
 */
const createService = (
  checkedAt: Date | null,
  { missing = false, hasSeen = false }: { missing?: boolean; hasSeen?: boolean } = {},
) => {
  const seen: SeenValue[] = [];
  const snapshots: SnapshotValue[] = [];
  const db = {
    transaction: async <T>(run: (tx: unknown) => Promise<T>): Promise<T> => run(db),
    execute: async () => [],
    delete: () => ({ where: async () => {} }),
    update: () => ({
      set: (value: SnapshotValue) => ({
        where: async () => {
          snapshots.push(value);
        },
      }),
    }),
    select: () => ({
      from: (table: unknown) => ({
        where: () => ({
          limit: () => {
            if (table === titleChaptersSeen) return Promise.resolve(hasSeen ? [{}] : []);
            return Promise.resolve(
              checkedAt ? [{ checkedAt, missing, chaptersInitialized: !missing || hasSeen }] : [],
            );
          },
        }),
      }),
    }),
    insert: (table: unknown) => ({
      values: (values: SeenValue[] | SnapshotValue) => {
        if (table === titleChaptersSeen) seen.push(...(values as SeenValue[]));

        return {
          onConflictDoUpdate: () => Promise.resolve(),
          onConflictDoNothing: () => Promise.resolve(),
        };
      },
    }),
  };
  return {
    service: new TitleSnapshotsService({ db } as unknown as DatabaseService),
    seen,
    snapshots,
  };
};

const chapter = (id: number, overrides: Partial<RawChapter> = {}) =>
  ({
    id,
    url: `/c/${id}`,
    number: id,
    volume: null,
    title: null,
    branch: null,
    uploadDate: 0,
    ...overrides,
  }) as RawChapter;

const title = (chapters: RawChapter[]) =>
  ({
    id: 1,
    url: '/title',
    title: 'Тайтл',
    coverUrl: null,
    contentRating: null,
    chapters,
  }) as RawTitle;

describe('TitleSnapshotsService.record', () => {
  it('запоминает число глав самой длинной ветки, а ответ без глав его не трогает', async () => {
    const { service, snapshots } = createService(null);

    await service.record(
      'remanga',
      '/title',
      title([chapter(1), chapter(2), chapter(3, { branch: 'Команда' })]),
    );
    await service.record('remanga', '/title', title([]));
    await service.record('remanga', '/title', { id: 1, url: '/title' } as RawTitle);

    expect(snapshots.map(({ chaptersCount }) => chaptersCount)).toEqual([2, 0]);
  });

  it('у тайтла с платными главами число неизвестно — список зависит от зрителя', async () => {
    const { service, snapshots } = createService(null);

    await service.record('mangalib', '/title', { ...title([chapter(1)]), hasPaidChapters: true });

    expect(snapshots[0]?.chaptersCount).toBeNull();
  });

  it('первый снимок тайтла — базовый: его главы новыми не станут', async () => {
    const { service, seen } = createService(null);

    await service.record('remanga', '/title', title([chapter(1), chapter(2)]));

    expect(seen).toHaveLength(2);
    expect(seen.every(({ baseline }) => baseline)).toBe(true);
  });

  it('следующие снимки пишут главы небазовыми', async () => {
    const { service, seen } = createService(new Date(0));

    await service.record('remanga', '/title', title([chapter(3)]));

    expect(seen.map(({ baseline }) => baseline)).toEqual([false]);
  });

  it('снимок после сбоя «не найдено» без увиденных глав — всё ещё базовый', async () => {
    const { service, seen } = createService(new Date(0), { missing: true });

    await service.record('remanga', '/title', title([chapter(1)]));

    expect(seen.map(({ baseline }) => baseline)).toEqual([true]);
  });

  it('тайтл, который пропадал, но главы уже видел, пишет новые главы небазовыми', async () => {
    const { service, seen } = createService(new Date(0), { missing: true, hasSeen: true });

    await service.record('remanga', '/title', title([chapter(4)]));

    expect(seen.map(({ baseline }) => baseline)).toEqual([false]);
  });

  it('пишет ветку как в reading_progress и пропускает платные главы', async () => {
    const { service, seen } = createService(new Date(0));

    await service.record(
      'remanga',
      '/title',
      title([chapter(1, { branch: 'Команда' }), chapter(2, { isPaid: true })]),
    );

    expect(seen.map(({ branchId }) => branchId)).toEqual(['Команда']);
    expect(seen[0]?.chapterId.startsWith('remanga:')).toBe(true);
  });

  it('свежий снимок страница тайтла не переписывает, а крон и визит — переписывают', async () => {
    const recent = createService(new Date());
    await recent.service.record('remanga', '/title', title([chapter(1)]));
    expect(recent.seen).toHaveLength(0);

    await recent.service.record('remanga', '/title', title([chapter(1)]), {
      force: true,
      fetchedAt: Date.now() + 1,
    });
    expect(recent.seen).toHaveLength(1);
  });
});
