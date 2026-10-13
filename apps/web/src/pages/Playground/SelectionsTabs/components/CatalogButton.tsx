import { Button } from '@mantine/core';
import { generatePath, Link } from 'react-router';
import { BooksIcon } from '@phosphor-icons/react';
import type { Source } from '@tanuki/contracts';
import { ROUTE_PATHS } from '@/shared/lib/routes';

type Props = {
  source: Source;
  size: 'sm' | 'xs';
  /** H2/H3 — «Каталог: Реманга», как L4; H1 и итог — просто «Каталог»: источник назван рядом. */
  withSourceName: boolean;
};

/** Кнопка в каталог источника — `Button variant="default"` с книгами, как задумывалось в L4. */
function CatalogButton({ source, size, withSourceName }: Props) {
  return (
    <Button
      component={Link}
      to={generatePath(ROUTE_PATHS.CATALOG, { sourceId: source.id })}
      variant="default"
      size={size}
      leftSection={<BooksIcon size={size === 'xs' ? 14 : 16} />}
      flex="none"
    >
      {withSourceName ? `Каталог: ${source.title}` : 'Каталог'}
    </Button>
  );
}

export default CatalogButton;
