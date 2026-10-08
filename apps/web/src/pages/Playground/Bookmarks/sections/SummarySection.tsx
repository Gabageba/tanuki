import { Group, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import DemoSection from '../../components/DemoSection';
import AxisHeading from '../components/AxisHeading';
import BookmarksPageMock from '../components/BookmarksPageMock';
import MergeDemo from '../components/MergeDemo';
import NavDotMock from '../components/NavDotMock';
import NewChaptersDemo from '../components/NewChaptersDemo';
import PhoneFrame from '../components/PhoneFrame';
import ProfileFoldersCard from '../components/ProfileFoldersCard';
import ReaderBarMock from '../components/ReaderBarMock';
import SettingsFoldersMock from '../components/SettingsFoldersMock';
import SummaryCatalogCards from '../components/SummaryCatalogCards';
import TitleActionsMock from '../components/TitleActionsMock';
import VariantState from '../components/VariantState';
import useMockFolderChoice from '../hooks/useMockFolderChoice';
import { MOCK_SUMMARY_BOOKMARKS } from '../mocks';
import {
  ACTIONS_PLACEMENT,
  CARD_VARIANT,
  DOT_VARIANT,
  ICON_PICKER_VARIANT,
  MERGE_VARIANT,
  NEW_CHAPTER_VARIANT,
  PICKER_VARIANT,
  PROFILE_VARIANT,
  READER_VARIANT,
  SOURCES_VARIANT,
  TAB_COUNTER,
  UNAVAILABLE_VARIANT,
} from '../models';

/** Выбранная комбинация целиком, на общем состоянии: папку «Ван Писа» меняют «В закладки» на
 *  странице тайтла и читалка, а метка в каталоге сразу её показывает. */
function SummarySection() {
  const choice = useMockFolderChoice('reading');

  return (
    <Stack gap="xl">
      <AxisHeading
        letter="Итог"
        title="Выбранная комбинация"
        description="Всё вместе, как будет связано в приложении. Папка «Ван Писа» общая: смените её в «В закладки» на странице тайтла или в меню читалки — метка на его карточке в каталоге поменяется тут же; «Убрать из закладок» снимает метку, «Вернуть» в тосте возвращает."
      />
      <DemoSection
        code="C10h + U3a + Q4 + T2 + A1 + I1 + E + S4 + R2c + K4a + N3 + D1 + F1 + P2 + G1 + M1d"
        title="Закладки"
        description="Один язык для нового: точка в шапке (D1) → точка на вкладке папки (T2) → точка в первой строке названия (C10h) → точка у узла новой главы в списке глав (N3). Иконки папок контурные, смысловые (I1), и та же иконка папки её цветом — на кнопке читалки (R2c); где папку выбирают — в «В закладки», меню читалки и модалке склейки — выбранный пункт красится в цвет папки (S4, M1d); недоступная закладка — серая обложка с плашкой причины (U3a). Действия с закладкой — в меню «⋯» карточки (Q4): другие источники, «Перенести в папку» подменю и «Убрать из закладок» с «Вернуть» в тосте; что источников несколько, подсказывает тихий «+N» у иконки."
      >
        <Stack gap="xl">
          <VariantState label="Шапка и футер (D1)">
            <NavDotMock variant={DOT_VARIANT.DOT} />
          </VariantState>
          <VariantState label="/bookmarks (T2 + A1 + I1 + C10h + U3a + Q4)">
            <Group gap="xl" align="flex-start">
              <Paper withBorder radius="md" p="md" flex={1} miw={320} maw={1000}>
                <BookmarksPageMock
                  tabCounter={TAB_COUNTER.COUNT_DOT}
                  actionsPlacement={ACTIONS_PLACEMENT.TABS}
                  cardVariant={CARD_VARIANT.TITLE_DOT_FIRST_LINE}
                  unavailableVariant={UNAVAILABLE_VARIANT.DIMMED_PLATE_LIGHT}
                  sourcesVariant={SOURCES_VARIANT.CARD_MENU_FOLDERS}
                  bookmarks={MOCK_SUMMARY_BOOKMARKS}
                />
              </Paper>
              <PhoneFrame>
                <BookmarksPageMock
                  tabCounter={TAB_COUNTER.COUNT_DOT}
                  actionsPlacement={ACTIONS_PLACEMENT.TABS}
                  cardVariant={CARD_VARIANT.TITLE_DOT_FIRST_LINE}
                  unavailableVariant={UNAVAILABLE_VARIANT.DIMMED_PLATE_LIGHT}
                  sourcesVariant={SOURCES_VARIANT.CARD_MENU_FOLDERS}
                  bookmarks={MOCK_SUMMARY_BOOKMARKS}
                  compact
                />
              </PhoneFrame>
            </Group>
          </VariantState>
          <Group gap="xl" align="flex-start">
            <VariantState label="Страница тайтла: «В закладки» (S4)">
              <TitleActionsMock variant={PICKER_VARIANT.SELECT_FOLDER_TINT} choice={choice} />
            </VariantState>
            <VariantState label="Список глав (N3)">
              <NewChaptersDemo variant={NEW_CHAPTER_VARIANT.NODE_DOT} />
            </VariantState>
          </Group>
          <VariantState label="Читалка (R2c)">
            <ReaderBarMock variant={READER_VARIANT.FOLDER_GLYPH} choice={choice} />
          </VariantState>
          <VariantState label="Каталог (K4a) — «Ван Пис» в той же папке, что выше">
            <SummaryCatalogCards folderId={choice.folderId} />
          </VariantState>
          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
            <VariantState label="Настройки → Закладки (F1, «Новая папка» и «Переименовать» — P2)">
              <SettingsFoldersMock withCount={false} pickerVariant={ICON_PICKER_VARIANT.TINTED} />
            </VariantState>
            <VariantState label="Профиль (G1)">
              <ProfileFoldersCard variant={PROFILE_VARIANT.PROGRESS_LIST} />
            </VariantState>
          </SimpleGrid>
          <VariantState label="Склейка (M1d)">
            <MergeDemo variant={MERGE_VARIANT.RADIO_CARDS_FOLDER_TINT} />
          </VariantState>
          <Text c="dimmed" fz="sm">
            Загрузка и пустые состояния (E) — без изменений, см. раздел E ниже.
          </Text>
        </Stack>
      </DemoSection>
    </Stack>
  );
}

export default SummarySection;
