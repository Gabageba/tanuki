import { Chip, Group, Scroller } from '@mantine/core';
import { getCategoryIcon, getCategoryLabel } from '../lib';
import type { MockCategory } from '../models';

type Props = {
  categories: MockCategory[];
  selected: MockCategory[];
  onChange: (selected: MockCategory[]) => void;
};

/** F2: чипы с мультивыбором в одну строку, на узком экране — горизонтальный скролл. */
function FilterChips({ categories, selected, onChange }: Props) {
  return (
    <Scroller flex={1} miw={0}>
      <Chip.Group
        multiple
        value={selected}
        onChange={(next) => onChange(categories.filter((category) => next.includes(category)))}
      >
        <Group gap="xs" wrap="nowrap">
          {categories.map((category) => (
            <Chip key={category} value={category} variant="light" size="sm">
              <Group gap={6} wrap="nowrap" component="span">
                {getCategoryIcon(category, 14)}
                {getCategoryLabel(category)}
              </Group>
            </Chip>
          ))}
        </Group>
      </Chip.Group>
    </Scroller>
  );
}

export default FilterChips;
