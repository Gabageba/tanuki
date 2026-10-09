import { Button, EmptyState } from '@mantine/core';
import { BellSimpleSlashIcon, BookmarkSimpleIcon, FunnelXIcon } from '@phosphor-icons/react';
import { EMPTY, EMPTY_REASON, type Empty, type EmptyReason } from '../models';

type Props = {
  variant: Empty;
  reason: EmptyReason;
  onReset?: () => void;
};

/** Пустая лента или фильтр, под который ничего не подошло. */
function FeedEmpty({ variant, reason, onReset }: Props) {
  const isByReason = variant === EMPTY.BY_REASON || variant === EMPTY.BY_REASON_NO_LINK;

  if (isByReason && reason === EMPTY_REASON.FILTER) {
    return (
      <EmptyState
        title="В этой категории ничего нет"
        description="Прочитанное из ленты исчезает, поэтому здесь только новое"
        icon={<FunnelXIcon />}
      >
        <EmptyState.Actions>
          <Button variant="default" leftSection={<FunnelXIcon />} onClick={onReset}>
            Сбросить фильтр
          </Button>
        </EmptyState.Actions>
      </EmptyState>
    );
  }

  if (variant === EMPTY.PLAIN) {
    return <EmptyState title="Новых уведомлений нет" icon={<BellSimpleSlashIcon />} />;
  }

  if (variant === EMPTY.BY_REASON_NO_LINK) {
    return (
      <EmptyState
        title="Новых уведомлений нет"
        description="Здесь появятся новые главы из закладок и важные события аккаунта"
        icon={<BellSimpleSlashIcon />}
      />
    );
  }

  return (
    <EmptyState
      title="Новых уведомлений нет"
      description="Здесь появятся новые главы из закладок и важные события аккаунта"
      icon={<BellSimpleSlashIcon />}
    >
      <EmptyState.Actions>
        <Button variant="default" leftSection={<BookmarkSimpleIcon />}>
          Перейти в закладки
        </Button>
      </EmptyState.Actions>
    </EmptyState>
  );
}

export default FeedEmpty;
