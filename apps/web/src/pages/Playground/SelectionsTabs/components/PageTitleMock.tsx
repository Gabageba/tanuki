import type { ReactNode } from 'react';
import { Group, Title } from '@mantine/core';
import GoBackButton from '@/shared/ui/GoBackButton';
import { ROUTE_PATHS } from '@/shared/lib/routes';

type Props = {
  /** M2 — справа в строке заголовка, как `actions` у `PageLayout.Content`. */
  rightSection?: ReactNode;
};

/** Строка заголовка страницы «Подборки» — как её рисует `PageLayout.Content`. */
function PageTitleMock({ rightSection }: Props) {
  return (
    <Group justify="space-between" wrap="nowrap" gap="sm">
      <Group gap="xs" wrap="nowrap" flex="none">
        <GoBackButton path={ROUTE_PATHS.HOME} />
        <Title order={2}>Подборки</Title>
      </Group>
      {rightSection}
    </Group>
  );
}

export default PageTitleMock;
