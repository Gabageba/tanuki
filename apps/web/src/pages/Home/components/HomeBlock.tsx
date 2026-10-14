import type { ReactNode } from 'react';
import { Card, Group, Title } from '@mantine/core';
import ArrowLink from '@/shared/ui/ArrowLink';

type Props = {
  title: string;
  /** Ссылка справа со стрелкой — «Все закладки →». */
  link?: { label: string; to: string };
  children: ReactNode;
};

/**
 * Блок главной в карточке — как плитки-входы. Шапка (заголовок слева, ссылка со стрелкой справа)
 * отделена от содержимого линией.
 */
function HomeBlock({ title, link, children }: Props) {
  return (
    <Card withBorder radius="lg" p="md" miw={0}>
      <Card.Section withBorder inheritPadding py="sm">
        <Group justify="space-between" wrap="nowrap" gap="sm">
          <Title order={4} miw={0}>
            {title}
          </Title>
          {link && <ArrowLink to={link.to}>{link.label}</ArrowLink>}
        </Group>
      </Card.Section>
      <Card.Section inheritPadding py="md">
        {children}
      </Card.Section>
    </Card>
  );
}

export default HomeBlock;
