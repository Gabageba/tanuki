import { useEffect, useRef } from 'react';
import { Center, Loader, Stack, Title } from '@mantine/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import type { CurrentUser } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import ApiErrorText from '@/shared/ui/ApiErrorText';
import { CURRENT_USER_QUERY_KEY } from '@/entities/user/hooks/useCurrentUser';
import { ROUTE_PATHS } from '@/shared/lib/routes';

/** Заходят сюда только по ссылке из письма — сама страница ничего не спрашивает, просто
 *  подтверждает токен из адреса и сразу логинит. */
function VerifyEmail() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const hasStarted = useRef(false);

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<CurrentUser>('/auth/verify-email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token }),
      }),
    onSuccess: (user) => {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user);
      navigate(ROUTE_PATHS.SOURCES, { replace: true });
    },
  });

  useEffect(() => {
    if (!token || hasStarted.current) return;
    hasStarted.current = true;
    mutation.mutate();
    // mutation — новый объект на каждый рендер, зависимость от него зациклила бы эффект.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token || mutation.isError) {
    return (
      <Stack gap="md" align="center">
        <Title order={2} fz={20} ta="center">
          {t('emailNotConfirmedYet')}
        </Title>
        {mutation.error && <ApiErrorText error={mutation.error} />}
      </Stack>
    );
  }

  return (
    <Center>
      <Loader />
    </Center>
  );
}

export default VerifyEmail;
