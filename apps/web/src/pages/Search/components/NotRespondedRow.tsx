import { Anchor, Group, Text } from '@mantine/core';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { SEARCH_GROUP_STATUS } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { SOURCE_ACCOUNTS_PATH } from '@/shared/lib/routes';
import { getMissReasonLabel } from '@/entities/source/lib';
import type { MissedGroup } from '../models';

type Props = {
  group: MissedGroup;
};

/** Источник, который не ответил: логотип и название слева, причина и «Войти» справа. */
function NotRespondedRow({ group: { source, status } }: Props) {
  const { t } = useTranslation();

  return (
    <Group justify="space-between" px="md" py={8} wrap="nowrap" gap="sm">
      <Group gap="xs" wrap="nowrap" miw={0}>
        <SourceIcon id={source.id} title={source.title} size={24} />
        <Text fz="sm" truncate>
          {source.title}
        </Text>
      </Group>
      <Group gap="xs" wrap="nowrap" flex="none">
        <Text fz="sm" c="dimmed">
          {getMissReasonLabel(status, t)}
        </Text>
        {status === SEARCH_GROUP_STATUS.LOCKED && (
          <Anchor component={Link} to={SOURCE_ACCOUNTS_PATH} fz="sm">
            {t('logIn')}
          </Anchor>
        )}
      </Group>
    </Group>
  );
}

export default NotRespondedRow;
