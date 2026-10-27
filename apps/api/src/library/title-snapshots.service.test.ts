import { describe, expect, it } from 'vitest';
import type { DatabaseService } from '../database/database.service';
import { titleChaptersSeen } from '../database/schema';
import type { RawChapter, RawTitle } from '../parsers-client/parsers-client.types';
import { TitleSnapshotsService } from './title-snapshots.service';

type SeenValue = { chapterId: string; branchId: string; baseline: boolean };

/**
 * База, в которой снимок тайтла уже есть (checkedAt) или его нет (null). missing — строку оставил
 * сбой «не найдено»; hasSeen — у тайтла уже есть увиденные главы.
 */
const createService = (
  checkedAt: Date | null,
  { missing = false, hasSeen = false }: { missing?: boolean; hasSeen?: boolean } = {},
) => {
  const seen: SeenValue[] = [];
  const db = {
    select: () => ({
      from: (table: unknown) => ({
        where: () => ({
          limit: () => {
            if (table === titleChaptersSeen) return Promise.resolve(hasSeen ? [{}] : []);
            return Promise.resolve(checkedAt ? [{ checkedAt, missing }] : []);
          },
        }),
      }),
    }),
    insert: (table: unknown) => ({
      values: (values: SeenValue | SeenValue[]) => {
        if (table === titleChaptersSeen) seen.push(...(values as SeenValue[]));
        return {
          onConflictDoUpdate: () => Promise.resolve(),
          onConflictDoNothing: () => Promise.resolve(),
        };
      },
    }),
  };
  return { service: new TitleSnapshotsService({ db } as unknown as DatabaseService), seen };
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

const title = (chapters: RawChapter[]) => ({ id: 1, url: '/title', chapters }) as RawTitle;

describe('TitleSnapshotsService.record', () => {
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

    await recent.service.record('remanga', '/title', title([chapter(1)]), { force: true });
    expect(recent.seen).toHaveLength(1);
  });
});
