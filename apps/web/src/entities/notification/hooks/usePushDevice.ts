import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/shared/api/client';
import { SILENT_ERROR_META } from '@/shared/api/errorMeta';
import { PUSH_DEVICE_STATE, PUSH_SUBSCRIPTION_QUERY_KEY } from '../models';
import {
  getPushDeviceState,
  readBrowserSubscription,
  readPushEnabledFlag,
  removePushSubscription,
  urlBase64ToUint8Array,
  writePushEnabledFlag,
} from '../push';
import { mergeQueries, toOptionalQuery } from '@/shared/ui/QueryBlock/lib';
import usePushConfig from './usePushConfig';

/**
 * Push на этом устройстве: состояние (по браузеру, а не по серверу — подписка живёт в нём) и
 * включение с выключением. Разрешение браузера запрашивается только внутри `enable`, то есть по клику.
 */
function usePushDevice() {
  const queryClient = useQueryClient();
  const configQuery = usePushConfig();
  const { data: config, isPending: isConfigPending } = configQuery;
  const publicKey = config?.publicKey ?? '';

  const subscriptionQuery = useQuery({
    queryKey: PUSH_SUBSCRIPTION_QUERY_KEY,
    queryFn: readBrowserSubscription,
    staleTime: Infinity,
    meta: SILENT_ERROR_META,
  });
  const { data: subscription = null, isPending } = subscriptionQuery;

  const refresh = () => queryClient.invalidateQueries({ queryKey: PUSH_SUBSCRIPTION_QUERY_KEY });

  const enable = useMutation({
    mutationFn: async () => {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      const registration = await navigator.serviceWorker.ready;
      // Подписка с прежним ключом сервера не годится — меняем её на новую.
      await (await registration.pushManager.getSubscription())?.unsubscribe();
      const created = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const { endpoint, keys } = created.toJSON();
      try {
        await apiFetch('/notifications/push/subscriptions', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ endpoint, keys }),
        });
      } catch (error) {
        // Сервер о подписке не знает — без отката тумблер показал бы «включено», а push не пришёл бы.
        await created.unsubscribe();
        throw error;
      }
      writePushEnabledFlag(true);
    },
    onSettled: refresh,
  });

  const disable = useMutation({
    mutationFn: removePushSubscription,
    onSettled: refresh,
  });

  return {
    /** Push вообще можно предлагать: на инстансе заданы ключи. */
    isAvailable: config?.enabled === true,
    // Упавший запрос конфига — тоже ответ: push не предлагается, а не ждётся вечно.
    isPending: isPending || isConfigPending,
    /** Загрузка для механизма скелетонов: упавшие конфиг и подписка — тоже ответ, не ожидание. */
    query: mergeQueries([toOptionalQuery(configQuery), toOptionalQuery(subscriptionQuery)]),
    state: isPending
      ? PUSH_DEVICE_STATE.OFF
      : getPushDeviceState({ subscription, wasEnabled: readPushEnabledFlag(), publicKey }),
    isChanging: enable.isPending || disable.isPending,
    enable: enable.mutate,
    disable: disable.mutate,
  };
}

export default usePushDevice;
