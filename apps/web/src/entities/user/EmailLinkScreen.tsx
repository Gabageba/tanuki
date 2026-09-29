import { useEffect, useRef } from 'react';
import { Anchor, Center, Divider, Loader, Stack } from '@mantine/core';
import { useMutation } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { SILENT_ERROR_META } from '@/shared/api/errorMeta';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import AuthFormLayout from '@/shared/ui/AuthFormLayout';

type Props = {
  mutationFn: (token: string) => Promise<unknown>;
  onSuccess: () => void;
};

/**
 * Страница, на которую ведёт ссылка из письма (смена почты, отмена удаления): ничего не спрашивает,
 * сразу применяет токен из адреса. Пока запрос идёт — лоадер, при ошибке — что ссылка не годится.
 */
function EmailLinkScreen({ mutationFn, onSuccess }: Props) {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const hasStarted = useRef(false);

  const mutation = useMutation({
    meta: SILENT_ERROR_META,
    mutationFn,
    onSuccess,
  });

  useEffect(() => {
    if (!token || hasStarted.current) return;
    hasStarted.current = true;
    mutation.mutate(token);
    // mutation — новый объект на каждый рендер, зависимость от него зациклила бы эффект.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token || mutation.isError) {
    return (
      <AuthFormLayout title={t('linkInvalidOrExpired')}>
        <Stack w="100%" align="center">
          <Divider w="100%" />
          <Anchor component={Link} to={ROUTE_PATHS.LOGIN} fz={12} lh={1} w="fit-content">
            {t('backToLogin')}
          </Anchor>
        </Stack>
      </AuthFormLayout>
    );
  }

  return (
    <Center>
      <Loader />
    </Center>
  );
}

export default EmailLinkScreen;
