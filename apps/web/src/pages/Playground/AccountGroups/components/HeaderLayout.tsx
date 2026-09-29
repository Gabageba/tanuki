import type { ReactNode } from 'react';
import { Group, Stack } from '@mantine/core';

type Props = {
  icon: ReactNode;
  title: ReactNode;
  description: ReactNode;
  action: ReactNode;
  bg?: string;
};

/** Раскладка шапки для макетов H1–H6: как у строки GroupedList, но с фоном и отступом побольше. */
function HeaderLayout({ icon, title, description, action, bg }: Props) {
  return (
    <Group justify="space-between" gap="md" wrap="nowrap" px="md" py="sm" bg={bg}>
      <Group gap="md" wrap="nowrap" flex={1} miw={0}>
        {icon}
        <Stack gap={6} miw={0}>
          {title}
          {description}
        </Stack>
      </Group>
      {action}
    </Group>
  );
}

export default HeaderLayout;
