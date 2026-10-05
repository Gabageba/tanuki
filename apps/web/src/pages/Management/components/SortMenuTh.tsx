import { Group, type MantineStyleProps, Menu, Table, Text, UnstyledButton } from '@mantine/core';
import { SORT_DIRECTION, type SortDirection } from '@tanuki/contracts';
import MidDotGroup from '@/shared/ui/MidDotGroup';
import type { SortKeyOption } from '../models';
import SortCaretsIcon from './SortCaretsIcon';

type Props<Sort extends string> = {
  title: string;
  options: SortKeyOption<Sort>[];
  activeSort: Sort;
  direction: SortDirection;
  onSortChange: (sort: Sort) => void;
  w?: MantineStyleProps['w'];
};

/** Заголовок столбца с двумя значениями в ячейке: открывает меню ключей. У активного столбца
 *  выбранный ключ стоит серым в той же строке — «Даты · регистрация»; направление — только
 *  двойной кареткой, у заголовка и у пунктов меню. */
function SortMenuTh<Sort extends string>({
  title,
  options,
  activeSort,
  direction,
  onSortChange,
  w,
}: Props<Sort>) {
  const active = options.find((option) => option.sort === activeSort);
  const isAscending = direction === SORT_DIRECTION.ASC;

  return (
    <Table.Th w={w} aria-sort={active ? (isAscending ? 'ascending' : 'descending') : undefined}>
      <Menu position="bottom-start">
        <Menu.Target>
          <UnstyledButton fz="inherit" fw="inherit">
            <Group gap={4} wrap="nowrap">
              <MidDotGroup
                truncate
                separatorProps={{ c: 'dimmed', fw: 400, fz: 12 }}
                items={[
                  title,
                  active && (
                    <Text span inherit c="dimmed" fw={400} tt="lowercase">
                      {active.label}
                    </Text>
                  ),
                ]}
              />
              <SortCaretsIcon direction={active ? direction : null} />
            </Group>
          </UnstyledButton>
        </Menu.Target>
        <Menu.Dropdown>
          {options.map((option) => (
            <Menu.Item
              key={option.sort}
              leftSection={option.icon}
              rightSection={
                <SortCaretsIcon direction={option.sort === activeSort ? direction : null} />
              }
              fw={option.sort === activeSort ? 600 : undefined}
              onClick={() => onSortChange(option.sort)}
            >
              {option.menuLabel}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
    </Table.Th>
  );
}

export default SortMenuTh;
