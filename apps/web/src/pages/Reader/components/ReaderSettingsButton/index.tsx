import {
  ActionIcon,
  Drawer,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import {
  ArrowsHorizontalIcon,
  ArrowsOutLineHorizontalIcon,
  ArrowsOutLineVerticalIcon,
  ArrowsVerticalIcon,
  FadersHorizontalIcon,
  InfoIcon,
} from '@phosphor-icons/react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import {
  DEFAULT_READER_SETTINGS,
  READER_CHAPTER_GAP,
  READER_CONTAINER_WIDTH,
  READER_PAGE_FIT,
  READER_PAGE_GAP,
  READER_READING_MODE,
  READER_TAP_ZONE_WIDTH,
  type ReaderPageFit,
  type ReaderReadingMode,
  type ReaderSettings,
} from '@tanuki/contracts';
import useReaderSettings, { READER_SETTINGS_QUERY_KEY } from '../../hooks/useReaderSettings';
import useUpdateReaderSettings from '../../hooks/useUpdateReaderSettings';
import useTapZonesHint from './hooks/useTapZonesHint';
import ReaderSetting from './ReaderSetting';
import ReaderSettingRadioGroup from './ReaderSettingRadioGroup';
import ReaderSliderSetting from './ReaderSliderSetting';
import ReaderTapZonePreview from './ReaderTapZonePreview';
import ReaderTapZonesOverlay from './ReaderTapZonesOverlay';

