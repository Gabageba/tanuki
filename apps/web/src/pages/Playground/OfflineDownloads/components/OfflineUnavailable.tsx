import { Button, EmptyState } from '@mantine/core';
import { CloudSlashIcon, TrayArrowDownIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { getUnavailableReason, getUnavailableTitle } from '../lib';
import type { UnavailablePlace } from '../models';

type Props = {
  place: UnavailablePlace;
  /** U1 — ведёт в «Загрузки»; U2 — обещает открыться само. */
  withDownloadsLink: boolean;
};

/** Страница тайтла не в кеше или не скачанная глава в читалке, когда нет сети. */
function OfflineUnavailable({ place, withDownloadsLink }: Props) {
  const reason = getUnavailableReason(place);

  return (
    <EmptyState
      title={getUnavailableTitle(place)}
      description={withDownloadsLink ? reason : `${reason}. Откроется само, когда появится сеть`}
      icon={<CloudSlashIcon />}
    >
      {withDownloadsLink && (
        <EmptyState.Actions>
          <Button component={Link} to="#" variant="default" leftSection={<TrayArrowDownIcon />}>
            Открыть загрузки
          </Button>
        </EmptyState.Actions>
      )}
    </EmptyState>
  );
}

export default OfflineUnavailable;
