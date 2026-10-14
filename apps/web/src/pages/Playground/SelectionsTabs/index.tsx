import { Divider, Group, Stack, Text, Title } from '@mantine/core';
import GoBackButton from '@/shared/ui/GoBackButton';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import SectionNav from '../components/SectionNav';
import CatalogSection from './sections/CatalogSection';
import EndSection from './sections/EndSection';
import ErrorSection from './sections/ErrorSection';
import FinalSection from './sections/FinalSection';
import LayoutSection from './sections/LayoutSection';
import PanelSection from './sections/PanelSection';
import PeriodSection from './sections/PeriodSection';
import PickerSection from './sections/PickerSection';
import PlacementSection from './sections/PlacementSection';
import StatesSection from './sections/StatesSection';
import TabsSection from './sections/TabsSection';
import { SECTION_GROUPS } from './models';

/** Подборки вкладками: источник — селектором, блоки — вкладками, блок — сеткой с подгрузкой. */
function PlaygroundSelectionsTabs() {
  return (
    <Stack gap="xl" p="md">
      <Group gap="xs">
        <GoBackButton path={ROUTE_PATHS.PLAYGROUND} />
        <Title order={2}>Подборки вкладками</Title>
      </Group>
      <Stack gap="xs" maw={760}>
        <Text c="dimmed" fz="sm">
          Выбрано R1 + S2 + M1 + T1 + E2 + F1 + Z1a + H3 (кнопка «Каталог») + P2 — вверху, в разделе
          «Итог». F1 идёт общими словами в PageLayout.InfiniteScrollTrigger: «Не удалось загрузить
          продолжение списка» работает в каталоге, уведомлениях и подборках. C0–C4 и ссылка вместо
          кнопки отвергнуты: ссылка в строке источника читается как подпись.
        </Text>
        <Text c="dimmed" fz="sm">
          Ниже — все варианты по осям, как были. Оси S–F показаны на раскладке R1, оси C, H и P — на
          промежуточном итоге (каталог и вид в строке источника, период P1). Каждый вариант — в
          ширине десктопа и в рамке телефона 375 px, смотрите в обеих темах. Варианты живые:
          листаемые блоки («Горячие новинки» и «Свежие главы» Реманги, все блоки MangaLib и Senkuro,
          «Последние обновления» Inkstory) подгружают порции при прокрутке окна варианта — в
          приложении листается сама страница. Всё без пометки «Только песочница» показано так, как
          пойдёт в реализацию; обложки — случайные картинки.
        </Text>
      </Stack>
      <Group align="stretch" wrap="nowrap" gap="lg">
        <SectionNav groups={SECTION_GROUPS} />
        <Divider orientation="vertical" visibleFrom="md" />
        <Stack gap="xl" flex={1} miw={0}>
          <FinalSection />
          <LayoutSection />
          <PickerSection />
          <PlacementSection />
          <CatalogSection />
          <PanelSection />
          <TabsSection />
          <EndSection />
          <ErrorSection />
          <PeriodSection />
          <StatesSection />
        </Stack>
      </Group>
    </Stack>
  );
}

export default PlaygroundSelectionsTabs;
