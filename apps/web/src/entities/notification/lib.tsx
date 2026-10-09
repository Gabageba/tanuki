import type { TFunction } from 'i18next';
import { generatePath } from 'react-router';
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
  catalogEntryFor,
  NOTIFICATION_CATEGORY,
  NOTIFICATION_TYPE,
  USER_ROLE,
  type NotificationCategory,
  type NotificationItem,
  type NotificationType,
  type UserRole,
} from '@tanuki/contracts';
import { getSourceStatusReasonLabel } from '@/entities/source/lib';
import {
  PRIMARY_COLOR,
  STATUS_DEGRADED_COLOR,
  STATUS_DOWN_COLOR,
  STATUS_OK_COLOR,
} from '@/shared/lib/palette';
import {
  getSourcesHealthPath,
  MANAGEMENT_INVITES_PATH,
  PROFILE_TAB_SEARCH_PARAM,
  PROFILE_TABS,
  ROUTE_PATHS,
} from '@/shared/lib/routes';
import {
  NOTIFICATION_TONE,
  PUSH_DEVICE_STATE,
  type NotificationTone,
  type PushDeviceState,
} from './models';

/** Название источника по id; id, которого нет в каталоге (запись старой версии), показывается как есть. */
export const getSourceTitle = (sourceId: string) => {
  try {
    return catalogEntryFor(sourceId).title;
  } catch {
    return sourceId;
  }
};

export const getNotificationTone = (type: NotificationType): NotificationTone => {
  switch (type) {
    case NOTIFICATION_TYPE.NEW_CHAPTERS:
      return NOTIFICATION_TONE.ACCENT;
    case NOTIFICATION_TYPE.EMAIL_CHANGED:
    case NOTIFICATION_TYPE.DELETION_REQUESTED:
    case NOTIFICATION_TYPE.NEW_DEVICE_LOGIN:
      return NOTIFICATION_TONE.DANGER;
    case NOTIFICATION_TYPE.SOURCE_DOWN:
    case NOTIFICATION_TYPE.PARSER_DOWN:
      return NOTIFICATION_TONE.WARNING;
    case NOTIFICATION_TYPE.SOURCE_RECOVERED:
    case NOTIFICATION_TYPE.PARSER_RECOVERED:
      return NOTIFICATION_TONE.SUCCESS;
    case NOTIFICATION_TYPE.INVITE_USED:
    case NOTIFICATION_TYPE.INVITE_EXPIRED:
      return NOTIFICATION_TONE.NEUTRAL;
  }
};

export const getToneColor = (tone: NotificationTone) => {
  switch (tone) {
    case NOTIFICATION_TONE.ACCENT:
      return PRIMARY_COLOR;
    case NOTIFICATION_TONE.DANGER:
      return STATUS_DOWN_COLOR;
    case NOTIFICATION_TONE.WARNING:
      return STATUS_DEGRADED_COLOR;
    case NOTIFICATION_TONE.SUCCESS:
      return STATUS_OK_COLOR;
    case NOTIFICATION_TONE.NEUTRAL:
      return 'gray';
  }
};

/** Как долго держится тост (мс): чем важнее событие, тем дольше. */
export const getToneToastDuration = (tone: NotificationTone) => {
  switch (tone) {
    case NOTIFICATION_TONE.DANGER:
      return 10_000;
    case NOTIFICATION_TONE.WARNING:
      return 8_000;
    case NOTIFICATION_TONE.ACCENT:
    case NOTIFICATION_TONE.SUCCESS:
    case NOTIFICATION_TONE.NEUTRAL:
      return 5_000;
  }
};

export const getNotificationIcon = (type: NotificationType, size = 20) => {
  switch (type) {
    case NOTIFICATION_TYPE.NEW_CHAPTERS:
      return <BookOpenTextIcon size={size} />;
    case NOTIFICATION_TYPE.EMAIL_CHANGED:
      return <EnvelopeSimpleIcon size={size} />;
    case NOTIFICATION_TYPE.DELETION_REQUESTED:
      return <TrashIcon size={size} />;
    case NOTIFICATION_TYPE.NEW_DEVICE_LOGIN:
      return <DevicesIcon size={size} />;
    case NOTIFICATION_TYPE.SOURCE_DOWN:
      return <WarningCircleIcon size={size} />;
    case NOTIFICATION_TYPE.SOURCE_RECOVERED:
    case NOTIFICATION_TYPE.PARSER_RECOVERED:
      return <CheckCircleIcon size={size} />;
    case NOTIFICATION_TYPE.PARSER_DOWN:
      return <WrenchIcon size={size} />;
    case NOTIFICATION_TYPE.INVITE_USED:
      return <UserPlusIcon size={size} />;
    case NOTIFICATION_TYPE.INVITE_EXPIRED:
      return <CalendarXIcon size={size} />;
  }
};

