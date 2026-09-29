import Bowser from 'bowser';
import { DEVICE_TYPE, type DeviceType, type Session } from '@tanuki/contracts';
import { toServerDateTime } from '../common/dates';
import type { SessionRow } from './session.service';

const toDeviceType = (platformType: string | undefined): DeviceType => {
  switch (platformType) {
    case Bowser.PLATFORMS_MAP.desktop:
      return DEVICE_TYPE.DESKTOP;
    case Bowser.PLATFORMS_MAP.mobile:
      return DEVICE_TYPE.MOBILE;
    case Bowser.PLATFORMS_MAP.tablet:
      return DEVICE_TYPE.TABLET;
    default:
      return DEVICE_TYPE.UNKNOWN;
  }
};

const joinName = (name: string | undefined, version: string | undefined): string | null => {
  if (!name) return null;
  return version ? `${name} ${version}` : name;
};

/** User-Agent разбирается здесь, а не на фронте, — клиент получает уже готовые названия. */
export const toSession = (session: SessionRow, currentSessionId: string): Session => {
  const parsed = session.userAgent ? Bowser.parse(session.userAgent) : null;
  return {
    id: session.id,
    // Только мажорная версия браузера: «Chrome 131», а не «Chrome 131.0.6778.86».
    browser: joinName(parsed?.browser.name, parsed?.browser.version?.split('.')[0]),
    os: joinName(parsed?.os.name, parsed?.os.versionName ?? parsed?.os.version),
    deviceType: toDeviceType(parsed?.platform.type),
    ip: session.ip,
    lastSeenAt: toServerDateTime(session.lastSeenAt.getTime()),
    createdAt: toServerDateTime(session.createdAt.getTime()),
    isCurrent: session.id === currentSessionId,
  };
};
