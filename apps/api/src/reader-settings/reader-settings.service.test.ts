import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_READER_SETTINGS,
  READER_DIRECTION,
  READER_PAGE_LAYOUT,
  ReaderSettingsSchema,
  UpdateReaderSettingsRequestSchema,
  type ReaderSettings,
} from '@tanuki/contracts';
import { StorageUnavailableException } from '../common/errors';
import type { DatabaseService } from '../database/database.service';
import { ReaderSettingsService } from './reader-settings.service';

const SETTINGS: ReaderSettings = {
  ...DEFAULT_READER_SETTINGS,
  direction: READER_DIRECTION.RTL,
  pageLayout: READER_PAGE_LAYOUT.SPREAD,
  brightness: 60,
  prefetchPages: 0,
  keepScreenOn: true,
};

const createService = (row?: ReaderSettings, available = true) => {
  const write = vi.fn(async () => undefined);
  const values = vi.fn(() => ({ onConflictDoUpdate: write }));
  const database = {
    db: {
      select: () => ({
        from: () => ({
          where: () => ({ limit: async () => (row ? [{ userId: 'user', ...row }] : []) }),
        }),
      }),
      insert: () => ({ values }),
    },
    withFallback: async <T>(run: () => Promise<T>, fallback: T) => (available ? run() : fallback),
  } as unknown as DatabaseService;
  return { service: new ReaderSettingsService(database), values, write };
};

describe('ReaderSettingsService', () => {
  it('возвращает все новые поля без изменения литералов и служебных колонок', async () => {
    expect(await createService(SETTINGS).service.get('user')).toEqual(SETTINGS);
  });
  it('для нового пользователя и при недоступной базе возвращает безопасные умолчания', async () => {
    expect(await createService().service.get('user')).toEqual(DEFAULT_READER_SETTINGS);
    expect(await createService(SETTINGS, false).service.get('user')).toEqual(
      DEFAULT_READER_SETTINGS,
    );
  });
  it('сохраняет новые настройки, включая нулевую предзагрузку', async () => {
    const { service, values, write } = createService();
    expect(await service.update('user', SETTINGS)).toEqual(SETTINGS);
    expect(values).toHaveBeenCalledWith({ userId: 'user', ...SETTINGS });
    expect(write).toHaveBeenCalledWith(
      expect.objectContaining({ set: expect.objectContaining(SETTINGS) }),
    );
  });
  it('не выдаёт несохранённые настройки за сохранённые', async () => {
    await expect(
      createService(undefined, false).service.update('user', SETTINGS),
    ).rejects.toBeInstanceOf(StorageUnavailableException);
  });
});

describe('ReaderSettingsSchema', () => {
  it('игнорирует устаревший фон в офлайн-ответе и запросе настроек', () => {
    const legacy = { ...SETTINGS, background: 'paper' };
    expect(ReaderSettingsSchema.parse(legacy)).toEqual(SETTINGS);
    expect(UpdateReaderSettingsRequestSchema.parse(legacy)).toEqual(SETTINGS);
  });
  it.each([20, 100])('принимает граничную яркость %i', (brightness) => {
    expect(UpdateReaderSettingsRequestSchema.parse({ ...SETTINGS, brightness }).brightness).toBe(
      brightness,
    );
  });
  it.each([0, 10])('принимает граничную предзагрузку %i', (prefetchPages) => {
    expect(
      UpdateReaderSettingsRequestSchema.parse({ ...SETTINGS, prefetchPages }).prefetchPages,
    ).toBe(prefetchPages);
  });
  it.each([
    { brightness: 19 },
    { brightness: 101 },
    { brightness: 50.5 },
    { prefetchPages: -1 },
    { prefetchPages: 11 },
    { prefetchPages: 1.5 },
    { direction: 'RTL' },
    { pageLayout: 'two' },
    { keepScreenOn: 'true' },
    { brightness: null },
    { pageGap: -1 },
  ])('отклоняет недопустимые значения %j', (patch) => {
    expect(ReaderSettingsSchema.safeParse({ ...SETTINGS, ...patch }).success).toBe(false);
  });
});
