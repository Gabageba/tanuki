import { Button, EmptyState } from '@mantine/core';
import { Link } from 'react-router';
import { ArrowClockwiseIcon, SignInIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { SEARCH_GROUP_STATUS, type Source } from '@tanuki/contracts';
import { SOURCE_ACCOUNTS_PATH } from '@/shared/lib/routes';
import { getMissReasonLabel } from '@/entities/source/lib';
import type { MissStatus } from '@/entities/source/models';

type Props = {
  source: Source;
  status: MissStatus;
  isRetrying: boolean;
  onRetry: () => void;
};

/**
 * Выбранный источник не ответил — на месте блоков причина и «Повторить запрос подборок» или
 * «Войти в …». Строки «Не ответили» из поиска здесь нет: источник на странице один. Недоступный
 * источник не опрашивался — повторять нечего.
 */
function SourceMissedState({ source, status, isRetrying, onRetry }: Props) {
  const { t } = useTranslation();

  return (
    <EmptyState
      icon={<WarningCircleIcon />}
      title={t('sourceColonReason', {
        source: source.title,
        reason: getMissReasonLabel(status, t),
      })}
      description={t('cannotGetSourceSelectionsNow')}
    >
      <EmptyState.Actions>
        {status === SEARCH_GROUP_STATUS.LOCKED && (
          <Button
            component={Link}
            to={SOURCE_ACCOUNTS_PATH}
            variant="default"
            leftSection={<SignInIcon />}
          >
            {t('logInToSource', { source: source.title })}
          </Button>
        )}
        {(status === SEARCH_GROUP_STATUS.TIMEOUT || status === SEARCH_GROUP_STATUS.ERROR) && (
          <Button
            variant="default"
            leftSection={<ArrowClockwiseIcon />}
            loading={isRetrying}
            onClick={onRetry}
          >
            {t('retrySelectionsRequest')}
          </Button>
        )}
      </EmptyState.Actions>
    </EmptyState>
  );
}

export default SourceMissedState;
