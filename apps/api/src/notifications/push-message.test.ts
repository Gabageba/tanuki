import { describe, expect, it } from 'vitest';
import {
  LANGUAGE,
  NOTIFICATION_CATEGORY,
  NOTIFICATION_TYPE,
  type NotificationType,
} from '@tanuki/contracts';
import { buildNewChaptersDigest, buildPushMessage } from './push-message';

const newChapters = (count: number) => ({
  type: NOTIFICATION_TYPE.NEW_CHAPTERS,
  groupKey: 'chapters:a:/one',
  payload: { name: 'Берсерк', titleId: 'a:abc' },
  count,
});

describe('buildPushMessage', () => {
  it('склоняет число новых глав по-русски', () => {
    const body = (count: number) => buildPushMessage(newChapters(count), LANGUAGE.RU).body;

    expect(body(1)).toBe('1 новая глава');
    expect(body(3)).toBe('3 новые главы');
    expect(body(5)).toBe('5 новых глав');
    expect(body(11)).toBe('11 новых глав');
    expect(body(21)).toBe('21 новая глава');
  });

  it('склоняет число новых глав по-английски', () => {
    expect(buildPushMessage(newChapters(1), LANGUAGE.EN).body).toBe('1 new chapter');
    expect(buildPushMessage(newChapters(2), LANGUAGE.EN).body).toBe('2 new chapters');
  });

  it('новые главы ведут на страницу тайтла и называются по тайтлу', () => {
    const message = buildPushMessage(newChapters(2), LANGUAGE.RU);

    expect(message.title).toBe('Берсерк');
    expect(message.url).toBe('/title/a%3Aabc');
    expect(message.category).toBe(NOTIFICATION_CATEGORY.CHAPTERS);
  });

  it('каждый тип получает текст на обоих языках', () => {
    for (const type of Object.values(NOTIFICATION_TYPE) as NotificationType[]) {
      for (const language of Object.values(LANGUAGE)) {
        const message = buildPushMessage(
          {
            type,
            groupKey: 'key',
            payload: { sourceId: 'readmanga_ru', username: 'neo', device: 'Chrome · macOS' },
            count: 1,
          },
          language,
        );
        expect(message.body.length).toBeGreaterThan(0);
        expect(message.url.startsWith('/')).toBe(true);
      }
    }
  });
});

describe('buildNewChaptersDigest', () => {
  it('называет число тайтлов', () => {
    expect(buildNewChaptersDigest(7, LANGUAGE.RU).body).toBe('Новые главы в 7 тайтлах');
    expect(buildNewChaptersDigest(7, LANGUAGE.EN).body).toBe('New chapters in 7 titles');
  });
});
