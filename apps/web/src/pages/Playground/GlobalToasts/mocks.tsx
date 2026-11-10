import {
  ArrowsClockwiseIcon,
  BookmarkSimpleIcon,
  CheckCircleIcon,
  CopyIcon,
  DeviceMobileIcon,
  DevicesIcon,
  CalendarXIcon,
  WarningCircleIcon,
  WrenchIcon,
} from '@phosphor-icons/react';
import { NOTIFICATION_TONE } from '@/entities/notification/models';
import { TOAST_KIND, type ToastSample } from './models';

export const COPIED: ToastSample = {
  id: 'copied',
  title: 'Ссылка скопирована',
  icon: <CopyIcon size={20} />,
  tone: NOTIFICATION_TONE.SUCCESS,
  kind: TOAST_KIND.MESSAGE,
  duration: 5000,
};
export const ERROR: ToastSample = {
  id: 'server-error',
  title: 'Не удалось сохранить закладку',
  description: 'Нет соединения с сервером. Попробуйте позже.',
  icon: <WarningCircleIcon size={20} />,
  tone: NOTIFICATION_TONE.DANGER,
  kind: TOAST_KIND.MESSAGE,
  duration: 10000,
};
export const WARNING: ToastSample = {
  id: 'source-down',
  title: 'Реманга недоступна',
  description: 'Тайтлы в закладках пока не обновляются.',
  icon: <WarningCircleIcon size={20} />,
  tone: NOTIFICATION_TONE.WARNING,
  kind: TOAST_KIND.EVENT,
  duration: 8000,
  background: true,
};
export const RECOVERED: ToastSample = {
  id: 'source-recovered',
  title: 'Реманга снова работает',
  description: 'Тайтлы в закладках снова обновляются.',
  icon: <CheckCircleIcon size={20} />,
  tone: NOTIFICATION_TONE.SUCCESS,
  kind: TOAST_KIND.EVENT,
  duration: 5000,
  background: true,
};
export const SECURITY: ToastSample = {
  id: 'new-device',
  title: 'Вход с нового устройства',
  description: 'Chrome · macOS · Новосибирск',
  icon: <DevicesIcon size={20} />,
  tone: NOTIFICATION_TONE.DANGER,
  kind: TOAST_KIND.EVENT,
  duration: 10000,
  security: true,
};
export const NEUTRAL: ToastSample = {
  id: 'invite-expired',
  title: 'Приглашение истекло без использования',
  icon: <CalendarXIcon size={20} />,
  tone: NOTIFICATION_TONE.NEUTRAL,
  kind: TOAST_KIND.EVENT,
  duration: 5000,
  background: true,
};
export const RESTORE: ToastSample = {
  id: 'restore-bookmark',
  title: 'Убрано из закладок',
  icon: <BookmarkSimpleIcon size={20} />,
  tone: NOTIFICATION_TONE.ACCENT,
  kind: TOAST_KIND.RESTORE,
  duration: 10000,
};
export const RESTORE_TITLE: ToastSample = {
  ...RESTORE,
  id: 'restore-title',
  title: 'Тайтл убран из «Продолжить чтение»',
};
export const UPDATE: ToastSample = {
  id: 'pwa-update',
  title: 'Доступно обновление',
  description: 'Приложение перезагрузится. Скачивание глав продолжится автоматически.',
  icon: <ArrowsClockwiseIcon size={20} />,
  tone: NOTIFICATION_TONE.NEUTRAL,
  kind: TOAST_KIND.PWA,
  duration: null,
};
export const INSTALL: ToastSample = {
  ...UPDATE,
  id: 'pwa-install',
  title: 'Установить Tanuki',
  description: 'Запускайте Tanuki с ярлыка, читайте на весь экран и без сети.',
  icon: <DeviceMobileIcon size={20} />,
};
export const LONG_RU: ToastSample = {
  ...ERROR,
  id: 'long-ru',
  title:
    'Не удалось добавить «Поднятие уровня в одиночку: возвращение охотника из подземелья» в закладки',
  description:
    'Источник временно недоступен. Данные других источников сохранятся; попробуйте добавить этот тайтл позже.',
};
export const LONG_EN: ToastSample = {
  ...ERROR,
  id: 'long-en',
  title: 'Could not restore “The Beginning After the End: A New Adventure Beyond the Continent”',
  description:
    'The server is temporarily unavailable. Your reading progress has been preserved. Please try again later.',
};
export const PARSER: ToastSample = {
  ...WARNING,
  id: 'parser-down',
  title: 'Парсер Реманги остановился',
  description: 'Источник изменил структуру страницы.',
  icon: <WrenchIcon size={20} />,
};
export const TEXT_SAMPLES = [
  COPIED,
  ERROR,
  WARNING,
  RECOVERED,
  SECURITY,
  NEUTRAL,
  LONG_RU,
  LONG_EN,
];
export const RESULT_TEXT_SAMPLES = [...TEXT_SAMPLES, PARSER];
export const EVENT_TARGETS = new Map([
  [WARNING.id, 'Открыты источники'],
  [RECOVERED.id, 'Открыты источники'],
  [SECURITY.id, 'Открыт раздел «Вход и безопасность»'],
  [NEUTRAL.id, 'Открыты приглашения'],
  [PARSER.id, 'Открыта страница здоровья источников'],
]);
