import type { ReactNode } from 'react';
import { Anchor, Group, Title } from '@mantine/core';
import { Link } from 'react-router';
import { ArrowRightIcon } from '@phosphor-icons/react';

type Props = {
  title: ReactNode;
  /** Ссылка справа: «Все закладки →», «Открыть подборки →». */
  link?: { label: string; to: string };
};

/** Заголовок блока главной: название слева, ссылка со стрелкой справа. */
function HomeBlockHeading({ title, link }: Props) {
  return (
    <Group justify="space-between" wrap="nowrap" gap="sm">
      <Title order={4} miw={0}>
        {title}
      </Title>
      {link && (
        <Anchor component={Link} to={link.to} fz="sm" flex="none">
          <Group gap={4} wrap="nowrap">
            {link.label}
            <ArrowRightIcon />
          </Group>
        </Anchor>
      )}
    </Group>
  );
}

export default HomeBlockHeading;
