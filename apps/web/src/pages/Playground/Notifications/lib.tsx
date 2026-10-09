import type { ReactNode } from 'react';
import { CheckIcon, ChecksIcon, XIcon } from '@phosphor-icons/react';
import {
  BookOpenTextIcon,
  CalendarXIcon,
  CheckCircleIcon,
  DevicesIcon,
  EnvelopeSimpleIcon,
  PlugsIcon,
  ShieldCheckIcon,
  TrashIcon,
  UserCircleIcon,
  UserPlusIcon,
  WarningCircleIcon,
  WrenchIcon,
} from '@phosphor-icons/react';
import {
  PRIMARY_COLOR,
  STATUS_DEGRADED_COLOR,
  STATUS_DOWN_COLOR,
  STATUS_OK_COLOR,
} from '@/shared/lib/palette';
import {
  DEVICE_STATE,
  DISMISS,
  MOCK_CATEGORY,
  MOCK_ROLE,
  MOCK_TONE,
  MOCK_TYPE,
  type DeviceState,
  type Dismiss,
  type MockCategory,
  type MockNotification,
  type MockRole,
  type MockTone,
  type MockType,
} from './models';

export const getMockCoverUrl = (seed: string) => `https://picsum.photos/seed/${seed}/120/160`;

export const getTypeCategory = (type: MockType): MockCategory => {
  switch (type) {
    case MOCK_TYPE.NEW_CHAPTERS:
      return MOCK_CATEGORY.CHAPTERS;
    case MOCK_TYPE.EMAIL_CHANGED:
    case MOCK_TYPE.DELETION_REQUESTED:
    case MOCK_TYPE.NEW_DEVICE_LOGIN:
      return MOCK_CATEGORY.ACCOUNT;
    case MOCK_TYPE.SOURCE_DOWN:
    case MOCK_TYPE.SOURCE_RECOVERED:
      return MOCK_CATEGORY.SOURCES;
    case MOCK_TYPE.PARSER_DOWN:
    case MOCK_TYPE.PARSER_RECOVERED:
    case MOCK_TYPE.INVITE_USED:
    case MOCK_TYPE.INVITE_EXPIRED:
      return MOCK_CATEGORY.ADMINISTRATION;
  }
};

export const getCategoryLabel = (category: MockCategory) => {
  switch (category) {
    case MOCK_CATEGORY.CHAPTERS:
      return 'Новые главы';
    case MOCK_CATEGORY.ACCOUNT:
      return 'Аккаунт';
    case MOCK_CATEGORY.SOURCES:
      return 'Источники';
    case MOCK_CATEGORY.ADMINISTRATION:
      return 'Администрирование';
  }
};

export const getCategoryDescription = (category: MockCategory, role: MockRole) => {
  switch (category) {
    case MOCK_CATEGORY.CHAPTERS:
      return 'Новые главы в тайтлах из папок со слежением';
    case MOCK_CATEGORY.ACCOUNT:
      return 'Вход с нового устройства, смена почты, удаление аккаунта';
    case MOCK_CATEGORY.SOURCES:
      return 'Источник из закладок недоступен или снова работает';
    case MOCK_CATEGORY.ADMINISTRATION:
      return role === MOCK_ROLE.ADMIN
        ? 'Источники и парсеры, регистрации по инвайтам, истёкшие инвайты'
        : 'Источники и парсеры: упали или восстановились';
  }
};

export const getCategoryIcon = (category: MockCategory, size = 20): ReactNode => {
  switch (category) {
    case MOCK_CATEGORY.CHAPTERS:
      return <BookOpenTextIcon size={size} />;
    case MOCK_CATEGORY.ACCOUNT:
      return <UserCircleIcon size={size} />;
    case MOCK_CATEGORY.SOURCES:
      return <PlugsIcon size={size} />;
    case MOCK_CATEGORY.ADMINISTRATION:
      return <ShieldCheckIcon size={size} />;
  }
};

/** Категории, которые человек видит в ленте и в настройках: администрирование — только
 *  админам и модераторам. */
export const getVisibleCategories = (role: MockRole): MockCategory[] => {
  switch (role) {
    case MOCK_ROLE.USER:
      return [MOCK_CATEGORY.CHAPTERS, MOCK_CATEGORY.ACCOUNT, MOCK_CATEGORY.SOURCES];
    case MOCK_ROLE.MODERATOR:
    case MOCK_ROLE.ADMIN:
      return [
        MOCK_CATEGORY.CHAPTERS,
        MOCK_CATEGORY.ACCOUNT,
        MOCK_CATEGORY.SOURCES,
        MOCK_CATEGORY.ADMINISTRATION,
      ];
  }
};

