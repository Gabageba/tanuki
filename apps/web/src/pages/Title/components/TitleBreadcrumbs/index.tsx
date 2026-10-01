import { Anchor, Breadcrumbs, Group, Text } from '@mantine/core';
import { generatePath, Link } from 'react-router';
import { ArrowSquareOutIcon, CaretLeftIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { ROUTE_PATHS } from '@/shared/lib/routes';
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

  const catalogPath = generatePath(ROUTE_PATHS.CATALOG, { sourceId: source.id });

  const items = [
    { title: t('allSources'), href: ROUTE_PATHS.SOURCES },
    { title: source.title, href: catalogPath },
    { title: title.name, href: '' },
  ];

  return (
    <Group gap={8} justify="space-between" wrap="nowrap">
      <Anchor component={Link} to={catalogPath} c="dimmed" hiddenFrom="md" style={{ minWidth: 0 }}>
        <Group gap={4} wrap="nowrap">
          <CaretLeftIcon size={12} />
          <Text lh="tight" fz={12} truncate>
            {source.title}
          </Text>
        </Group>
      </Anchor>
      <Breadcrumbs
        visibleFrom="md"
        separatorMargin={8}
        styles={{
          root: {
            minWidth: 0,
          },
          separator: {
            fontSize: 12,
          },
          breadcrumb: {
            fontSize: 12,
            minWidth: 0,
          },
        }}
      >
        {items.map((item, index) =>
          index < items.length - 1 ? (
            <Anchor key={index} component={Link} to={item.href} c="dimmed" lh="tight" fz={12}>
              {item.title}
            </Anchor>
          ) : (
            <Text key={index} c="dimmed" lh="tight" fz={12} truncate>
              {item.title}
            </Text>
          ),
        )}
      </Breadcrumbs>
      <Anchor
        href={title.publicUrl}
        target="_blank"
        rel="noreferrer nofollow"
        display="inline-block"
        c="dimmed"
        style={{ flexShrink: 0 }}
      >
        <Group gap={4} c="dimmed">
          <ArrowSquareOutIcon />
          <Text lh="tight" c="dimmed" fz={12}>
            {t('openOnSite')}
          </Text>
        </Group>
      </Anchor>
    </Group>
  );
}

export default TitleBreadcrumbs;
