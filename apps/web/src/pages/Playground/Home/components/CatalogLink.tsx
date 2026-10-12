import { Anchor, Group } from '@mantine/core';
import { generatePath, Link } from 'react-router';
import { ArrowRightIcon } from '@phosphor-icons/react';
import type { Source } from '@tanuki/contracts';
import { ROUTE_PATHS } from '@/shared/lib/routes';

type Props = {
  source: Source;
};

/** «Каталог →» — в каталог источника без параметров, как «Все результаты» в поиске. */
function CatalogLink({ source }: Props) {
  return (
    <Anchor
      component={Link}
      to={generatePath(ROUTE_PATHS.CATALOG, { sourceId: source.id })}
      fz="sm"
      flex="none"
    >
      <Group gap={4} wrap="nowrap">
        Каталог
        <ArrowRightIcon />
      </Group>
    </Anchor>
  );
}

export default CatalogLink;
