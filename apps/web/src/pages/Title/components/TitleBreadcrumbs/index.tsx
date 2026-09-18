import { Anchor, Breadcrumbs, Group, Text } from '@mantine/core';
import { generatePath, Link } from 'react-router';
import { ArrowSquareOutIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { ROUTE_PATHS } from '@/shared/consts/routes';
import type { Title } from '@tanuki/contracts';
import useSource from '@/entities/source/hooks/useSource';
import TitleBreadcrumbsSkeleton from './TitleBreadcrumbsSkeleton';

type Props = {
  title: Title;
};

function TitleBreadcrumbs({ title }: Props) {
  const { t } = useTranslation();
  const { data: source, isPending } = useSource({ sourceId: title.sourceId });

  if (isPending) {
    return <TitleBreadcrumbsSkeleton />;
  }

  if (!source) {
    return null;
  }

  const items = [
    { title: t('allSources'), href: ROUTE_PATHS.SOURCES },
    {
      title: source.title,
      href: generatePath(ROUTE_PATHS.CATALOG, { sourceId: source.id }),
    },
    { title: title.name, href: '' },
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
        href={title.publicUrl}
        target="_blank"
        rel="noreferrer nofollow"
        display="inline-block"
        c="dimmed"
      >
        <Group gap={4} c="dimmed">
          <ArrowSquareOutIcon />
          <Text lh={1} c="dimmed" fz={12} visibleFrom="xxs">
            {t('openOnSite')}
          </Text>
        </Group>
      </Anchor>
    </Group>
  );
}

export default TitleBreadcrumbs;
