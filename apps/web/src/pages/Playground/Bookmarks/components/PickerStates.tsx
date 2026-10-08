import { Group } from '@mantine/core';
import type { PickerVariant } from '../models';
import TitleActionsMock from './TitleActionsMock';
import VariantState from './VariantState';

type Props = {
  variant: PickerVariant;
};

const STATES = [
  { label: 'Не в закладках', folderId: null, defaultOpened: false },
  { label: 'В папке «Читаю»', folderId: 'reading', defaultOpened: false },
  { label: 'Список открыт', folderId: 'favorites', defaultOpened: true },
];

/** «В закладки» на странице тайтла в трёх состояниях. */
function PickerStates({ variant }: Props) {
  return (
    <Group gap="xl" align="flex-start">
      {STATES.map(({ label, folderId, defaultOpened }) => (
        <VariantState key={label} label={label} mb={defaultOpened ? 300 : undefined}>
          <TitleActionsMock
            variant={variant}
            initialFolderId={folderId}
            defaultOpened={defaultOpened}
          />
        </VariantState>
      ))}
    </Group>
  );
}

export default PickerStates;
