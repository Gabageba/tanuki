import { Badge, Group, Stack, Text } from '@mantine/core';
import SortCaretsIcon from '../../InvitesTable/components/SortCaretsIcon';
import { SORT_PICKER, type SortKeyOption, type SortPicker, type SortState } from '../models';
import DirectionArrow from './DirectionArrow';

type Props<Key extends string> = {
  title: string;
  /** Выбранный ключ этого столбца; undefined — столбец не активен. */
  active: SortKeyOption<Key> | undefined;
  picker: SortPicker;
  sort: SortState<Key>;
};

/** Что написано на кнопке меню: у неактивного столбца — название и каретка, у активного — ещё и
 *  выбранный ключ, в подаче своего варианта. */
function SortMenuTitle<Key extends string>({ title, active, picker, sort }: Props<Key>) {
  const carets = <SortCaretsIcon direction={active ? sort.direction : null} />;

  if (!active) {
    return (
      <Group gap={4} wrap="nowrap">
        {title}
        {carets}
      </Group>
    );
  }

  switch (picker) {
    case SORT_PICKER.CURRENT:
    case SORT_PICKER.SPLIT:
    case SORT_PICKER.MENU:
      return (
        <Group gap={4} wrap="nowrap">
          {title}
          {carets}
        </Group>
      );
    case SORT_PICKER.MENU_LABEL:
      return (
        <Stack gap={0}>
          <Group gap={4} wrap="nowrap">
            {title}
            {carets}
          </Group>
          <Group gap={2} wrap="nowrap">
            <Text fz="xs" fw={400} c="dimmed">
              {active.shortLabel}
            </Text>
            <DirectionArrow
              direction={sort.direction}
              size={11}
              color="var(--mantine-color-dimmed)"
            />
          </Group>
        </Stack>
      );
    case SORT_PICKER.MENU_INLINE:
    case SORT_PICKER.FINAL:
      return (
        <Group gap={4} wrap="nowrap">
          {title}
          <Text span inherit c="dimmed" fw={400}>
            · {active.keyLabel}
          </Text>
          {carets}
        </Group>
      );
    case SORT_PICKER.MENU_KEY:
      return (
        <Group gap={4} wrap="nowrap">
          {active.label}
          {carets}
        </Group>
      );
    case SORT_PICKER.MENU_CHIP:
      return (
        <Group gap={6} wrap="nowrap">
          {title}
          <Badge size="xs" variant="muted" color="gray" fw={500} tt="none">
            {active.keyLabel}
          </Badge>
          {carets}
        </Group>
      );
    case SORT_PICKER.MENU_COLON:
      return (
        <Group gap={4} wrap="nowrap">
          <Text span inherit>
            {title}:{' '}
            <Text span inherit fw={400}>
              {active.keyLabel}
            </Text>
          </Text>
          {carets}
        </Group>
      );
  }
}

export default SortMenuTitle;
