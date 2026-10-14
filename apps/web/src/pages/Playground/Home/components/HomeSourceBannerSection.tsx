import { alpha, Box, Group, Stack } from '@mantine/core';
import { catalogEntryFor } from '@tanuki/contracts';
import SourceTitle from '@/entities/source/components/SourceTitle';
import type { HomeSource } from '../models';
import CatalogLink from './CatalogLink';
import HomeBlocksTextTabs from './HomeBlocksTextTabs';

type Props = {
  home: HomeSource;
};

/** P1 — секция источника начинается с плашки его цвета: логотип, название и «Каталог →» на
 *  тонированном фоне, слева полоса цвета источника. Под плашкой — вкладки блоков (S2b). */
function HomeSourceBannerSection({ home: { source, blocks } }: Props) {
  const { color } = catalogEntryFor(source.id);

  return (
    <Stack gap="md">
      <Box
        px="md"
        py="sm"
        bdrs="md"
        bg={alpha(color, 0.12)}
        style={{ borderLeft: `4px solid ${color}` }}
      >
        <Group justify="space-between" wrap="nowrap" gap="sm">
          <Box miw={0}>
            <SourceTitle source={source} />
          </Box>
          <CatalogLink source={source} />
        </Group>
      </Box>
      <HomeBlocksTextTabs blocks={blocks} />
    </Stack>
  );
}

export default HomeSourceBannerSection;