export const getRoleLabel = (role: MockRole) => {
  switch (role) {
    case MOCK_ROLE.USER:
      return 'Пользователь';
    case MOCK_ROLE.MODERATOR:
      return 'Модератор';
    case MOCK_ROLE.ADMIN:
      return 'Админ';
  }
};

export const getTypeTone = (type: MockType): MockTone => {
  switch (type) {
    case MOCK_TYPE.NEW_CHAPTERS:
      return MOCK_TONE.ACCENT;
    case MOCK_TYPE.EMAIL_CHANGED:
    case MOCK_TYPE.DELETION_REQUESTED:
    case MOCK_TYPE.NEW_DEVICE_LOGIN:
      return MOCK_TONE.DANGER;
    case MOCK_TYPE.SOURCE_DOWN:
    case MOCK_TYPE.PARSER_DOWN:
      return MOCK_TONE.WARNING;
    case MOCK_TYPE.SOURCE_RECOVERED:
    case MOCK_TYPE.PARSER_RECOVERED:
      return MOCK_TONE.SUCCESS;
    case MOCK_TYPE.INVITE_USED:
    case MOCK_TYPE.INVITE_EXPIRED:
      return MOCK_TONE.NEUTRAL;
  }
};

export const getToneColor = (tone: MockTone) => {
  switch (tone) {
    case MOCK_TONE.ACCENT:
      return PRIMARY_COLOR;
    case MOCK_TONE.DANGER:
      return STATUS_DOWN_COLOR;
    case MOCK_TONE.WARNING:
      return STATUS_DEGRADED_COLOR;
    case MOCK_TONE.SUCCESS:
      return STATUS_OK_COLOR;
    case MOCK_TONE.NEUTRAL:
      return 'gray';
  }
};

/** Как долго держится тост (мс): чем важнее событие, тем дольше. */
export const getToneToastDuration = (tone: MockTone) => {
  switch (tone) {
    case MOCK_TONE.DANGER:
      return 10_000;
    case MOCK_TONE.WARNING:
      return 8_000;
    case MOCK_TONE.ACCENT:
    case MOCK_TONE.SUCCESS:
    case MOCK_TONE.NEUTRAL:
      return 5_000;
  }
};

export const getTypeIcon = (type: MockType, size = 20): ReactNode => {
  switch (type) {
    case MOCK_TYPE.NEW_CHAPTERS:
      return <BookOpenTextIcon size={size} />;
    case MOCK_TYPE.EMAIL_CHANGED:
      return <EnvelopeSimpleIcon size={size} />;
    case MOCK_TYPE.DELETION_REQUESTED:
      return <TrashIcon size={size} />;
    case MOCK_TYPE.NEW_DEVICE_LOGIN:
      return <DevicesIcon size={size} />;
    case MOCK_TYPE.SOURCE_DOWN:
      return <WarningCircleIcon size={size} />;
    case MOCK_TYPE.SOURCE_RECOVERED:
      return <CheckCircleIcon size={size} />;
    case MOCK_TYPE.PARSER_DOWN:
      return <WrenchIcon size={size} />;
    case MOCK_TYPE.PARSER_RECOVERED:
      return <CheckCircleIcon size={size} />;
    case MOCK_TYPE.INVITE_USED:
      return <UserPlusIcon size={size} />;
    case MOCK_TYPE.INVITE_EXPIRED:
      return <CalendarXIcon size={size} />;
  }
};

const CHAPTERS_PLURAL_RULES = new Intl.PluralRules('ru');

/** «1 новая глава», «3 новые главы», «12 новых глав». */
export const getChaptersText = (count: number) => {
  switch (CHAPTERS_PLURAL_RULES.select(count)) {
    case 'one':
      return `${count}\u00A0новая глава`;
    case 'few':
      return `${count}\u00A0новые главы`;
    default:
      return `${count}\u00A0новых глав`;
  }
};

/** Заголовок — одно предложение, что случилось. */
export const getNotificationTitle = (item: MockNotification) => {
  switch (item.type) {
    case MOCK_TYPE.NEW_CHAPTERS:
      return item.subject;
    case MOCK_TYPE.EMAIL_CHANGED:
      return 'Почта аккаунта изменена';
    case MOCK_TYPE.DELETION_REQUESTED:
      return 'Запрошено удаление аккаунта';
    case MOCK_TYPE.NEW_DEVICE_LOGIN:
      return 'Вход с нового устройства';
    case MOCK_TYPE.SOURCE_DOWN:
      return `Источник «${item.subject}» недоступен`;
    case MOCK_TYPE.SOURCE_RECOVERED:
      return `Источник «${item.subject}» снова работает`;
    case MOCK_TYPE.PARSER_DOWN:
      return `Источник «${item.subject}» перешёл в down`;
    case MOCK_TYPE.PARSER_RECOVERED:
      return `Источник «${item.subject}» восстановился`;
    case MOCK_TYPE.INVITE_USED:
      return `${item.subject} зарегистрировался по инвайту`;
    case MOCK_TYPE.INVITE_EXPIRED:
      return 'Инвайт истёк неиспользованным';
  }
};

