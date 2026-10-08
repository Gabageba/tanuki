import { Group, Text } from '@mantine/core';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { getMissReasonLabel } from '../lib';
import { MOCK_GROUP_STATUS, type MissedGroup } from '../models';
import LoginLink from './LoginLink';

type Props = {
  group: MissedGroup;
};

/** Строка N4: логотип и название слева, причина и «Войти» справа. */
function MissedRow({ group: { source, status } }: Props) {
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
          {getMissReasonLabel(status)}
        </Text>
        {status === MOCK_GROUP_STATUS.LOCKED && (
          <Text fz="sm">
            <LoginLink />
          </Text>
        )}
      </Group>
    </Group>
  );
}

export default MissedRow;