export const getCategoryLabel = (category: NotificationCategory, t: TFunction) => {
  switch (category) {
    case NOTIFICATION_CATEGORY.CHAPTERS:
      return t('newChapters');
    case NOTIFICATION_CATEGORY.ACCOUNT:
      return t('account');
    case NOTIFICATION_CATEGORY.SOURCES:
      return t('sources');
    case NOTIFICATION_CATEGORY.ADMINISTRATION:
      return t('administration');
  }
};

export const getCategoryIcon = (category: NotificationCategory, size = 20) => {
  switch (category) {
    case NOTIFICATION_CATEGORY.CHAPTERS:
      return <BookOpenTextIcon size={size} />;
    case NOTIFICATION_CATEGORY.ACCOUNT:
      return <UserCircleIcon size={size} />;
    case NOTIFICATION_CATEGORY.SOURCES:
      return <PlugsIcon size={size} />;
    case NOTIFICATION_CATEGORY.ADMINISTRATION:
      return <ShieldCheckIcon size={size} />;
  }
};

/** Что входит в категорию; у «Администрирования» модератор не получает инвайты. */
export const getCategoryDescription = (
  category: NotificationCategory,
  role: UserRole | undefined,
  t: TFunction,
) => {
  switch (category) {
    case NOTIFICATION_CATEGORY.CHAPTERS:
      return t('newChaptersInTrackedFolders');
    case NOTIFICATION_CATEGORY.ACCOUNT:
      return t('newDeviceSignInEmailChangeAccountDeletion');
    case NOTIFICATION_CATEGORY.SOURCES:
      return t('bookmarkedSourceDownOrWorksAgain');
    case NOTIFICATION_CATEGORY.ADMINISTRATION:
      return role === USER_ROLE.ADMIN
        ? t('sourcesAndParsersInvitesSignUpsAndExpiries')
        : t('sourcesAndParsersDownOrRecovered');
  }
};

/** Категории, которые человек видит в ленте и настройках: «Администрирование» — только staff. */
export const getVisibleCategories = (isStaff: boolean) =>
  Object.values(NOTIFICATION_CATEGORY).filter(
    (category) => category !== NOTIFICATION_CATEGORY.ADMINISTRATION || isStaff,
  );

/** Заголовок — одно предложение: что случилось. */
export const getNotificationTitle = (item: NotificationItem, t: TFunction) => {
  switch (item.type) {
    case NOTIFICATION_TYPE.NEW_CHAPTERS:
      return item.payload.name;
    case NOTIFICATION_TYPE.EMAIL_CHANGED:
      return t('accountEmailChanged');
    case NOTIFICATION_TYPE.DELETION_REQUESTED:
      return t('accountDeletionRequested');
    case NOTIFICATION_TYPE.NEW_DEVICE_LOGIN:
      return t('signInFromNewDevice');
    case NOTIFICATION_TYPE.SOURCE_DOWN:
      return t('sourceNameUnavailable', { name: getSourceTitle(item.payload.sourceId) });
    case NOTIFICATION_TYPE.SOURCE_RECOVERED:
      return t('sourceNameWorksAgain', { name: getSourceTitle(item.payload.sourceId) });
    case NOTIFICATION_TYPE.PARSER_DOWN:
      return t('sourceNameWentDown', { name: getSourceTitle(item.payload.sourceId) });
    case NOTIFICATION_TYPE.PARSER_RECOVERED:
      return t('sourceNameRecovered', { name: getSourceTitle(item.payload.sourceId) });
    case NOTIFICATION_TYPE.INVITE_USED:
      return t('userSignedUpWithInvite', { username: item.payload.username });
    case NOTIFICATION_TYPE.INVITE_EXPIRED:
      return t('inviteExpiredUnused');
  }
};

