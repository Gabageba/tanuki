import { Menu, UnstyledButton } from '@mantine/core';
import SortCaretsIcon from '../../InvitesTable/components/SortCaretsIcon';
import {
  SORT_PICKER,
  type SortColumn,
  type SortKeyOption,
  type SortPicker,
  type SortState,
} from '../models';
import DirectionArrow from './DirectionArrow';
import SortMenuTitle from './SortMenuTitle';

type Props<Key extends string> = {
  column: SortColumn<Key>;
  sort: SortState<Key>;
  onSortChange: (option: SortKeyOption<Key>) => void;
  /** Как на кнопке показан выбранный ключ — K2a…K2f. */
  picker: SortPicker;
};

/** Заголовок открывает список ключей; выбранный отмечен стрелкой направления, повторный выбор её
 *  переворачивает. */
function SortMenu<Key extends string>({ column, sort, onSortChange, picker }: Props<Key>) {
  const active = column.keys.find((option) => option.key === sort.key);

  return (
    <Menu position="bottom-start" withinPortal>
      <Menu.Target>
        <UnstyledButton fz="inherit" fw="inherit">
          <SortMenuTitle title={column.title} active={active} picker={picker} sort={sort} />
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        {column.keys.map((option) => (
          <Menu.Item
            key={option.key}
            leftSection={option.icon}
            rightSection={
              picker === SORT_PICKER.FINAL ? (
                <SortCaretsIcon direction={option.key === sort.key ? sort.direction : null} />
              ) : (
                option.key === sort.key && <DirectionArrow direction={sort.direction} size={14} />
              )
            }
            fw={option.key === sort.key ? 600 : undefined}
            onClick={() => onSortChange(option)}
          >
            {option.menuLabel}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}

export default SortMenu;
