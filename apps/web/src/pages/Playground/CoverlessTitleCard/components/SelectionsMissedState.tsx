import { Button, EmptyState } from '@mantine/core';
import { ArrowClockwiseIcon, SignInIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { SOURCE_ACCOUNTS_PATH } from '@/shared/lib/routes';
import { FEED_STATE, type FeedState } from '../models';

type Props = { state: FeedState; onRetry: () => void };

/** Локальная копия состояний SourceMissedState с теми же текстами и действиями. */
function SelectionsMissedState({ state, onRetry }: Props) {
  const locked = state === FEED_STATE.LOCKED;
  return (
    <EmptyState
      icon={<WarningCircleIcon />}
      title={locked ? 'Nude-Moon: Нужен вход' : 'Nude-Moon: Ошибка'}
      description="Подборки этого источника сейчас не получить — попробуйте позже или выберите другой."
    >
      <EmptyState.Actions>
        {locked ? (
          <Button
            component={Link}
            to={SOURCE_ACCOUNTS_PATH}
            variant="default"
            leftSection={<SignInIcon />}
          >
            Войти в Nude-Moon
          </Button>
        ) : (
          <Button variant="default" leftSection={<ArrowClockwiseIcon />} onClick={onRetry}>
            Повторить запрос подборок
          </Button>
        )}
      </EmptyState.Actions>
    </EmptyState>
  );
}

export default SelectionsMissedState;
