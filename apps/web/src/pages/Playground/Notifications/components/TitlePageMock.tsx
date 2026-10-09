import type { ReactNode } from 'react';
import { Group, Skeleton, Stack } from '@mantine/core';

type Props = {
  /** Предложение над контентом страницы. */
  banner: ReactNode;
};

/** Контекст для баннера: верх страницы тайтла (обложка и строки текста серыми блоками). */
function TitlePageMock({ banner }: Props) {
  return (
    <Stack gap="md">
      {banner}
      <Group wrap="nowrap" align="flex-start" gap="md">
        <Skeleton w={96} h={128} flex="none" />
        <Stack gap="xs" flex={1}>
          <Skeleton h={22} w="70%" />
          <Skeleton h={12} w="40%" />
          <Skeleton h={12} />
          <Skeleton h={12} w="85%" />
        </Stack>
      </Group>
    </Stack>
  );
}

export default TitlePageMock;
