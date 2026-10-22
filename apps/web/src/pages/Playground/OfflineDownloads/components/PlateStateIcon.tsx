import { RingProgress } from '@mantine/core';
import { CheckCircleIcon, PauseCircleIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { PLATE_PROGRESS } from '../lib';
import { PLATE_STATE, type PlateState } from '../models';

type Props = {
  state: PlateState;
  size?: number;
};

/** Значок состояния загрузок тайтла: те же знаки, что у строки главы (C1). */
function PlateStateIcon({ state, size = 16 }: Props) {
  switch (state) {
    case PLATE_STATE.DONE:
      return <CheckCircleIcon size={size} weight="fill" color="var(--mantine-color-teal-filled)" />;
    case PLATE_STATE.DOWNLOADING:
      return (
        <RingProgress
          size={size + 2}
          thickness={2}
          roundCaps
          sections={[{ value: PLATE_PROGRESS, color: 'var(--mantine-primary-color-filled)' }]}
        />
      );
    case PLATE_STATE.PAUSED:
      return <PauseCircleIcon size={size} color="var(--mantine-color-dimmed)" />;
    case PLATE_STATE.FAILED:
      return (
        <WarningCircleIcon size={size} weight="fill" color="var(--mantine-color-red-filled)" />
      );
  }
}

export default PlateStateIcon;
