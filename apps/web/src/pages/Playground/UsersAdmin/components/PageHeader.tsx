import type { ReactNode } from 'react';
import { Group, Title } from '@mantine/core';
import GoBackButton from '@/shared/ui/GoBackButton';

type Props = {
  title: string;
  withGoBack?: boolean;
  actions?: ReactNode;
};

/** Шапка как у PageLayout.Content: назад, заголовок, действия справа. */
function PageHeader({ title, withGoBack = false, actions }: Props) {
  return (
    <Group justify="space-between" gap="sm">
      <Group gap="xs">
        {withGoBack && <GoBackButton onClick={() => undefined} />}
        <Title order={2}>{title}</Title>
      </Group>
      {actions}
    </Group>
  );
}

export default PageHeader;
