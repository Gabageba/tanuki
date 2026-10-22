import { ActionIcon, Tooltip } from '@mantine/core';
import { Link } from 'react-router';
import { getPlatePhrase, getPlateSize } from '../lib';
import type { PlateState } from '../models';
import PlateStateIcon from './PlateStateIcon';

type Props = {
  state: PlateState;
};

/** B2 — квадратная кнопка в ряду с выбором папки и «…»: значок состояния, числа в подсказке,
 *  клик ведёт к тайтлу в «Загрузках». */
function PlateButton({ state }: Props) {
  return (
    <Tooltip label={`${getPlatePhrase(state)} · ${getPlateSize(state)}`}>
      <ActionIcon
        component={Link}
        to="#"
        size={36}
        variant="default"
        aria-label="Открыть загрузки тайтла"
      >
        <PlateStateIcon state={state} size={18} />
      </ActionIcon>
    </Tooltip>
  );
}

export default PlateButton;
