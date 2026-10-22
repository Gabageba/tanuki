import { Group, Progress, Stack, Text, UnstyledButton } from '@mantine/core';
import { CaretRightIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { getPlatePhrase, getPlateSize, PLATE_PROGRESS } from '../lib';
import { PLATE_STATE, type PlateState } from '../models';
import PlateStateIcon from './PlateStateIcon';
import styles from '../OfflineDownloads.module.scss';

type Props = {
  state: PlateState;
};

/** B1 — та же мелкая строка под кнопками, но ссылкой на тайтл в «Загрузках»; пока качается —
 *  тонкая полоса прогресса под ней. */
function PlateLine({ state }: Props) {
  const isActive = state === PLATE_STATE.DOWNLOADING || state === PLATE_STATE.PAUSED;

  return (
    <UnstyledButton component={Link} to="#" px={10} py={4} className={styles.row}>
      <Stack gap={6}>
        <Group gap={8} wrap="nowrap">
          <PlateStateIcon state={state} />
          <Text fz={12} c={state === PLATE_STATE.FAILED ? 'red' : 'dimmed'} flex={1}>
            {getPlatePhrase(state)}
            <Text span fz={12} c="dimmed" ff="monospace">
              {' · '}
              {getPlateSize(state)}
            </Text>
          </Text>
          <CaretRightIcon size={12} color="var(--mantine-color-dimmed)" />
        </Group>
        {isActive && (
          <Progress
            size={2}
            value={PLATE_PROGRESS}
            color={state === PLATE_STATE.PAUSED ? 'gray' : undefined}
          />
        )}
      </Stack>
    </UnstyledButton>
  );
}

export default PlateLine;
