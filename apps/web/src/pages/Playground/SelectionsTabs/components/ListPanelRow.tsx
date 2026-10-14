import type { ReactNode } from 'react';
import { Box, Group, Stack } from '@mantine/core';

type Props = {
  /** Фильтры блока (период); у блока без фильтров — null, строка остаётся. */
  filters: ReactNode;
  /** Справа: каталог и вид. */
  actions: ReactNode;
  isPhone: boolean;
  /** Итог: на телефоне фильтры не уходят отдельной строкой — тянутся на всю ширину, действия
   *  справа в той же строке. */
  isSingleRowOnPhone?: boolean;
};

/**
 * Ось H — панель над сеткой, как строка управления в каталоге: фильтры блока слева, вид и каталог
 * справа. На телефоне с фильтрами — две строки: фильтры (листаются), под ними действия.
 */
function ListPanelRow({ filters, actions, isPhone, isSingleRowOnPhone = false }: Props) {
  if (isPhone && filters && !isSingleRowOnPhone) {
    return (
      <Stack gap="sm">
        {filters}
        <Group justify="flex-end" gap="sm" wrap="nowrap">
          {actions}
        </Group>
      </Stack>
    );
  }

  return (
    <Group justify="space-between" wrap="nowrap" gap="md">
      <Box flex={1} miw={0}>
        {filters}
      </Box>
      <Group gap="sm" wrap="nowrap" flex="none">
        {actions}
      </Group>
    </Group>
  );
}

export default ListPanelRow;
