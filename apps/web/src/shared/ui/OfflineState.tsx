import { Button, EmptyState } from '@mantine/core';
import { ArrowClockwiseIcon, WifiSlashIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

type Props = {
  onRetry: () => unknown;
};

/**
 * Сети нет, а данных ещё нет: запрос на паузе и уйдёт сам, когда сеть появится. Кнопка — чтобы
 * проверить самому: браузер не всегда верно знает, есть ли сеть.
 */
function OfflineState({ onRetry }: Props) {
  const { t } = useTranslation();

  return (
    <EmptyState
      icon={<WifiSlashIcon />}
      title={t('noConnection')}
      description={t('willLoadWhenOnline')}
    >
      <EmptyState.Actions>
        <Button variant="default" leftSection={<ArrowClockwiseIcon />} onClick={() => onRetry()}>
          {t('retryLoading')}
        </Button>
      </EmptyState.Actions>
    </EmptyState>
  );
}

export default OfflineState;
