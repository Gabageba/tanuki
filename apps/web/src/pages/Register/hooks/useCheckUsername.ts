import { useQuery } from '@tanstack/react-query';
import { useDebouncedValue } from '@mantine/hooks';
import { USERNAME_PATTERN, type CheckUsernameResponse } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';

/** Не спрашивает сервер, пока строка сама по себе не проходит формат — незачем гонять запрос
 *  на заведомо невалидное имя, пока человек его ещё печатает. */
function useCheckUsername(username: string, inviteCode: string) {
  const [debounced] = useDebouncedValue(username, 400);
  const isPlausible = USERNAME_PATTERN.test(debounced);

  const query = useQuery({
    queryKey: ['auth', 'check-username', debounced, inviteCode],
    queryFn: () =>
      apiFetch<CheckUsernameResponse>(
        `/auth/check-username?username=${encodeURIComponent(debounced)}&invite=${encodeURIComponent(inviteCode)}`,
      ),
    enabled: isPlausible && inviteCode.length > 0,
    staleTime: 10_000,
    retry: false,
  });

  // Пока debounce ещё «в пути» к последнему введённому значению, старый результат не должен
  // мигать как ответ на уже устаревший ввод.
  const isStale = debounced !== username;

  return { ...query, isPlausible, isStale };
}

export default useCheckUsername;
