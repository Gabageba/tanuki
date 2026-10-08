import type { ReactNode } from 'react';
import { Card, Group } from '@mantine/core';
import type { Source } from '@tanuki/contracts';
import SourceTitle from '@/entities/source/components/SourceTitle';
import AllResultsLink from './AllResultsLink';

type Props = {
  source: Source;
  children: ReactNode;
};

/** S4 — секция в рамке: шапка-полоса с названием и ссылкой, карточки внутри. */
function SectionCard({ source, children }: Props) {
  return (
    <Card withBorder p={0} radius="md">
      <Card.Section withBorder inheritPadding px="md" py="xs" bg="var(--tanuki-color-surface)">
        <Group justify="space-between" wrap="nowrap" gap="sm">
          <SourceTitle source={source} />
          <AllResultsLink source={source} />
        </Group>
      </Card.Section>
      <Card.Section p="md">{children}</Card.Section>
    </Card>
  );
}

export default SectionCard;
