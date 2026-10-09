import { useState } from 'react';
import { Collapse, Divider, Group, Paper, Stack, Text, UnstyledButton } from '@mantine/core';
import { CaretDownIcon, CaretUpIcon, WarningCircleIcon } from '@phosphor-icons/react';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { getMissReasonLabel } from '../lib';
import { MOCK_GROUP_STATUS, type MissedGroup } from '../models';
import LoginLink from './LoginLink';
import MissedRow from './MissedRow';
import RetryButton from './RetryButton';

type Props = {
  missed: MissedGroup[];
  /** N5 — раскрытый список строками N4, с разделителями. */
  withRows?: boolean;
  /** Раскрыт сразу — чтобы в макете было видно содержимое. */
  defaultOpened?: boolean;
};

/** N3/N5 — свёрнутый блок «Не ответили 4 источника»; причины — по раскрытию. */
function MissedCollapse({ missed, withRows = false, defaultOpened = false }: Props) {
  const [isOpened, setIsOpened] = useState(defaultOpened);

  return (
    <Paper withBorder radius="md">
      <Group justify="space-between" wrap="nowrap" gap="sm" px="md" py="xs">
        <UnstyledButton onClick={() => setIsOpened((prev) => !prev)} miw={0}>
          <Group gap="xs" wrap="nowrap">
            <WarningCircleIcon size={18} color="var(--mantine-color-dimmed)" />
            <Text fz="sm">Не ответили {missed.length} источника</Text>
            {isOpened ? <CaretUpIcon /> : <CaretDownIcon />}
          </Group>
        </UnstyledButton>
        <RetryButton />
      </Group>
      <Collapse expanded={isOpened}>
        {withRows ? (
          <Stack gap={0}>
            {missed.map((group) => (
              <Stack key={group.source.id} gap={0}>
                <Divider />
                <MissedRow group={group} />
              </Stack>
            ))}
          </Stack>
        ) : (
          <Stack gap={6} pb="xs" px="md" pl={42}>
            {missed.map(({ source, status }) => (
              <Group key={source.id} gap="xs" wrap="nowrap">
                <SourceIcon id={source.id} title={source.title} size={18} />
                <Text fz="sm">{source.title}</Text>
                <Text fz="sm" c="dimmed">
                  {getMissReasonLabel(status)}
                </Text>
                {status === MOCK_GROUP_STATUS.LOCKED && (
                  <Text fz="sm">
                    <LoginLink />
                  </Text>
                )}
              </Group>
            ))}
          </Stack>
        )}
      </Collapse>
    </Paper>
  );
}

export default MissedCollapse;
