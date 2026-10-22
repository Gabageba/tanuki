import { Button, EmptyState } from '@mantine/core';
import { CloudSlashIcon, TrayArrowDownIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ROUTE_PATHS } from '@/shared/lib/routes';

type Props = {
  /** По умолчанию «Нет сети». */
  title?: string;
  description?: string;
};

/** Без сети открыть нечем (U1): страница не в кеше или глава не скачана. Ведёт в «Загрузки» —
 *  «откроется само» в самолёте было бы тупиком. */
function OfflineEmptyState({ title, description }: Props) {
  const { t } = useTranslation();

  return (
    <EmptyState title={title ?? t('noNetwork')} description={description} icon={<CloudSlashIcon />}>
      <EmptyState.Actions>
        <Button
          component={Link}
          to={ROUTE_PATHS.DOWNLOADS}
          variant="default"
          leftSection={<TrayArrowDownIcon />}
        >
          {t('openDownloads')}
        </Button>
      </EmptyState.Actions>
    </EmptyState>
  );
}

export default OfflineEmptyState;
