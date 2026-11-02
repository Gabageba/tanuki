import { Divider, Group, Stack, Text, Title } from '@mantine/core';
import GoBackButton from '@/shared/ui/GoBackButton';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import DemoSection from '../components/DemoSection';
import SectionNav from '../components/SectionNav';
import SettingsFrames from './components/SettingsFrames';
import ResultDemo from './components/ResultDemo';
import PanelFrames from './components/PanelFrames';
import SpreadFrames from './components/SpreadFrames';
import { PANEL_LAYOUT, SECTION_GROUPS, SETTINGS_LAYOUT, SPREAD_ALIGN } from './models';

function PlaygroundReaderImprovements() {
  return (
    <Stack gap="xl" p="md">
      <Group gap="xs">
        <GoBackButton path={ROUTE_PATHS.PLAYGROUND} />
        <Title order={2}>Возможности читалки</Title>
      </Group>
      <Text c="dimmed" fz="sm" maw={760}>
        Сравните независимые варианты настроек, панелей и разворота на телефоне и компьютере.
        Переключите тему приложения и попробуйте элементы настроек. Всё без пометки «Только
        песочница» показано так, как пойдёт в реализацию.
      </Text>
      <Group align="stretch" wrap="nowrap" gap="xl">
        <SectionNav groups={SECTION_GROUPS} />
        <Divider orientation="vertical" visibleFrom="lg" />
        <Stack gap="xl" flex={1} miw={0}>
          <Stack gap="xl">
            <Title order={3} id="axis-result">
              Итог
            </Title>
            <DemoSection
              code="R2 + S1 + P1 + D1"
              title="Настройки и читалка"
              description="Отдельная группа постраничного режима; фон, яркость и поведение в привычных контролах; полноэкранная кнопка в панели; страницы разворота выровнены сверху. Настройки связаны в обоих представлениях читалки и на вкладке приложения."
              pros={['Все выбранные элементы можно проверить вместе.']}
              cons={['Группа постраничного режима добавляет блок в настройках.']}
            >
              <ResultDemo />
            </DemoSection>
          </Stack>
          <Stack gap="xl">
            <Title order={3} id="axis-R">
              R — режим и расположение настроек
            </Title>
            <DemoSection
              code="R0"
              title="Как сейчас"
              description="Режим и масштаб находятся в отображении; отдельных настроек направления и разворота пока нет."
              pros={['Знакомый порядок настроек.']}
              cons={['Направление и разворот недоступны.']}
            >
              <SettingsFrames layout={SETTINGS_LAYOUT.CURRENT} />
            </DemoSection>
            <DemoSection
              code="R1"
              title="Рядом с режимом"
              description="Направление и число страниц идут сразу за режимом и скрываются в вертикальном режиме в обоих местах настроек."
              pros={['Настройки находятся рядом с режимом, от которого зависят.']}
              cons={['В вертикальном режиме эти настройки не видны.']}
            >
              <SettingsFrames layout={SETTINGS_LAYOUT.INLINE} />
            </DemoSection>
            <DemoSection
              code="R2"
              title="Отдельная группа"
              description="Направление и разворот собраны в отдельной группе, которая в обоих местах видна только в постраничном режиме."
              pros={['Граница настроек режима обозначена заголовком.']}
              cons={['Отдельная группа удлиняет список настроек.']}
            >
              <SettingsFrames layout={SETTINGS_LAYOUT.GROUP} />
            </DemoSection>
          </Stack>
          <Stack gap="xl">
            <Title order={3} id="axis-S">
              S — фон, яркость и поведение
            </Title>
            <DemoSection
              code="S1"
              title="Текущие контролы"
              description="На вкладке фон выбирается списком, в панели — карточками; яркость и глубина предзагрузки — ползунками, запрет гашения — переключателем."
              pros={['Использует привычные элементы настроек.']}
              cons={['Цвета фона видны только после открытия списка.']}
            >
              <SettingsFrames layout={SETTINGS_LAYOUT.INLINE} />
            </DemoSection>
            <DemoSection
              code="S2"
              title="Цвета видны сразу"
              description="Все варианты фона показаны рядом с образцами; остальные настройки как в S1."
              pros={['Цвет можно оценить до выбора.']}
              cons={['Выбор занимает больше места, особенно на телефоне.']}
            >
              <SettingsFrames layout={SETTINGS_LAYOUT.INLINE} swatches />
            </DemoSection>
          </Stack>
          <Stack gap="xl">
            <Title order={3} id="axis-P">
              P — панель и счётчик
            </Title>
            <DemoSection
              code="P0"
              title="Как сейчас"
              description="В панели нет кнопки полноэкранного режима; текущий счётчик показывает одну страницу."
              pros={['Панель занимает меньше места.']}
              cons={['Нет кнопки полного экрана и диапазона разворота.']}
            >
              <PanelFrames layout={PANEL_LAYOUT.CURRENT} />
            </DemoSection>
            <DemoSection
              code="P1"
              title="Кнопка рядом с настройками"
              description="Полный экран включается в группе управления; счётчик показывает видимые страницы."
              pros={['Кнопка находится в одной группе с настройками на всех ширинах.']}
              cons={['Нижняя панель телефона становится шире.']}
            >
              <PanelFrames layout={PANEL_LAYOUT.CONTROLS} />
            </DemoSection>
            <DemoSection
              code="P2"
              title="Кнопка в шапке телефона"
              description="На телефоне кнопка стоит рядом со счётчиком, на компьютере — в группе управления."
              pros={['Нижняя панель не становится шире.']}
              cons={['Положение кнопки меняется в зависимости от ширины.']}
            >
              <PanelFrames layout={PANEL_LAYOUT.HEADER} />
            </DemoSection>
          </Stack>
          <Stack gap="xl">
            <Title order={3} id="axis-D">
              D — выравнивание разворота
            </Title>
            <DemoSection
              code="D1"
              title="По верхнему краю"
              description="Страницы вписываются в экран и выравниваются сверху; непарная страница располагается по центру."
              pros={['Начало страниц совпадает по высоте.']}
              cons={['Нижние края разных страниц не совпадают.']}
            >
              <SpreadFrames align={SPREAD_ALIGN.TOP} />
            </DemoSection>
            <DemoSection
              code="D2"
              title="По центру"
              description="Страницы центрированы относительно друг друга; непарная страница располагается по центру."
              pros={['Пара выглядит единым блоком.']}
              cons={['Верхние и нижние края страниц разной высоты не совпадают.']}
            >
              <SpreadFrames align={SPREAD_ALIGN.CENTER} />
            </DemoSection>
            <DemoSection
              code="D3"
              title="По нижнему краю"
              description="Страницы выравниваются снизу; непарная страница располагается по центру."
              pros={['Нижние края страниц совпадают.']}
              cons={['Начало страниц разной высоты не совпадает.']}
            >
              <SpreadFrames align={SPREAD_ALIGN.BOTTOM} />
            </DemoSection>
          </Stack>
        </Stack>
      </Group>
    </Stack>
  );
}
export default PlaygroundReaderImprovements;
