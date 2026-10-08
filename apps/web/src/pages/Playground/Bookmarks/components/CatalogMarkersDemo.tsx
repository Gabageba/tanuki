import { Group, SimpleGrid, Stack, Text } from '@mantine/core';
import { SOURCE_ID } from '@tanuki/contracts';
import { resolveFolder } from '../lib';
import { MOCK_CATALOG_TITLES, MOCK_FOLDERS, MOCK_HARD_COVER_TITLES } from '../mocks';
import { BUILT_IN_STYLE, MARKER_VARIANT, type MarkerVariant } from '../models';
import CatalogCardMock from './CatalogCardMock';
import PhoneFrame from './PhoneFrame';

type Props = {
  /** null — меток нет, как сейчас. */
  variant: MarkerVariant | null;
  /** Ряд трудных обложек — тёмная, в цвет папки, светлая, пёстрая — между каталогом и поиском. */
  withHardCovers?: boolean;
};

const FOLDERS = MOCK_FOLDERS.map((folder) => resolveFolder(folder, BUILT_IN_STYLE.SEMANTIC));
const getFolder = (folderId: string | null) => FOLDERS.find(({ id }) => id === folderId) ?? null;

/** Каталог: «Читаю», «Любимое» с 18+, «Брошено», не в закладках; и карточка поиска с лентой. */
function CatalogMarkersDemo({ variant, withHardCovers = false }: Props) {
  const cards = (withSource: boolean, titles = MOCK_CATALOG_TITLES) =>
    titles.map((title) => (
      <CatalogCardMock
        key={title.id}
        title={title}
        folder={variant ? getFolder(title.folderId) : null}
        variant={variant ?? MARKER_VARIANT.BOOKMARK}
        sourceId={withSource ? SOURCE_ID.MANGALIB : undefined}
      />
    ));

  return (
    <Group gap="xl" align="flex-start">
      <Stack gap={6} maw={860} flex={1} miw={300}>
        <Text fz={12} c="dimmed">
          {withHardCovers
            ? 'Каталог · трудные обложки · поиск (лента источника)'
            : 'Каталог · поиск (лента источника)'}
        </Text>
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
          {cards(false)}
        </SimpleGrid>
        {withHardCovers && (
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
            {cards(false, MOCK_HARD_COVER_TITLES)}
          </SimpleGrid>
        )}
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
          {cards(true)}
        </SimpleGrid>
      </Stack>
      <PhoneFrame>
        <SimpleGrid cols={2} spacing="sm">
          {(withHardCovers ? MOCK_HARD_COVER_TITLES : MOCK_CATALOG_TITLES)
            .slice(0, 2)
            .map((title) => (
              <CatalogCardMock
                key={title.id}
                title={title}
                folder={variant ? getFolder(title.folderId) : null}
                variant={variant ?? MARKER_VARIANT.BOOKMARK}
              />
            ))}
        </SimpleGrid>
      </PhoneFrame>
    </Group>
  );
}

export default CatalogMarkersDemo;
