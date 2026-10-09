import { Button, EmptyState } from '@mantine/core';
import { BellSimpleSlashIcon, FunnelXIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

type Props = {
  isEmpty: boolean;
  /** Выбран фильтр: пусто именно в нём, а не во всей ленте. */
  isFiltered: boolean;
  onResetFilter: () => void;
};

/** Пустая лента или фильтр, под который ничего не подошло; при непустом списке ничего не рисует. */
function NotificationsEmpty({ isEmpty, isFiltered, onResetFilter }: Props) {
  const { t } = useTranslation();

  if (!isEmpty) return null;

  if (isFiltered) {
    return (
      <EmptyState
        title={t('nothingInThisCategory')}
        description={t('readItemsDisappearSoOnlyNewOnesHere')}
        icon={<FunnelXIcon />}
      >
        <EmptyState.Actions>
          <Button variant="default" leftSection={<FunnelXIcon />} onClick={onResetFilter}>
            {t('resetFilter')}
          </Button>
        </EmptyState.Actions>
      </EmptyState>
    );
  }

  return (
    <EmptyState
      title={t('noNewNotifications')}
      description={t('newChaptersAndAccountEventsAppearHere')}
      icon={<BellSimpleSlashIcon />}
    />
  );
}

export default NotificationsEmpty;
