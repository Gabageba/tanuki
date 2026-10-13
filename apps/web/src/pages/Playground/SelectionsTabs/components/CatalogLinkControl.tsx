import { ActionIcon, Anchor, Tooltip } from '@mantine/core';
import { generatePath, Link } from 'react-router';
import { BooksIcon } from '@phosphor-icons/react';
import type { Source } from '@tanuki/contracts';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import ArrowLink from '@/shared/ui/ArrowLink';
import { CATALOG_LINK, type CatalogLink } from '../models';
import styles from '../SelectionsTabs.module.scss';

type Props = {
  source: Source;
  look: CatalogLink;
};

/** Переход в каталог справа в строке источника — C0–C2; у C3 и C4 он живёт в самом заголовке. */
function CatalogLinkControl({ source, look }: Props) {
  const to = generatePath(ROUTE_PATHS.CATALOG, { sourceId: source.id });

  switch (look) {
    case CATALOG_LINK.ARROW:
      return <ArrowLink to={to}>Каталог: {source.title}</ArrowLink>;
    case CATALOG_LINK.QUIET:
      return (
        <Anchor component={Link} to={to} fz="xs" underline="hover" className={styles.quietLink}>
          Каталог
        </Anchor>
      );
    case CATALOG_LINK.ICON:
      return (
        <Tooltip label={`Каталог: ${source.title}`}>
          <ActionIcon
            component={Link}
            to={to}
            variant="default"
            size="lg"
            aria-label={`Каталог: ${source.title}`}
          >
            <BooksIcon size={18} />
          </ActionIcon>
        </Tooltip>
      );
    case CATALOG_LINK.SUBTITLE:
    case CATALOG_LINK.MENU:
      return null;
  }
}

export default CatalogLinkControl;
