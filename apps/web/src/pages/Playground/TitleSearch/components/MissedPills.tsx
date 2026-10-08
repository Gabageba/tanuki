import { Group, Pill, Text } from '@mantine/core';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { getMissReasonLabel } from '../lib';
import { MOCK_GROUP_STATUS, type MissedGroup } from '../models';
import LoginLink from './LoginLink';
import RetryButton from './RetryButton';

type Props = {
  missed: MissedGroup[];
};

/** N2 — подпись и пилюля на каждый источник: иконка, название, причина. */
function MissedPills({ missed }: Props) {
  return (
    <Group gap="xs">
      <Text c="dimmed" fz="sm">
        Не ответили
      </Text>
      {missed.map(({ source, status }) => (
        <Pill key={source.id} variant="muted" size="md">
          <Group gap={6} wrap="nowrap">
            <SourceIcon id={source.id} title={source.title} size={16} />
            <Text span fz="sm">
              {source.title}
            </Text>
            <Text span fz="sm" c="dimmed">
              {getMissReasonLabel(status)}
            </Text>
            {status === MOCK_GROUP_STATUS.LOCKED && (
              <Text span fz="sm">
                <LoginLink />
              </Text>
            )}
          </Group>
        </Pill>
      ))}
      <RetryButton />
    </Group>
  );
}

export default MissedPills;
