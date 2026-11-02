import { useContext, useState } from 'react';
import { Box, Stack, Text, Title } from '@mantine/core';
import {
  ArrowsHorizontalIcon,
  ArrowsLeftRightIcon,
  ArrowsOutLineHorizontalIcon,
  ArrowsOutLineVerticalIcon,
  ArrowsVerticalIcon,
  BookOpenIcon,
  BookOpenTextIcon,
  EyeClosedIcon,
  EyeIcon,
  MoonIcon,
  SkipForwardIcon,
} from '@phosphor-icons/react';
import {
  READER_CHAPTER_GAP,
  READER_CONTAINER_WIDTH,
  READER_PAGE_GAP,
  READER_TAP_ZONE_WIDTH,
} from '@tanuki/contracts';
import ReaderTapZonePreview from '@/entities/reader/ReaderTapZonePreview';
import { SETTINGS_LAYOUT, type SettingsLayout } from '../models';
import { RESULT_CONTEXT } from '../resultContext';
import DrawerChoices from './DrawerChoices';
import DrawerSlider from './DrawerSlider';
import DrawerSwitch from './DrawerSwitch';

type Props = {
  layout: SettingsLayout;
  swatches?: boolean;
  initialVertical?: boolean;
  initialFitWhole?: boolean;
};
const getPresets = (range: { NARROW: number; MEDIUM: number; WIDE: number }) => [
  { label: 'Узко', value: range.NARROW },
  { label: 'Средне', value: range.MEDIUM },
  { label: 'Широко', value: range.WIDE },
];
function DrawerMock({
  layout,
  swatches = false,
  initialVertical = true,
  initialFitWhole = false,
}: Props) {
  const shared = useContext(RESULT_CONTEXT);
  const localMode = useState(initialVertical ? 'vertical' : 'pages');
  const [mode, setMode] = shared?.mode ?? localMode;
  const localFit = useState(initialFitWhole ? 'height' : 'width');
  const [fit, setFit] = shared?.fit ?? localFit;
  const localDirection = useState('ltr');
  const [direction, setDirection] = shared?.direction ?? localDirection;
  const localPages = useState('single');
  const [pages, setPages] = shared?.pages ?? localPages;
  const localBackground = useState('black');
  const [background, setBackground] = shared?.background ?? localBackground;
  const localWidth = useState<number>(READER_CONTAINER_WIDTH.MEDIUM);
  const [width, setWidth] = shared?.width ?? localWidth;
  const localTap = useState<number>(READER_TAP_ZONE_WIDTH.MEDIUM);
  const [tap, setTap] = shared?.tap ?? localTap;
  const localPageGap = useState<number>(READER_PAGE_GAP.NARROW);
  const [pageGap, setPageGap] = shared?.pageGap ?? localPageGap;
  const localChapterGap = useState<number>(READER_CHAPTER_GAP.MEDIUM);
  const [chapterGap, setChapterGap] = shared?.chapterGap ?? localChapterGap;
  const localBrightness = useState(100);
  const [brightness, setBrightness] = shared?.brightness ?? localBrightness;
  const localPrefetch = useState(3);
  const [prefetch, setPrefetch] = shared?.prefetch ?? localPrefetch;
  const localWake = useState(false);
  const [wake, setWake] = shared?.wake ?? localWake;
  const localAutoNext = useState(true);
  const [autoNext, setAutoNext] = shared?.autoNext ?? localAutoNext;
  const localHidePanels = useState(true);
  const [hidePanels, setHidePanels] = shared?.hidePanels ?? localHidePanels;
  const disabled = mode === 'vertical';
  const choices = (
    <Stack gap="lg">
      <DrawerChoices
        label="Направление чтения"
        value={direction}
        onChange={setDirection}
        disabled={disabled}
        items={[
          {
            value: 'ltr',
            title: 'Слева направо',
            description: 'Следующая страница справа',
            icon: <ArrowsLeftRightIcon />,
          },
          {
            value: 'rtl',
            title: 'Справа налево',
            description: 'Следующая страница слева',
            icon: <ArrowsLeftRightIcon />,
          },
        ]}
      />
      <DrawerChoices
        label="Страницы"
        value={pages}
        onChange={setPages}
        disabled={disabled}
        items={[
          {
            value: 'single',
            title: 'По одной',
            description: 'На экране одна страница',
            icon: <BookOpenTextIcon />,
          },
          {
            value: 'spread',
            title: 'Разворот',
            description: 'На экране две страницы',
            icon: <BookOpenIcon />,
          },
        ]}
      />
    </Stack>
  );
  return (
    <Stack gap="lg" p="md" bg="var(--mantine-color-body)">
      <Title order={4}>Настройки читалки</Title>
      <DrawerChoices
        label="Режим чтения"
        value={mode}
        onChange={setMode}
        items={[
          {
            value: 'vertical',
            title: 'Вертикальный',
            description: 'Страницы идут непрерывной лентой',
            icon: <ArrowsVerticalIcon />,
          },
          {
            value: 'pages',
            title: layout === SETTINGS_LAYOUT.CURRENT ? 'Горизонтальный' : 'Постраничный',
            description:
              layout === SETTINGS_LAYOUT.CURRENT
                ? 'Переключение страниц кликом или стрелками'
                : 'Листание по страницам',
            icon: <ArrowsHorizontalIcon />,
          },
        ]}
      />
      {layout === SETTINGS_LAYOUT.INLINE && !disabled && choices}
      <DrawerChoices
        label="Масштаб страниц"
        value={fit}
        onChange={setFit}
        items={[
          {
            value: 'width',
            title: 'По ширине',
            description: 'Страница заполняет ширину контейнера',
            icon: <ArrowsOutLineHorizontalIcon />,
          },
          {
            value: 'height',
            title: 'Целиком',
            description: 'Высота страницы вписывается в экран',
            icon: <ArrowsOutLineVerticalIcon />,
          },
        ]}
      />
      {layout === SETTINGS_LAYOUT.GROUP && !disabled && (
        <Stack gap="lg">
          <Title order={5}>Постраничный режим</Title>
          {choices}
        </Stack>
      )}
      {fit === 'width' && (
        <DrawerSlider
          label="Ширина контейнера"
          unit="px"
          value={width}
          onChange={setWidth}
          min={READER_CONTAINER_WIDTH.MIN}
          max={READER_CONTAINER_WIDTH.MAX}
          presets={getPresets(READER_CONTAINER_WIDTH)}
        />
      )}
      {mode === 'pages' ? (
        <DrawerSlider
          label="Зона клика"
          unit="%"
          value={tap}
          onChange={setTap}
          min={READER_TAP_ZONE_WIDTH.MIN}
          max={READER_TAP_ZONE_WIDTH.MAX}
          presets={getPresets(READER_TAP_ZONE_WIDTH)}
          preview={<ReaderTapZonePreview tapZoneWidth={tap} />}
        />
      ) : (
        <>
          <DrawerSlider
            label="Отступ между страницами"
            unit="px"
            value={pageGap}
            onChange={setPageGap}
            min={READER_PAGE_GAP.MIN}
            max={READER_PAGE_GAP.MAX}
            presets={getPresets(READER_PAGE_GAP)}
          />
          <DrawerSlider
            label="Отступ между главами"
            unit="px"
            value={chapterGap}
            onChange={setChapterGap}
            min={READER_CHAPTER_GAP.MIN}
            max={READER_CHAPTER_GAP.MAX}
            presets={getPresets(READER_CHAPTER_GAP)}
          />
        </>
      )}
      {layout !== SETTINGS_LAYOUT.CURRENT && (
        <>
          <DrawerChoices
            label="Фон"
            value={background}
            onChange={setBackground}
            items={[
              {
                value: 'black',
                title: 'Чёрный',
                description: 'Чёрный фон вокруг страниц',
                icon: swatches ? (
                  <Box w={16} h={16} bg="var(--mantine-color-dark-9)" />
                ) : (
                  <MoonIcon />
                ),
              },
              {
                value: 'gray',
                title: 'Серый',
                description: 'Серый фон вокруг страниц',
                icon: swatches ? (
                  <Box w={16} h={16} bg="var(--mantine-color-gray-6)" />
                ) : (
                  <MoonIcon />
                ),
              },
              {
                value: 'paper',
                title: 'Бумага',
                description: 'Светлый бумажный фон вокруг страниц',
                icon: swatches ? (
                  <Box w={16} h={16} bg="var(--mantine-color-yellow-1)" />
                ) : (
                  <MoonIcon />
                ),
              },
            ]}
          />
          <DrawerSlider
            label="Яркость"
            unit="%"
            value={brightness}
            min={20}
            max={100}
            onChange={setBrightness}
            presets={[
              { label: '20%', value: 20 },
              { label: '60%', value: 60 },
              { label: '100%', value: 100 },
            ]}
          />
          <DrawerSlider
            label="Предзагрузка страниц"
            unit=""
            value={prefetch}
            min={0}
            max={10}
            onChange={setPrefetch}
            presets={[
              { label: '0', value: 0 },
              { label: '3', value: 3 },
              { label: '10', value: 10 },
            ]}
          />
        </>
      )}
      <Stack gap={8}>
        <Text c="dimmed">Поведение</Text>
        <DrawerSwitch
          title="Открывать следующую главу сразу"
          description="Без промежуточного экрана в конце главы"
          icon={<SkipForwardIcon />}
          checked={autoNext}
          onChange={setAutoNext}
        />
        <DrawerSwitch
          title="Скрывать панели при прокрутке"
          description="Шапка и панель глав уезжают во время чтения"
          icon={<EyeClosedIcon />}
          checked={hidePanels}
          onChange={setHidePanels}
        />
        {layout !== SETTINGS_LAYOUT.CURRENT && (
          <DrawerSwitch
            title="Не гасить экран"
            description="Экран остаётся включённым во время чтения, если устройство это поддерживает"
            icon={<EyeIcon />}
            checked={wake}
            onChange={setWake}
          />
        )}
      </Stack>
    </Stack>
  );
}
export default DrawerMock;
