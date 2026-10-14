import { Box, Group, UnstyledButton } from '@mantine/core';
import { generatePath, Link } from 'react-router';
import { CaretRightIcon } from '@phosphor-icons/react';
import type { Source } from '@tanuki/contracts';
import SourceTitle from '@/entities/source/components/SourceTitle';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import { CATALOG_LINK, type CatalogLink as CatalogLinkKind } from '../models';
import CatalogLink from './CatalogLink';

type Props = {
  source: Source;
  link: CatalogLinkKind;
};

/** Заголовок секции: `SourceTitle` без статуса. L1 — «Каталог →» справа, L2 — само название ведёт
 *  в каталог (со стрелкой), L3 — и то и другое. */
function HomeSourceHeader({ source, link }: Props) {
  const isTitleLink = link !== CATALOG_LINK.RIGHT;
  const isRightLink = link !== CATALOG_LINK.TITLE;

  return (
    <Group justify="space-between" wrap="nowrap" gap="sm">
      {isTitleLink ? (
        <UnstyledButton
          component={Link}
          to={generatePath(ROUTE_PATHS.CATALOG, { sourceId: source.id })}
          miw={0}
        >
          <Group gap="xs" wrap="nowrap">
            <Box miw={0}>
              <SourceTitle source={source} />
            </Box>
            <CaretRightIcon size={18} />
          </Group>
        </UnstyledButton>
      ) : (
        <Box miw={0}>
          <SourceTitle source={source} />
        </Box>
      )}
      {isRightLink && <CatalogLink source={source} />}
    </Group>
  );
}

export default HomeSourceHeader;
