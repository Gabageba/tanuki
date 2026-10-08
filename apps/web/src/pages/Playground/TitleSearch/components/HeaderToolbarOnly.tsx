import type { ReactNode } from 'react';
import { Group } from '@mantine/core';
import PageToolbar from './PageToolbar';

type Props = {
  filtersCount: number;
  /** Пилюли фильтров — встают слева, на место заголовка. */
  children?: ReactNode;
};

/** H3 — без заголовка: запрос виден только в строке шапки, страница начинается с тулбара. */
function HeaderToolbarOnly({ filtersCount, children }: Props) {
  return (
    <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
      <Group miw={0} flex={1}>
        {children}
      </Group>
      <PageToolbar filtersCount={filtersCount} />
    </Group>
  );
}

export default HeaderToolbarOnly;
