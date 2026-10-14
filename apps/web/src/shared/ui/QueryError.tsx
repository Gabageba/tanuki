import { Button, Group } from '@mantine/core';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { ArrowClockwiseIcon, CaretLeftIcon, GearIcon, SignInIcon } from '@phosphor-icons/react';
import {
  ApiRequestError,
  isAdultContentHiddenError,
  isNotFoundError,
  isSourceAccountRequiredError,
  isSourceAuthRequiredError,
  isNetworkError,
  isSourceReloginRequiredError,
  NETWORK_ERROR_STATUS,
} from '@/shared/api/client';
import { ROUTE_PATHS, SOURCE_ACCOUNTS_PATH } from '@/shared/lib/routes';
import OfflineEmptyState from './OfflineEmptyState';
import StatusScreen from './StatusScreen';

type Props = {
  error: Error;
  onRetry?: () => unknown;
  /** Что именно не сохранено на устройстве, когда страница без сети не открылась из кеша. */
  offlineDescription?: string;
};

/** Код фоном: HTTP-статус ответа; без ответа сервера (сеть) — 503, сбой на фронте — 500. */
const getStatusCode = (error: Error) => {
  if (!(error instanceof ApiRequestError)) return '500';
  if (error.status === NETWORK_ERROR_STATUS) return '503';
  return String(error.status);
};

/**
 * Источник или тайтл закрыт до входа в аккаунт источника — не сбой: повтор ничего не даст.
 * Возвращает заголовок экрана и подпись кнопки; null — ошибка не про вход.
 */
const getSourceLock = (error: Error, t: TFunction) => {
  if (isSourceReloginRequiredError(error)) {
    return { title: t('sessionExpired'), action: t('logInAgain') };
  }
  if (isSourceAccountRequiredError(error)) {
    return { title: t('sourceClosed'), action: t('logIn') };
  }
  if (isSourceAuthRequiredError(error)) {
    return { title: t('onlyForLoggedIn'), action: t('logIn') };
  }
  return null;
};

/**
 * Экран вместо страницы, чей основной запрос упал без данных: без него страница осталась бы пустой.
 * Уведомление об этой же ошибке показывает глобальный обработчик (см. QueryClientProvider), а в
 * блоках страницы экран не нужен — там хватает уведомления. Текст ошибки API приходит с сервера
 * уже переведённым.
 */
function QueryError({ error, onRetry, offlineDescription }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isApiError = error instanceof ApiRequestError;

  // Без сети это не сбой: страницы просто нет в кеше. Повтор не поможет, а скачанное — доступно.
  if (isNetworkError(error) && !navigator.onLine) {
    return <OfflineEmptyState title={t('noNetwork')} description={offlineDescription} />;
  }

  // Объекта нет — это не сбой, и повтор вернёт то же самое: уводим на главную.
  if (isNotFoundError(error)) {
    return (
      <StatusScreen code="404" title={t('pageNotFound')} description={error.message}>
        <Button component={Link} to={ROUTE_PATHS.HOME}>
          {t('toMainPage')}
        </Button>
      </StatusScreen>
    );
  }

  const sourceLock = getSourceLock(error, t);
  if (sourceLock) {
    return (
      <StatusScreen code="403" title={sourceLock.title} description={error.message}>
        <Group gap="sm">
          <Button onClick={() => navigate(-1)} leftSection={<CaretLeftIcon />} variant="default">
            {t('back')}
          </Button>
          <Button component={Link} to={SOURCE_ACCOUNTS_PATH} leftSection={<SignInIcon />}>
            {sourceLock.action}
          </Button>
        </Group>
      </StatusScreen>
    );
  }

  // Контент 18+ скрыт настройками — повтор ничего не даст, открыть его можно только там.
  if (isAdultContentHiddenError(error)) {
    return (
      <StatusScreen code="403" title={t('adultContentHidden')} description={error.message}>
        <Group gap="sm">
          <Button onClick={() => navigate(-1)} leftSection={<CaretLeftIcon />} variant="default">
            {t('back')}
          </Button>
          <Button component={Link} to={ROUTE_PATHS.SETTINGS} leftSection={<GearIcon />}>
            {t('settings')}
          </Button>
        </Group>
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
