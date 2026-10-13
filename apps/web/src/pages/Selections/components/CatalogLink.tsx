import { generatePath } from 'react-router';
import { useTranslation } from 'react-i18next';
import type { Source } from '@tanuki/contracts';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import ArrowLink from '@/shared/ui/ArrowLink';

type Props = {
  source: Source;
};

/** «Каталог» (L4) — справа от заголовка источника, в его каталог без параметров. */
function CatalogLink({ source }: Props) {
  const { t } = useTranslation();

  return (
    <ArrowLink to={generatePath(ROUTE_PATHS.CATALOG, { sourceId: source.id })}>
      {t('catalog')}
    </ArrowLink>
  );
}

export default CatalogLink;