function ReaderSettingsButton() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isDrawerOpened, setIsDrawerOpened] = useState(false);
  const { data } = useReaderSettings();
  const updateSettings = useUpdateReaderSettings();
  const tapZonesHint = useTapZonesHint();
  const settings = data ?? DEFAULT_READER_SETTINGS;

  // Подсветку зон поверх читалки показываем не на каждое закрытие drawer'а, а только когда
  // человек трогал то, что на них влияет: иначе она мигала бы и после правки, скажем, масштаба.
  const wasTapZoneTouched = useRef(false);

  const closeDrawer = () => {
    setIsDrawerOpened(false);
    if (wasTapZoneTouched.current && settings.readingMode === READER_READING_MODE.HORIZONTAL) {
      tapZonesHint.show();
    }
  };

  // Пока ползунок тащат, читалка должна перестраиваться сразу — раньше сохранения на бек (оно
  // уходит только по onChangeEnd). Пишем черновое значение прямо в кэш запроса: он и так общий
  // источник данных для ReaderPages, поэтому лишний контекст/проброс пропсов не нужен.
  const setDraftSettings = (patch: Partial<ReaderSettings>) =>
    queryClient.setQueryData(READER_SETTINGS_QUERY_KEY, { ...settings, ...patch });

  const readingModeItems = [
    {
      id: READER_READING_MODE.VERTICAL,
      title: t('vertical'),
      description: t('pagesStackedContinuousScroll'),
      icon: <ArrowsVerticalIcon />,
    },
    {
      id: READER_READING_MODE.HORIZONTAL,
      title: t('horizontal'),
      description: t('clickOrArrowsSwitchPage'),
      icon: <ArrowsHorizontalIcon />,
    },
  ];

  const pageFitItems = [
    {
      id: READER_PAGE_FIT.FIT_WIDTH,
      title: t('fitWidth'),
      description: t('pageFillsContainerWidth'),
      icon: <ArrowsOutLineHorizontalIcon />,
    },
    {
      id: READER_PAGE_FIT.FIT_HEIGHT,
      title: t('fitHeight'),
      description: t('heightFitsScreenFully'),
      icon: <ArrowsOutLineVerticalIcon />,
    },
  ];

  const containerWidthPresets = [
    { id: 'narrow', label: t('narrow'), value: READER_CONTAINER_WIDTH.NARROW },
    { id: 'medium', label: t('medium'), value: READER_CONTAINER_WIDTH.MEDIUM },
    { id: 'wide', label: t('wide'), value: READER_CONTAINER_WIDTH.WIDE },
  ];

  const tapZoneWidthPresets = [
    { id: 'narrow', label: t('narrow'), value: READER_TAP_ZONE_WIDTH.NARROW },
    { id: 'medium', label: t('medium'), value: READER_TAP_ZONE_WIDTH.MEDIUM },
    { id: 'wide', label: t('wide'), value: READER_TAP_ZONE_WIDTH.WIDE },
  ];

  const pageGapPresets = [
    { id: 'narrow', label: t('narrow'), value: READER_PAGE_GAP.NARROW },
    { id: 'medium', label: t('medium'), value: READER_PAGE_GAP.MEDIUM },
    { id: 'wide', label: t('wide'), value: READER_PAGE_GAP.WIDE },
  ];

  const chapterGapPresets = [
    { id: 'narrow', label: t('narrow'), value: READER_CHAPTER_GAP.NARROW },
    { id: 'medium', label: t('medium'), value: READER_CHAPTER_GAP.MEDIUM },
    { id: 'wide', label: t('wide'), value: READER_CHAPTER_GAP.WIDE },
  ];

  return (
    <>
      <ActionIcon
        variant="subtle"
        color="gray"
        size="lg"
        onClick={() => {
          wasTapZoneTouched.current = false;
          setIsDrawerOpened(true);
        }}
      >
        <FadersHorizontalIcon />
      </ActionIcon>
      <Drawer
        opened={isDrawerOpened}
        onClose={closeDrawer}
        position="right"
        title={t('readerSettings')}
      >
        <ScrollArea type="auto" offsetScrollbars="y" flex={1} mih={0}>
          <Stack gap="lg">
            <ReaderSetting label={t('readingMode')}>
              <ReaderSettingRadioGroup
                value={settings.readingMode}
                items={readingModeItems}
                onChange={(value) => {
                  // Переход в горизонтальный — единственный момент, когда зоны клика вообще
                  // появляются, так что показать их после закрытия так же уместно, как и правку их
                  // ширины.
                  wasTapZoneTouched.current = true;
                  updateSettings.mutate({ ...settings, readingMode: value as ReaderReadingMode });
                }}
              />
            </ReaderSetting>

            <ReaderSetting label={t('pageScale')}>
              <ReaderSettingRadioGroup
                value={settings.pageFit}
                items={pageFitItems}
                onChange={(value) =>
                  updateSettings.mutate({ ...settings, pageFit: value as ReaderPageFit })
                }
              />
            </ReaderSetting>

            {/* «Страница целиком» подгоняет страницу по высоте экрана, ширину контейнера при этом
              не смотрит — настраивать нечего. */}
            {settings.pageFit === READER_PAGE_FIT.FIT_WIDTH && (
              <ReaderSliderSetting
                label={t('containerWidth')}
                unit="px"
                value={settings.containerWidth}
                min={READER_CONTAINER_WIDTH.MIN}
                max={READER_CONTAINER_WIDTH.MAX}
                presets={containerWidthPresets}
                onChange={(containerWidth) => setDraftSettings({ containerWidth })}
                onChangeEnd={(containerWidth) =>
                  updateSettings.mutate({ ...settings, containerWidth })
                }
              />
            )}

            {settings.readingMode === READER_READING_MODE.HORIZONTAL && (
              <ReaderSliderSetting
                label={t('clickArea')}
                unit="%"
                value={settings.tapZoneWidth}
                min={READER_TAP_ZONE_WIDTH.MIN}
                max={READER_TAP_ZONE_WIDTH.MAX}
                presets={tapZoneWidthPresets}
                preview={<ReaderTapZonePreview tapZoneWidth={settings.tapZoneWidth} />}
                onChange={(tapZoneWidth) => {
                  wasTapZoneTouched.current = true;
                  setDraftSettings({ tapZoneWidth });
                }}
                onChangeEnd={(tapZoneWidth) => updateSettings.mutate({ ...settings, tapZoneWidth })}
              />
            )}

            {/* В горизонтальном режиме видна ровно одна страница — отступ между ними никогда не
              показывается, настраивать нечего. Отступ между главами там же не нужен по той же
              причине: главы сменяют друг друга страницей, а не разрывом в ленте. */}
            {settings.readingMode === READER_READING_MODE.VERTICAL && (
              <>
                <ReaderSliderSetting
                  label={t('gapBetweenPages')}
                  unit="px"
                  value={settings.pageGap}
                  min={READER_PAGE_GAP.MIN}
                  max={READER_PAGE_GAP.MAX}
                  presets={pageGapPresets}
                  onChange={(pageGap) => setDraftSettings({ pageGap })}
                  onChangeEnd={(pageGap) => updateSettings.mutate({ ...settings, pageGap })}
                />

                <ReaderSliderSetting
                  label={t('gapBetweenChapters')}
                  unit="px"
                  value={settings.chapterGap}
                  min={READER_CHAPTER_GAP.MIN}
                  max={READER_CHAPTER_GAP.MAX}
                  presets={chapterGapPresets}
                  onChange={(chapterGap) => setDraftSettings({ chapterGap })}
                  onChangeEnd={(chapterGap) => updateSettings.mutate({ ...settings, chapterGap })}
                />
              </>
            )}

            <Paper withBorder p="sm" radius="md">
              <Group gap="xs" align="flex-start" wrap="nowrap">
                <ThemeIcon variant="light" color="gray" radius="xl">
                  <InfoIcon />
                </ThemeIcon>
                <Text fz={12} c="dimmed" lh={1.3}>
                  {t('menuHidesOnScrollTap')}
                </Text>
              </Group>
            </Paper>
          </Stack>
        </ScrollArea>
      </Drawer>
      {settings.readingMode === READER_READING_MODE.HORIZONTAL && (
        <ReaderTapZonesOverlay
          tapZoneWidth={settings.tapZoneWidth}
          visible={tapZonesHint.isVisible}
        />
      )}
    </>
  );
}

export default ReaderSettingsButton;
