import { useContext, useState } from 'react';
import { Box, Group, Radio, Select, Switch } from '@mantine/core';
import {
  ArrowsHorizontalIcon,
  BookOpenIcon,
  EyeIcon,
  ImageIcon,
  MoonIcon,
  RowsIcon,
  ArrowsOutLineHorizontalIcon,
  HandTapIcon,
  SplitVerticalIcon,
  SkipForwardIcon,
  EyeClosedIcon,
  SunIcon,
} from '@phosphor-icons/react';
import GroupedList from '@/shared/ui/GroupedList';
import ReaderTapZonePreview from '@/entities/reader/ReaderTapZonePreview';
import {
  READER_CHAPTER_GAP,
  READER_CONTAINER_WIDTH,
  READER_PAGE_GAP,
  READER_TAP_ZONE_WIDTH,
} from '@tanuki/contracts';
import SettingsSlider from './SettingsSlider';
import { SETTINGS_LAYOUT, type SettingsLayout } from '../models';
import { RESULT_CONTEXT } from '../resultContext';
import styles from './SettingsMock.module.scss';

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

function SettingsMock({
  layout,
  swatches = false,
  initialVertical = false,
  initialFitWhole = false,
}: Props) {
  const shared = useContext(RESULT_CONTEXT);
  const localMode = useState(initialVertical ? 'vertical' : 'pages');
  const [mode, setMode] = shared?.mode ?? localMode;
  const localDirection = useState('ltr');
  const [direction, setDirection] = shared?.direction ?? localDirection;
  const localPages = useState('spread');
  const [pages, setPages] = shared?.pages ?? localPages;
  const localBackground = useState('black');
  const [background, setBackground] = shared?.background ?? localBackground;
  const localFit = useState(initialFitWhole ? 'height' : 'width');
  const [fitValue, setFitValue] = shared?.fit ?? localFit;
  const fit = fitValue === 'width' ? 'По ширине' : 'Целиком';
  const setFit = (value: string) => setFitValue(value === 'По ширине' ? 'width' : 'height');
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
  const localWake = useState(true);
  const [wake, setWake] = shared?.wake ?? localWake;
  const localAutoNext = useState(true);
  const [autoNext, setAutoNext] = shared?.autoNext ?? localAutoNext;
  const localHidePanels = useState(true);
  const [hidePanels, setHidePanels] = shared?.hidePanels ?? localHidePanels;
  const disabled = mode === 'vertical';
  const isCurrent = layout === SETTINGS_LAYOUT.CURRENT;
  const directionRows = [
    <GroupedList.Row
      key="direction"
      disabled={disabled}
      icon={<ArrowsHorizontalIcon />}
      title="Направление чтения"
      description={
        disabled ? 'Только в постраничном режиме' : 'Порядок страниц и направление листания'
      }
      action={
        <Select
          aria-label="Направление чтения"
          leftSection={<ArrowsHorizontalIcon />}
          data={[
            { value: 'ltr', label: 'Слева направо' },
            { value: 'rtl', label: 'Справа налево' },
          ]}
          value={direction}
          onChange={(value) => value && setDirection(value)}
          disabled={disabled}
          allowDeselect={false}
        />
      }
    />,
    <GroupedList.Row
      key="pages"
      disabled={disabled}
      icon={<BookOpenIcon />}
      title="Страницы"
      description={disabled ? 'Только в постраничном режиме' : 'Одна страница или пара на экране'}
      action={
        <Select
          aria-label="Страницы"
          leftSection={<BookOpenIcon />}
          data={[
            { value: 'single', label: 'По одной' },
            { value: 'spread', label: 'Разворот' },
          ]}
          value={pages}
          onChange={(value) => value && setPages(value)}
          disabled={disabled}
          allowDeselect={false}
        />
      }
    />,
  ];
  return (
    <Box className={styles.container}>
      <Box className={styles.grid}>
        <GroupedList label="Отображение">
          <GroupedList.Row
            icon={<BookOpenIcon />}
            title="Режим чтения"
            description={disabled ? 'Страницы идут непрерывной лентой' : 'Листание по страницам'}
            action={
              <Select
                aria-label="Режим чтения"
                leftSection={<BookOpenIcon />}
                data={[
                  { value: 'vertical', label: 'Вертикальный' },
                  {
                    value: 'pages',
                    label: layout === SETTINGS_LAYOUT.CURRENT ? 'Горизонтальный' : 'Постраничный',
                  },
                ]}
                value={mode}
                onChange={(value) => value && setMode(value)}
                allowDeselect={false}
              />
            }
          />
          {layout === SETTINGS_LAYOUT.INLINE && !disabled && directionRows}
          <GroupedList.Row
            icon={<ImageIcon />}
            title="Масштаб страниц"
            description={
              fit === 'По ширине'
                ? 'Страница заполняет ширину контейнера'
                : 'Высота страницы вписывается в экран'
            }
            action={
              <Select
                aria-label="Масштаб страниц"
                leftSection={<ImageIcon />}
                data={['Целиком', 'По ширине']}
                value={fit}
                onChange={(value) => value && setFit(value)}
                allowDeselect={false}
              />
            }
          />
          {(isCurrent || fit === 'По ширине') && (
            <SettingsSlider
              icon={<ArrowsOutLineHorizontalIcon />}
              title="Ширина контейнера"
              description={
                fit === 'По ширине'
                  ? 'Ширина ленты страниц на широком экране'
                  : 'Только при масштабе по ширине'
              }
              unit="px"
              value={width}
              range={READER_CONTAINER_WIDTH}
              presets={getPresets(READER_CONTAINER_WIDTH)}
              onChange={setWidth}
              disabled={fit !== 'По ширине'}
            />
          )}
          {layout !== SETTINGS_LAYOUT.CURRENT && (
            <GroupedList.Row
              icon={<MoonIcon />}
              title="Фон"
              description="Цвет вокруг страниц"
              action={
                swatches ? (
                  <Radio.Group value={background} onChange={setBackground} aria-label="Фон">
                    <Group gap="xs">
                      <Radio
                        value="black"
                        label={
                          <Group gap={4}>
                            <Box w={16} h={16} bg="var(--mantine-color-dark-9)" />
                            Чёрный
                          </Group>
                        }
                        color="dark"
                      />
                      <Radio
                        value="gray"
                        label={
                          <Group gap={4}>
                            <Box w={16} h={16} bg="var(--mantine-color-gray-6)" />
                            Серый
                          </Group>
                        }
                        color="gray"
                      />
                      <Radio
                        value="paper"
                        label={
                          <Group gap={4}>
                            <Box w={16} h={16} bg="var(--mantine-color-yellow-1)" />
                            Бумага
                          </Group>
                        }
                        color="yellow"
                      />
                    </Group>
                  </Radio.Group>
                ) : (
                  <Select
                    aria-label="Фон"
                    leftSection={<MoonIcon />}
                    data={[
                      { value: 'black', label: 'Чёрный' },
                      { value: 'gray', label: 'Серый' },
                      { value: 'paper', label: 'Бумага' },
                    ]}
                    value={background}
                    onChange={(value) => value && setBackground(value)}
                    allowDeselect={false}
                  />
                )
              }
            />
          )}
          {layout !== SETTINGS_LAYOUT.CURRENT && (
            <SettingsSlider
              icon={<SunIcon />}
              title="Яркость"
              description="Затемнение страниц в читалке"
              unit="%"
              value={brightness}
              range={{ MIN: 20, MAX: 100 }}
              presets={[
                { label: '20%', value: 20 },
                { label: '60%', value: 60 },
                { label: '100%', value: 100 },
              ]}
              onChange={setBrightness}
            />
          )}
        </GroupedList>
        {layout === SETTINGS_LAYOUT.GROUP && !disabled && (
          <Box className={styles.behavior}>
            <GroupedList label="Постраничный режим">{directionRows}</GroupedList>
          </Box>
        )}
        <Box className={styles.spacing}>
          <GroupedList label="Отступы и зона клика">
            {(isCurrent || !disabled) && (
              <SettingsSlider
                icon={<HandTapIcon />}
                title="Зона клика"
                description={
                  disabled
                    ? 'Только в постраничном режиме'
                    : 'Нажатие по краям экрана листает страницы'
                }
                unit="%"
                value={tap}
                range={READER_TAP_ZONE_WIDTH}
                presets={getPresets(READER_TAP_ZONE_WIDTH)}
                onChange={setTap}
                disabled={disabled}
                preview={<ReaderTapZonePreview tapZoneWidth={tap} />}
              />
            )}
            {(isCurrent || disabled) && (
              <SettingsSlider
                icon={<RowsIcon />}
                title="Отступ между страницами"
                description={
                  disabled ? 'Расстояние между страницами в ленте' : 'Только в вертикальном режиме'
                }
                unit="px"
                value={pageGap}
                range={READER_PAGE_GAP}
                presets={getPresets(READER_PAGE_GAP)}
                onChange={setPageGap}
                disabled={!disabled}
              />
            )}
            {(isCurrent || disabled) && (
              <SettingsSlider
                icon={<SplitVerticalIcon />}
                title="Отступ между главами"
                description={
                  disabled ? 'Разрыв ленты в месте окончания главы' : 'Только в вертикальном режиме'
                }
                unit="px"
                value={chapterGap}
                range={READER_CHAPTER_GAP}
                presets={getPresets(READER_CHAPTER_GAP)}
                onChange={setChapterGap}
                disabled={!disabled}
              />
            )}
          </GroupedList>
        </Box>
        <Box className={styles.behavior}>
          <GroupedList label="Поведение">
            <GroupedList.Row
              icon={<SkipForwardIcon />}
              title="Открывать следующую главу сразу"
              description="После последней страницы чтение продолжится"
              action={
                <Switch
                  aria-label="Открывать следующую главу сразу"
                  checked={autoNext}
                  onChange={(event) => setAutoNext(event.currentTarget.checked)}
                />
              }
            />
            <GroupedList.Row
              icon={<EyeClosedIcon />}
              title="Скрывать панели при прокрутке"
              description="Шапка и панель глав уезжают во время чтения"
              action={
                <Switch
                  aria-label="Скрывать панели при прокрутке"
                  checked={hidePanels}
                  onChange={(event) => setHidePanels(event.currentTarget.checked)}
                />
              }
            />
            {layout !== SETTINGS_LAYOUT.CURRENT && (
              <SettingsSlider
                icon={<ImageIcon />}
                title="Предзагрузка страниц"
                description="Количество следующих страниц, загружаемых заранее"
                unit=""
                value={prefetch}
                range={{ MIN: 0, MAX: 10 }}
                presets={[
                  { label: '0', value: 0 },
                  { label: '3', value: 3 },
                  { label: '10', value: 10 },
                ]}
                onChange={setPrefetch}
              />
            )}
            {layout !== SETTINGS_LAYOUT.CURRENT && (
              <GroupedList.Row
                icon={<EyeIcon />}
                title="Не гасить экран"
                description="Экран остаётся включённым во время чтения, если устройство это поддерживает"
                action={
                  <Switch
                    aria-label="Не гасить экран"
                    checked={wake}
                    onChange={(event) => setWake(event.currentTarget.checked)}
                  />
                }
              />
            )}
          </GroupedList>
        </Box>
      </Box>
    </Box>
  );
}

export default SettingsMock;
