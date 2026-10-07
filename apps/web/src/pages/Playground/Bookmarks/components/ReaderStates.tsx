import { Group } from '@mantine/core';
import type { ReaderVariant } from '../models';
import ReaderBarMock from './ReaderBarMock';
import VariantState from './VariantState';

type Props = {
  variant: ReaderVariant;
};

const STATES = [
  { label: 'Не в закладках', folderId: null },
  { label: 'В «Читаю»', folderId: 'reading' },
  { label: 'В «Любимое»', folderId: 'favorites' },
];

/** Панель читалки с кнопкой закладки в трёх состояниях. */
function ReaderStates({ variant }: Props) {
  return (
    <Group gap="xl" align="flex-start">
      {STATES.map(({ label, folderId }) => (
        <VariantState key={label} label={label}>
          <ReaderBarMock variant={variant} initialFolderId={folderId} />
        </VariantState>
      ))}
    </Group>
  );
}

export default ReaderStates;
