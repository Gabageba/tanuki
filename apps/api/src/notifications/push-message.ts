import {
  catalogEntryFor,
  getNotificationCategory,
  LANGUAGE,
  NOTIFICATION_CATEGORY,
  NOTIFICATION_TYPE,
  type Language,
} from '@tanuki/contracts';
import type { PushMessage, PushSource } from './models';
import { text } from './payload.util';

const sourceTitle = (sourceId: unknown): string => {
  try {
    return catalogEntryFor(text(sourceId)).title;
  } catch {
    return text(sourceId);
  }
};

/** Карточка источника на «Здоровье источников» (`getSourcesHealthPath` во фронте). */
const sourcesHealthUrl = (sourceId: unknown): string =>
  `/sources/health?source=${encodeURIComponent(text(sourceId))}`;

/** «3 новые главы» / «3 new chapters»: склонение по правилам языка. */
const formatNewChapters = (count: number, language: Language): string => {
  if (language === LANGUAGE.EN) return `${count} new chapter${count === 1 ? '' : 's'}`;
  const rest100 = count % 100;
  const rest10 = count % 10;
  if (rest10 === 1 && rest100 !== 11) return `${count} новая глава`;
  if (rest10 >= 2 && rest10 <= 4 && (rest100 < 12 || rest100 > 14)) return `${count} новые главы`;
  return `${count} новых глав`;
};

/**
 * Текст push формируется на сервере на языке пользователя: сервис-воркеру нечем переводить, а
 * приложение может быть закрыто. Лента и тост собираются на клиенте из `type` и `payload`.
 */
export const buildPushMessage = (source: PushSource, language: Language): PushMessage => {
  const isRu = language === LANGUAGE.RU;
  const category = getNotificationCategory(source.type);
  const base = { tag: source.groupKey, category };
  const { payload } = source;

  switch (source.type) {
    case NOTIFICATION_TYPE.NEW_CHAPTERS:
      return {
        ...base,
        title: text(payload['name']),
        body: formatNewChapters(source.count, language),
        url: `/title/${encodeURIComponent(text(payload['titleId']))}`,
      };
    case NOTIFICATION_TYPE.EMAIL_CHANGED:
      return {
        ...base,
        title: isRu ? 'Почта изменена' : 'Email changed',
        body: isRu
          ? 'Адрес почты вашего аккаунта был изменён'
          : 'The email address of your account was changed',
        url: '/profile?tab=signInAndSecurity',
      };
    case NOTIFICATION_TYPE.DELETION_REQUESTED:
      return {
        ...base,
        title: isRu ? 'Удаление аккаунта запланировано' : 'Account deletion scheduled',
        body: isRu
          ? 'Аккаунт будет удалён, если вы не отмените удаление'
          : 'The account will be deleted unless you cancel',
        url: '/profile?tab=signInAndSecurity',
      };
    case NOTIFICATION_TYPE.NEW_DEVICE_LOGIN:
      return {
        ...base,
        title: isRu ? 'Вход с нового устройства' : 'Sign-in from a new device',
        body: text(payload['device']),
        url: '/profile?tab=signInAndSecurity',
      };
    case NOTIFICATION_TYPE.SOURCE_DOWN:
      return {
        ...base,
        title: sourceTitle(payload['sourceId']),
        body: isRu ? 'Источник не отвечает' : 'The source is not responding',
        url: sourcesHealthUrl(payload['sourceId']),
      };
    case NOTIFICATION_TYPE.SOURCE_RECOVERED:
      return {
        ...base,
        title: sourceTitle(payload['sourceId']),
        body: isRu ? 'Источник снова работает' : 'The source is working again',
        url: sourcesHealthUrl(payload['sourceId']),
      };
    case NOTIFICATION_TYPE.PARSER_DOWN:
      return {
        ...base,
        title: sourceTitle(payload['sourceId']),
        body: isRu ? 'Парсер перестал работать' : 'The parser is down',
        url: sourcesHealthUrl(payload['sourceId']),
      };
    case NOTIFICATION_TYPE.PARSER_RECOVERED:
      return {
        ...base,
        title: sourceTitle(payload['sourceId']),
        body: isRu ? 'Парсер снова работает' : 'The parser is working again',
        url: sourcesHealthUrl(payload['sourceId']),
      };
    case NOTIFICATION_TYPE.INVITE_USED:
      return {
        ...base,
        title: isRu ? 'Приглашение использовано' : 'Invite used',
        body: isRu
          ? `${text(payload['username'])} зарегистрировался по приглашению`
          : `${text(payload['username'])} signed up with your invite`,
        url: '/management?tab=invites',
      };
    case NOTIFICATION_TYPE.INVITE_EXPIRED:
      return {
        ...base,
        title: isRu ? 'Приглашение истекло' : 'Invite expired',
        body: isRu ? 'Приглашением никто не воспользовался' : 'Nobody used the invite',
        url: '/management?tab=invites',
      };
  }
};

/** Сводный push: слишком много новых глав за один проход крона. */
export const buildNewChaptersDigest = (titlesCount: number, language: Language): PushMessage => {
  const isRu = language === LANGUAGE.RU;
  return {
    title: isRu ? 'Новые главы' : 'New chapters',
    body: isRu ? `Новые главы в ${titlesCount} тайтлах` : `New chapters in ${titlesCount} titles`,
    tag: 'chapters:digest',
    category: NOTIFICATION_CATEGORY.CHAPTERS,
    url: '/bookmarks',
  };
};