/** Уточнение: что изменится или что делать. Для новых глав его формирует вызывающий. */
export const getNotificationDetail = (item: MockNotification) => {
  switch (item.type) {
    case MOCK_TYPE.NEW_CHAPTERS:
      return null;
    case MOCK_TYPE.EMAIL_CHANGED:
      return 'Если это были не вы, отмените смену по ссылке из письма';
    case MOCK_TYPE.DELETION_REQUESTED:
      return 'Пока удаление не выполнено, его можно отменить';
    case MOCK_TYPE.NEW_DEVICE_LOGIN:
      return item.detail;
    case MOCK_TYPE.SOURCE_DOWN:
      return 'Тайтлы с него в закладках пока не обновятся';
    case MOCK_TYPE.SOURCE_RECOVERED:
      return 'Закладки с него снова обновляются';
    case MOCK_TYPE.PARSER_DOWN:
      return item.detail ? `Причина: ${item.detail}` : null;
    case MOCK_TYPE.PARSER_RECOVERED:
      return 'Проверка прошла успешно';
    case MOCK_TYPE.INVITE_USED:
      return 'Новый пользователь появился в «Управлении»';
    case MOCK_TYPE.INVITE_EXPIRED:
      return item.detail ? `Приглашение ${item.detail}` : null;
  }
};

/** Пояснение под тумблером push на устройстве. */
export const getDeviceDescription = (state: DeviceState) => {
  switch (state) {
    case DEVICE_STATE.UNSUPPORTED:
      return 'Этот браузер не поддерживает push-уведомления';
    case DEVICE_STATE.IOS_NOT_INSTALLED:
      return 'Установите приложение на главный экран — тогда push заработает';
    case DEVICE_STATE.DENIED:
      return 'Разрешите уведомления в настройках браузера';
    case DEVICE_STATE.OFF:
      return 'Новые главы и важные события придут, даже когда приложение закрыто';
    case DEVICE_STATE.ON:
      return 'Push включён на этом устройстве';
    case DEVICE_STATE.EXPIRED:
      return 'Подписка устарела — включите push заново';
  }
};

export const getIsDeviceDisabled = (state: DeviceState) => {
  switch (state) {
    case DEVICE_STATE.UNSUPPORTED:
    case DEVICE_STATE.IOS_NOT_INSTALLED:
    case DEVICE_STATE.DENIED:
      return true;
    case DEVICE_STATE.OFF:
    case DEVICE_STATE.ON:
    case DEVICE_STATE.EXPIRED:
      return false;
  }
};

/** Значок на строке: убрать одно уведомление. */
export const getDismissRowIcon = (dismiss: Dismiss): ReactNode => {
  switch (dismiss) {
    case DISMISS.CHECK:
      return <CheckIcon size={14} />;
    case DISMISS.CURRENT:
    case DISMISS.CROSS:
      return <XIcon size={14} />;
    case DISMISS.TRASH:
      return <TrashIcon size={14} />;
  }
};

export const getDismissRowLabel = (dismiss: Dismiss) => {
  switch (dismiss) {
    case DISMISS.CHECK:
      return 'Отметить прочитанным';
    case DISMISS.CURRENT:
    case DISMISS.CROSS:
    case DISMISS.TRASH:
      return 'Убрать уведомление';
  }
};

/** Значок кнопки «убрать все». */
export const getDismissAllIcon = (dismiss: Dismiss): ReactNode => {
  switch (dismiss) {
    case DISMISS.CURRENT:
    case DISMISS.CHECK:
      return <ChecksIcon />;
    case DISMISS.CROSS:
      return <XIcon />;
    case DISMISS.TRASH:
      return <TrashIcon />;
  }
};

export const getDismissAllLabel = (dismiss: Dismiss) => {
  switch (dismiss) {
    case DISMISS.CURRENT:
    case DISMISS.CHECK:
      return 'Отметить все уведомления прочитанными';
    case DISMISS.CROSS:
    case DISMISS.TRASH:
      return 'Убрать все уведомления';
  }
};
