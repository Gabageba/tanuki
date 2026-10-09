import { apiFetch } from '@/shared/api/client';
import { PUSH_DEVICE_STATE, type PushDeviceState } from './models';

/** Флаг «на этом устройстве push включали»: по нему видно, что подписка в браузере пропала. */
export const PUSH_ENABLED_STORAGE_KEY = 'tanuki-push-enabled';
/** «Не сейчас» у предложения включить push — выбор на устройстве, а не на аккаунте. */
export const PUSH_OFFER_DISMISSED_STORAGE_KEY = 'tanuki-push-offer-dismissed';

/** Ключ VAPID приходит base64url-строкой, а `pushManager.subscribe` ждёт байты. */
export const urlBase64ToUint8Array = (value: string) => {
  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), '=');
  const raw = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
};

export const isPushSupported = () =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent);

const isInstalledApp = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  ('standalone' in navigator && navigator.standalone === true);

const isSameKey = (subscription: PushSubscription, publicKey: string) => {
  const current = subscription.options.applicationServerKey;
  if (!current) return false;
  const expected = urlBase64ToUint8Array(publicKey);
  const bytes = new Uint8Array(current);
  return bytes.length === expected.length && bytes.every((byte, index) => byte === expected[index]);
};

type DeviceInput = {
  subscription: PushSubscription | null;
  wasEnabled: boolean;
  publicKey: string;
};

/** Состояние push на этом устройстве по тому, что умеет и разрешил браузер. */
export const getPushDeviceState = ({
  subscription,
  wasEnabled,
  publicKey,
}: DeviceInput): PushDeviceState => {
  if (!isPushSupported()) {
    return isIos() && !isInstalledApp()
      ? PUSH_DEVICE_STATE.IOS_NOT_INSTALLED
      : PUSH_DEVICE_STATE.UNSUPPORTED;
  }
  if (Notification.permission === 'denied') return PUSH_DEVICE_STATE.DENIED;
  if (subscription) {
    return isSameKey(subscription, publicKey) ? PUSH_DEVICE_STATE.ON : PUSH_DEVICE_STATE.EXPIRED;
  }
  return wasEnabled ? PUSH_DEVICE_STATE.EXPIRED : PUSH_DEVICE_STATE.OFF;
};

export const readBrowserSubscription = async () => {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.getRegistration();
  return (await registration?.pushManager.getSubscription()) ?? null;
};

export const readPushEnabledFlag = () => {
  try {
    return window.localStorage.getItem(PUSH_ENABLED_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

export const writePushEnabledFlag = (enabled: boolean) => {
  try {
    if (enabled) window.localStorage.setItem(PUSH_ENABLED_STORAGE_KEY, 'true');
    else window.localStorage.removeItem(PUSH_ENABLED_STORAGE_KEY);
  } catch {
    // localStorage может быть недоступен (приватный режим)
  }
};

/**
 * Снимает подписку этого устройства и на сервере, и в браузере. В браузере — даже если сервер
 * не ответил: забытую строку он удалит сам, когда push-сервис ответит на endpoint 404/410.
 */
export const removePushSubscription = async () => {
  const current = await readBrowserSubscription();
  writePushEnabledFlag(false);
  if (!current) return;
  try {
    await apiFetch('/notifications/push/subscriptions', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ endpoint: current.endpoint }),
    });
  } finally {
    await current.unsubscribe();
  }
};

/** Только браузерная часть: когда сессии уже нет и сервер на DELETE ответит 401. */
export const dropBrowserPushSubscription = async () => {
  const current = await readBrowserSubscription();
  writePushEnabledFlag(false);
  await current?.unsubscribe();
};
