import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UserSettings } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { USER_SETTINGS_QUERY_KEY } from '@/shared/hooks/useUserSettings';

type Patch = Pick<UserSettings, 'selectionsDisabledSources' | 'selectionsDisabledSections'>;

const MUTATION_KEY = ['user-settings', 'selections'] as const;

/**
 * Сохраняет выбор подборок. Переключатель и галочки откликаются сразу, не дожидаясь сервера.
 * Патч считается от кеша в момент клика, поэтому быстрые клики подряд не теряют друг друга, а
 * запросы идут по очереди: сервер видит их в том же порядке. Ответ пишется в кеш только от
 * последнего запроса, ошибка перечитывает настройки. В localStorage не пишется: подборки —
 * серверная настройка.
 */
function useUpdateSelectionsSettings() {
  const queryClient = useQueryClient();
  // Ещё не ушедшие запросы несут более свежий выбор — их ответ его и подтвердит.
  const isLastInQueue = () => queryClient.isMutating({ mutationKey: MUTATION_KEY }) === 1;

  const { mutate } = useMutation({
    mutationKey: MUTATION_KEY,
    scope: { id: MUTATION_KEY.join('.') },
    mutationFn: (patch: Patch) =>
      apiFetch<UserSettings>('/user-settings', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(patch),
      }),
    onSuccess: (settings) => {
      if (isLastInQueue()) {
        void queryClient.cancelQueries({ queryKey: USER_SETTINGS_QUERY_KEY });
        queryClient.setQueryData(USER_SETTINGS_QUERY_KEY, settings);
      }
    },
    onError: () => {
      if (isLastInQueue()) {
        void queryClient.invalidateQueries({ queryKey: USER_SETTINGS_QUERY_KEY });
      }
    },
  });

  return (getPatch: (settings: UserSettings | undefined) => Patch) => {
    // Иначе уже летящий GET приземлится поверх и вернёт галочку на прежнее место.
    void queryClient.cancelQueries({ queryKey: USER_SETTINGS_QUERY_KEY });
    const patch = getPatch(queryClient.getQueryData<UserSettings>(USER_SETTINGS_QUERY_KEY));
    queryClient.setQueryData<UserSettings>(USER_SETTINGS_QUERY_KEY, (current) => ({
      ...current,
      ...patch,
    }));
    mutate(patch);
  };
}

export default useUpdateSelectionsSettings;
