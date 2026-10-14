import { Button } from '@mantine/core';
import { generatePath, Link } from 'react-router';
import { BooksIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { Source } from '@tanuki/contracts';
import { ROUTE_PATHS } from '@/shared/lib/routes';

type Props = {
  source: Source;
};

/** «Каталог» (H3) справа в строке источника — источник назван рядом, поэтому без имени. */
function CatalogButton({ source }: Props) {
  const { t } = useTranslation();

  return (
    <Button
      component={Link}
      to={generatePath(ROUTE_PATHS.CATALOG, { sourceId: source.id })}
      variant="default"
      leftSection={<BooksIcon />}
      flex="none"
    >
      {t('catalog')}
    </Button>
  );
}

export default CatalogButton;
