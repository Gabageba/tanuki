import { SimpleGrid } from '@mantine/core';
import { resolveFolder } from '../lib';
import { MOCK_CATALOG_TITLES, MOCK_FOLDERS } from '../mocks';
import { BUILT_IN_STYLE, MARKER_VARIANT } from '../models';
import CatalogCardMock from './CatalogCardMock';

type Props = {
  /** Папка «Ван Писа» — общая с «В закладки» и читалкой «Итога». */
  folderId: string | null;
};

const FOLDERS = MOCK_FOLDERS.map((folder) => resolveFolder(folder, BUILT_IN_STYLE.SEMANTIC));
const getFolder = (folderId: string | null) => FOLDERS.find(({ id }) => id === folderId) ?? null;

/** Каталог с меткой K2: у первой карточки папка меняется вместе с выбором на странице тайтла. */
function SummaryCatalogCards({ folderId }: Props) {
  return (
    <SimpleGrid cols={4} spacing="md" maw={640}>
      {MOCK_CATALOG_TITLES.map((title, index) => (
        <CatalogCardMock
          key={title.id}
          title={title}
          folder={getFolder(index === 0 ? folderId : title.folderId)}
          variant={MARKER_VARIANT.FOLDER_ICON}
        />
      ))}
    </SimpleGrid>
  );
}

export default SummaryCatalogCards;
