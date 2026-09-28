import { Button, Group } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { ArrowClockwiseIcon, CaretLeftIcon } from '@phosphor-icons/react';
import { ApiRequestError, isNotFoundError, NETWORK_ERROR_STATUS } from '@/shared/api/client';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import StatusScreen from './StatusScreen';

type Props = {
  error: Error;
  onRetry?: () => unknown;
};

/** Код фоном: HTTP-статус ответа; без ответа сервера (сеть) — 503, сбой на фронте — 500. */
const getStatusCode = (error: Error) => {
  if (!(error instanceof ApiRequestError)) return '500';
  if (error.status === NETWORK_ERROR_STATUS) return '503';
  return String(error.status);
};

/**
 * Экран вместо страницы, чей основной запрос упал без данных: без него страница осталась бы пустой.
 * Уведомление об этой же ошибке показывает глобальный обработчик (см. QueryClientProvider), а в
 * блоках страницы экран не нужен — там хватает уведомления. Текст ошибки API приходит с сервера
 * уже переведённым.
 */
function QueryError({ error, onRetry }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isApiError = error instanceof ApiRequestError;

  // Объекта нет — это не сбой, и повтор вернёт то же самое: уводим на главную.
  if (isNotFoundError(error)) {
    return (
      <StatusScreen code="404" title={t('pageNotFound')} description={error.message}>
        <Button component={Link} to={ROUTE_PATHS.SOURCES}>
          {t('toMainPage')}
        </Button>
      </StatusScreen>
    );
  }

  return (
    <StatusScreen
      code={getStatusCode(error)}
      title={t('somethingWentWrong')}
      description={isApiError ? error.message : t('tryAgainLater')}
    >
      <Group gap="sm">
        <Button onClick={() => navigate(-1)} leftSection={<CaretLeftIcon />} variant="default">
          {t('back')}
        </Button>
        {onRetry && (
          <Button leftSection={<ArrowClockwiseIcon />} onClick={() => onRetry()}>
            {t('retry')}
          </Button>
        )}
      </Group>
    </StatusScreen>
  );
}

export default QueryError;
