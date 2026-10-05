import { Group, UnstyledButton } from '@mantine/core';
import SortCaretsIcon from '../../InvitesTable/components/SortCaretsIcon';
import type { SortKeyOption, SortState } from '../models';

type Props<Key extends string> = {
  option: SortKeyOption<Key>;
  label: string;
  sort: SortState<Key>;
  onSortChange: (option: SortKeyOption<Key>) => void;
};

/** Подпись и двойная каретка — как `SortableTh` в «Управлении», но без своей ячейки: в K1 таких
 *  кнопок в заголовке несколько. */
function SortKeyButton<Key extends string>({ option, label, sort, onSortChange }: Props<Key>) {
  return (
    <UnstyledButton fz="inherit" fw="inherit" onClick={() => onSortChange(option)}>
      <Group gap={4} wrap="nowrap">
        {label}
        <SortCaretsIcon direction={sort.key === option.key ? sort.direction : null} />
      </Group>
    </UnstyledButton>
  );
}

export default SortKeyButton;
