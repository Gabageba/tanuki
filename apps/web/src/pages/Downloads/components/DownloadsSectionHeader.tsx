import type { ReactNode } from 'react';
import { Flex, Group, Text, Title } from '@mantine/core';

type Props = {
  title: string;
  /** Счётчик или объём рядом с заголовком — моноширинным. */
  meta: ReactNode;
  action: ReactNode;
};

/** Шапка вкладки «Загрузок»: заголовок со счётчиком и действие справа; на телефоне действие уходит
 *  под заголовок и тянется во всю ширину. */
function DownloadsSectionHeader({ title, meta, action }: Props) {
  return (
    <Flex
      direction={{ base: 'column', xs: 'row' }}
      justify="space-between"
      align={{ base: 'stretch', xs: 'center' }}
      gap="sm"
    >
      <Group gap="xs">
        <Title order={4}>{title}</Title>
        <Text c="dimmed" ff="monospace" fz="sm">
          {meta}
        </Text>
      </Group>
      {action}
    </Flex>
  );
}

export default DownloadsSectionHeader;
