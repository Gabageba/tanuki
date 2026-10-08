import { Checkbox, SimpleGrid } from '@mantine/core';
import type { SearchFilterGroup } from '../models';

type Props = {
  group: SearchFilterGroup;
  value: string[];
  onChange: (value: string[]) => void;
  cols: number;
};

/** Чекбоксы группы в две колонки (на телефоне — в одну), как `VirtualizedCheckboxGrid`:
 *  обрезка длинных подписей, цвет акцента. Вариантов мало — без виртуализации. */
function CatalogOptionsGrid({ group, value, onChange, cols }: Props) {
  return (
    <SimpleGrid cols={cols} spacing={0} verticalSpacing={0}>
      {group.options.map((option) => (
        <Checkbox
          key={option.value}
          h={44}
          color="terracotta"
          label={option.label}
          title={option.label}
          checked={value.includes(option.value)}
          onChange={() =>
            onChange(
              value.includes(option.value)
                ? value.filter((item) => item !== option.value)
                : [...value, option.value],
            )
          }
          styles={{
            labelWrapper: { flex: 1, minWidth: 0 },
            label: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
          }}
        />
      ))}
    </SimpleGrid>
  );
}

export default CatalogOptionsGrid;
