import { Button, Group, Paper, Progress, Stack, Text } from '@mantine/core';
import { TrayArrowDownIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { getPlatePhrase, getPlateSize, PLATE_PROGRESS } from '../lib';
import { PLATE_STATE, type PlateState } from '../models';
import PlateStateIcon from './PlateStateIcon';

type Props = {
  state: PlateState;
};

/** B3 — заметный блок с рамкой: что скачано, прогресс и явная кнопка в «Загрузки». */
function PlateCard({ state }: Props) {
  const isActive = state === PLATE_STATE.DOWNLOADING || state === PLATE_STATE.PAUSED;

  return (
    <Paper withBorder radius="md" p="sm">
      <Stack gap="xs">
        <Group gap="xs" wrap="nowrap">
          <PlateStateIcon state={state} size={20} />
          <Stack gap={0} flex={1} miw={0}>
            <Text fz="sm" c={state === PLATE_STATE.FAILED ? 'red' : undefined}>
              {getPlatePhrase(state)}
            </Text>
            <Text fz={12} c="dimmed" ff="monospace">
              {getPlateSize(state)}
            </Text>
          </Stack>
        </Group>
        {isActive && (
          <Progress
            size="sm"
            value={PLATE_PROGRESS}
            color={state === PLATE_STATE.PAUSED ? 'gray' : undefined}
          />
        )}
        <Button
          component={Link}
          to="#"
          variant="default"
          size="xs"
          fullWidth
          leftSection={<TrayArrowDownIcon />}
        >
          Открыть загрузки
        </Button>
      </Stack>
    </Paper>
  );
}

export default PlateCard;
