import { Button } from '@mantine/core';
import { generatePath, Link } from 'react-router';
import { BooksIcon } from '@phosphor-icons/react';
import type { Source } from '@tanuki/contracts';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import { getSourceTitleGenitive } from '../lib';

type Props = {
  source: Source;
};

/** L4 — «Каталог Реманги» кнопкой справа от заголовка источника на странице подборок: источник там
 *  один, и кнопка одна. Называет объект — понятна без окружения. */
function CatalogButton({ source }: Props) {
  return (
    <Button
      component={Link}
      to={generatePath(ROUTE_PATHS.CATALOG, { sourceId: source.id })}
      variant="default"
      size="xs"
      flex="none"
      leftSection={<BooksIcon />}
    >
      Каталог {getSourceTitleGenitive(source.title)}
    </Button>
  );
}

export default CatalogButton;
