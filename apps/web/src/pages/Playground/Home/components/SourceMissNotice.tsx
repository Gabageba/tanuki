import { Button, EmptyState } from '@mantine/core';
import { Link } from 'react-router';
import { ArrowClockwiseIcon, SignInIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { SOURCE_ACCOUNTS_PATH } from '@/shared/lib/routes';
import { getMissReasonLabel } from '../../TitleSearch/lib';
import { MOCK_GROUP_STATUS, type MissedGroup } from '../../TitleSearch/models';

type Props = {
  group: MissedGroup;
};

/** Выбранный источник не ответил — на месте его блоков: причина и «Повторить» или «Войти». На
 *  странице подборок источник один, поэтому строка «Не ответили» из поиска здесь не нужна. */
function SourceMissNotice({ group: { source, status } }: Props) {
  const isLocked = status === MOCK_GROUP_STATUS.LOCKED;

  return (
    <EmptyState
      icon={<WarningCircleIcon />}
      title={`${source.title}: ${getMissReasonLabel(status)}`}
      description="Подборки этого источника сейчас не получить — попробуйте позже или выберите другой."
    >
      <EmptyState.Actions>
        {isLocked ? (
          <Button
            component={Link}
            to={SOURCE_ACCOUNTS_PATH}
            variant="default"
            leftSection={<SignInIcon />}
          >
            Войти в {source.title}
          </Button>
        ) : (
          <Button variant="default" leftSection={<ArrowClockwiseIcon />}>
            Повторить запрос подборок
          </Button>
        )}
      </EmptyState.Actions>
    </EmptyState>
  );
}

export default SourceMissNotice;
