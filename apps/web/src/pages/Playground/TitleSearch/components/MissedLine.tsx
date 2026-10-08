import { Fragment } from 'react';
import { Group, Text } from '@mantine/core';
import MidDot from '@/shared/ui/MidDot';
import { getMissReasonLabel } from '../lib';
import { MOCK_GROUP_STATUS, type MissedGroup } from '../models';
import LoginLink from './LoginLink';
import RetryButton from './RetryButton';

type Props = {
  missed: MissedGroup[];
};

/** N1 — одна приглушённая строка через точку, «Повторить» в конце. */
function MissedLine({ missed }: Props) {
  return (
    <Group gap="sm" justify="space-between" wrap="nowrap" align="flex-start">
      <Text c="dimmed" fz="sm" lh={1.6}>
        Не ответили:{' '}
        {missed.map(({ source, status }, index) => (
          <Fragment key={source.id}>
            <Text span inherit c="var(--mantine-color-text)">
              {source.title}
            </Text>
            {' — '}
            {getMissReasonLabel(status)}
            {status === MOCK_GROUP_STATUS.LOCKED && (
              <>
                , <LoginLink />
              </>
            )}
            {index < missed.length - 1 && <MidDot mx={6} />}
          </Fragment>
        ))}
      </Text>
      <RetryButton />
    </Group>
  );
}

export default MissedLine;
