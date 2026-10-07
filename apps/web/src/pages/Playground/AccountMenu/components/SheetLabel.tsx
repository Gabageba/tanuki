import { Text } from '@mantine/core';

type Props = {
  children: string;
};

/** Подпись раздела мобильного меню — как Menu.Label. */
function SheetLabel({ children }: Props) {
  return (
    <Text fz="xs" fw={500} c="dimmed" px="sm" py="calc(var(--mantine-spacing-xs) / 2)">
      {children}
    </Text>
  );
}

export default SheetLabel;
