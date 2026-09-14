import { Anchor, Breadcrumbs, Group, Text } from '@mantine/core';
import { generatePath, Link } from 'react-router';
import { ArrowSquareOutIcon } from '@phosphor-icons/react';
import { ROUTE_PATHS } from '@/shared/consts/routes';
import type { Manga } from '@tanuki/contracts';
import useSource from '@/entities/source/hooks/useSource';
import MangaBreadcrumbsSkeleton from './MangaBreadcrumbsSkeleton';

type Props = {
  manga: Manga;
};

function MangaBreadcrumbs({ manga }: Props) {
  const { data: source, isPending } = useSource({ sourceId: manga.sourceId });

  if (isPending) {
    return <MangaBreadcrumbsSkeleton />;
  }

  if (!source) {
    return null;
  }

  const items = [
    { title: 'Все источники', href: ROUTE_PATHS.SOURCES },
    {
      title: source.title,
      href: generatePath(ROUTE_PATHS.CATALOG, { sourceId: source.id }),
    },
    { title: manga.title, href: '' },
  ];
  return (
    <Group gap={8} justify="space-between">
      <Breadcrumbs
        separatorMargin={8}
        styles={{
          separator: {
            fontSize: 12,
          },
          breadcrumb: {
            fontSize: 12,
          },
        }}
      >
        {items.map((item, index) => (
          <>
            {index < items.length - 1 ? (
              <Anchor component={Link} to={item.href} key={index} c="dimmed" lh={1} fz={12}>
                {item.title}
              </Anchor>
            ) : (
              <Text c="dimmed" lh={1} fz={12}>
                {item.title}
              </Text>
            )}
          </>
        ))}
      </Breadcrumbs>
      <Anchor
        href={manga.publicUrl}
        target="_blank"
        rel="noreferrer nofollow"
        display="inline-block"
        c="dimmed"
      >
        <Group gap={4} c="dimmed">
          <ArrowSquareOutIcon />
          <Text lh={1} c="dimmed" fz={12}>
            Открыть на сайте
          </Text>
        </Group>
      </Anchor>
    </Group>
  );
}

export default MangaBreadcrumbs;