/** Уточнение под заголовком: что изменится или что делать. У истёкшего инвайта его нет. */
export const getNotificationDetail = (item: NotificationItem, t: TFunction) => {
  switch (item.type) {
    case NOTIFICATION_TYPE.NEW_CHAPTERS:
      return t('newChapterCount', { count: item.count });
    case NOTIFICATION_TYPE.EMAIL_CHANGED:
      return t('cancelChangeViaEmailLink');
    case NOTIFICATION_TYPE.DELETION_REQUESTED:
      return t('deletionCanBeCancelled');
    case NOTIFICATION_TYPE.NEW_DEVICE_LOGIN:
      return item.payload.device;
    case NOTIFICATION_TYPE.SOURCE_DOWN:
      return t('bookmarkedTitlesWontUpdateYet');
    case NOTIFICATION_TYPE.SOURCE_RECOVERED:
      return t('bookmarksUpdateAgain');
    case NOTIFICATION_TYPE.PARSER_DOWN:
      return t('reasonWithValue', { reason: getSourceStatusReasonLabel(item.payload.reason, t) });
    case NOTIFICATION_TYPE.PARSER_RECOVERED:
      return t('checkPassed');
    case NOTIFICATION_TYPE.INVITE_USED:
      return t('newUserAppearedInManagement');
    case NOTIFICATION_TYPE.INVITE_EXPIRED:
      return null;
  }
};

/** Куда ведёт клик по уведомлению (те же адреса, что у push в `push-message.ts` API). */
export const getNotificationTargetPath = (item: NotificationItem) => {
  switch (item.type) {
    case NOTIFICATION_TYPE.NEW_CHAPTERS:
      return generatePath(ROUTE_PATHS.TITLE, { titleId: item.payload.titleId });
    case NOTIFICATION_TYPE.EMAIL_CHANGED:
    case NOTIFICATION_TYPE.DELETION_REQUESTED:
    case NOTIFICATION_TYPE.NEW_DEVICE_LOGIN:
      return `${ROUTE_PATHS.PROFILE}?${PROFILE_TAB_SEARCH_PARAM}=${PROFILE_TABS.SIGN_IN_AND_SECURITY}`;
    case NOTIFICATION_TYPE.SOURCE_DOWN:
    case NOTIFICATION_TYPE.SOURCE_RECOVERED:
    case NOTIFICATION_TYPE.PARSER_DOWN:
    case NOTIFICATION_TYPE.PARSER_RECOVERED:
      return getSourcesHealthPath(item.payload.sourceId);
    case NOTIFICATION_TYPE.INVITE_USED:
    case NOTIFICATION_TYPE.INVITE_EXPIRED:
      return MANAGEMENT_INVITES_PATH;
  }
};

/** Тост — только у категорий, о которых надо знать сразу; новые главы меняют лишь бейдж. */
export const hasNotificationToast = (category: NotificationCategory) => {
  switch (category) {
    case NOTIFICATION_CATEGORY.ACCOUNT:
    case NOTIFICATION_CATEGORY.SOURCES:
    case NOTIFICATION_CATEGORY.ADMINISTRATION:
      return true;
    case NOTIFICATION_CATEGORY.CHAPTERS:
      return false;
  }
};

/** Пояснение под тумблером push на устройстве. */
export const getPushDeviceDescription = (state: PushDeviceState, t: TFunction) => {
  switch (state) {
    case PUSH_DEVICE_STATE.UNSUPPORTED:
      return t('browserDoesNotSupportPush');
    case PUSH_DEVICE_STATE.IOS_NOT_INSTALLED:
      return t('addAppToHomeScreenForPush');
    case PUSH_DEVICE_STATE.DENIED:
      return t('allowNotificationsInBrowserSettings');
    case PUSH_DEVICE_STATE.OFF:
      return t('pushArrivesEvenWhenAppClosedOnDevice');
    case PUSH_DEVICE_STATE.ON:
      return t('pushEnabledOnThisDevice');
    case PUSH_DEVICE_STATE.EXPIRED:
      return t('subscriptionExpiredEnablePushAgain');
  }
};

/** Тумблер устройства недоступен там, где включить push всё равно нельзя. */
export const isPushDeviceToggleDisabled = (state: PushDeviceState) => {
  switch (state) {
    case PUSH_DEVICE_STATE.UNSUPPORTED:
    case PUSH_DEVICE_STATE.IOS_NOT_INSTALLED:
    case PUSH_DEVICE_STATE.DENIED:
      return true;
    case PUSH_DEVICE_STATE.OFF:
    case PUSH_DEVICE_STATE.ON:
    case PUSH_DEVICE_STATE.EXPIRED:
      return false;
  }
};
